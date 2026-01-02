import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import User from '#models/user'
import Role from '#models/role'
import {
  createUserValidator,
  updateUserValidator,
  resetPasswordValidator,
  listUsersValidator,
  validatePasswordNoPersonalInfo,
} from '#validators/user'

/**
 * Contrôleur des utilisateurs
 * Gestion des utilisateurs au sein d'une association
 */
export default class UsersController {
  /**
   * GET /api/v1/users
   * Lister les utilisateurs
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const filters = await request.validateUsing(listUsersValidator)

    const page = filters.page || 1
    const limit = filters.limit || 20

    const query = User.query()
      .whereNull('deletedAt')
      .preload('role')

    // Filtrer par association (sauf super_admin)
    if (!currentUser.isSuperAdmin) {
      query.where('associationId', currentUser.associationId!)
    }

    // Filtres optionnels
    if (filters.search) {
      query.where((q) => {
        q.whereILike('firstname', `%${filters.search}%`)
          .orWhereILike('lastname', `%${filters.search}%`)
          .orWhereILike('email', `%${filters.search}%`)
      })
    }

    if (filters.roleId) {
      query.where('roleId', filters.roleId)
    }

    if (filters.roleName) {
      query.whereHas('role', (q) => {
        q.where('name', filters.roleName!)
      })
    }

    if (filters.isActive !== undefined) {
      query.where('isActive', filters.isActive)
    }

    // Tri
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'
    query.orderBy(sortBy, sortOrder)

    // Pagination
    const users = await query.paginate(page, limit)

    return response.ok({
      success: true,
      data: {
        users: users.all().map((u) => u.serialize()),
        meta: {
          total: users.total,
          perPage: users.perPage,
          currentPage: users.currentPage,
          lastPage: users.lastPage,
        },
      },
    })
  }

  /**
   * POST /api/v1/users
   * Créer un utilisateur
   */
  async store({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const payload = await request.validateUsing(createUserValidator)

    // Vérifier que le mot de passe ne contient pas le nom/prénom
    const passwordCheck = validatePasswordNoPersonalInfo(
      payload.password,
      payload.firstname,
      payload.lastname
    )
    if (!passwordCheck.valid) {
      return response.badRequest({
        success: false,
        message: 'Mot de passe invalide',
        errors: passwordCheck.errors.map((msg: any) => ({ message: msg, field: 'password' })),
      })
    }

    // Récupérer le rôle demandé
    const targetRole = await Role.find(payload.roleId)
    if (!targetRole) {
      return response.badRequest({
        success: false,
        message: 'Rôle invalide',
      })
    }

    // Vérifier que l'utilisateur ne crée pas un rôle supérieur ou égal au sien
    if (targetRole.level >= currentUser.roleLevel && !currentUser.isSuperAdmin) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas créer un utilisateur avec un rôle supérieur ou égal au vôtre',
      })
    }

    // Créer l'utilisateur
    const user = await User.create({
      associationId: currentUser.isSuperAdmin
        ? payload.associationId || currentUser.associationId
        : currentUser.associationId,
      roleId: payload.roleId,
      email: payload.email,
      password: payload.password,
      firstname: payload.firstname,
      lastname: payload.lastname,
      phone: payload.phone,
      city_code: payload.city_code,
      dateOfBirth: DateTime.fromJSDate(new Date(payload.dateOfBirth)),
      sexe: payload.sexe,
      isActive: true,
      failedLoginAttempts: 0,
      mustChangePassword: true,
    })

    await user.load('role')

    return response.created({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: user.serialize(),
      },
    })
  }

  /**
   * GET /api/v1/users/:id
   * Voir un utilisateur
   */
  async show({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role', (query) => query.preload('permissions'))
      .preload('association')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès (même association ou super_admin)
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    return response.ok({
      success: true,
      data: {
        user: user.serialize(),
        association: user.association?.serialize() ?? null,
      },
    })
  }

  /**
   * PUT /api/v1/users/:id
   * Modifier un utilisateur
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const payload = await request.validateUsing(updateUserValidator)

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Empêcher la modification d'un utilisateur de niveau supérieur ou égal
    if (!currentUser.canManage(user)) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas modifier cet utilisateur',
      })
    }

    // Si on change le rôle, vérifier que le nouveau rôle est de niveau inférieur
    if (payload.roleId) {
      const newRole = await Role.find(payload.roleId)
      if (!newRole) {
        return response.badRequest({
          success: false,
          message: 'Rôle invalide',
        })
      }

      if (newRole.level >= currentUser.roleLevel && !currentUser.isSuperAdmin) {
        return response.forbidden({
          success: false,
          message: 'Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre',
        })
      }
    }

    // Vérifier unicité email si modifié
    if (payload.email && payload.email !== user.email) {
      const existingUser = await User.findBy('email', payload.email)
      if (existingUser) {
        return response.badRequest({
          success: false,
          message: 'Cet email est déjà utilisé',
        })
      }
    }

    // Mettre à jour
    const { dateOfBirth, ...restPayload } = payload
    user.merge(restPayload)
    await user.save()
    await user.load('role')

    return response.ok({
      success: true,
      message: 'Utilisateur mis à jour',
      data: {
        user: user.serialize(),
      },
    })
  }

  /**
   * DELETE /api/v1/users/:id
   * Supprimer un utilisateur (soft delete)
   */
  async destroy({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Empêcher de supprimer un utilisateur de niveau supérieur ou égal
    if (!currentUser.canManage(user)) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas supprimer cet utilisateur',
      })
    }

    // Empêcher de se supprimer soi-même
    if (user.id === currentUser.id) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte',
      })
    }

    // Soft delete
    user.deletedAt = DateTime.now()
    user.isActive = false
    await user.save()

    return response.ok({
      success: true,
      message: 'Utilisateur supprimé',
    })
  }

  /**
   * POST /api/v1/users/:id/toggle-active
   * Activer/Désactiver un utilisateur
   */
  async toggleActive({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Empêcher de modifier un utilisateur de niveau supérieur ou égal
    if (!currentUser.canManage(user)) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas modifier cet utilisateur',
      })
    }

    // Empêcher de se désactiver soi-même
    if (user.id === currentUser.id) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte',
      })
    }

    user.isActive = !user.isActive
    await user.save()

    return response.ok({
      success: true,
      message: user.isActive ? 'Utilisateur activé' : 'Utilisateur désactivé',
      data: {
        user: user.serialize(),
      },
    })
  }

  /**
   * POST /api/v1/users/:id/reset-password
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetPassword({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const payload = await request.validateUsing(resetPasswordValidator)

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Empêcher de reset le mdp d'un utilisateur de niveau supérieur ou égal
    if (!currentUser.canManage(user)) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas réinitialiser le mot de passe de cet utilisateur',
      })
    }

    user.password = payload.newPassword
    user.mustChangePassword = true
    await user.save()

    return response.ok({
      success: true,
      message: 'Mot de passe réinitialisé. L\'utilisateur devra le changer à sa prochaine connexion.',
    })
  }

  /**
   * PUT /api/v1/users/:id/change-role
   * Changer le rôle d'un utilisateur
   */
  async changeRole({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const { roleId } = request.only(['roleId'])

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Empêcher de modifier un utilisateur de niveau supérieur ou égal
    if (!currentUser.canManage(user)) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas modifier le rôle de cet utilisateur',
      })
    }

    // Récupérer le nouveau rôle
    const newRole = await Role.find(roleId)
    if (!newRole || !newRole.isActive) {
      return response.badRequest({
        success: false,
        message: 'Rôle invalide ou inactif',
      })
    }

    // Vérifier que le nouveau rôle est de niveau inférieur au sien
    if (newRole.level >= currentUser.roleLevel && !currentUser.isSuperAdmin) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas attribuer un rôle supérieur ou égal au vôtre',
      })
    }

    user.roleId = newRole.id
    await user.save()
    await user.load('role')

    return response.ok({
      success: true,
      message: `Rôle modifié en "${newRole.displayName}"`,
      data: {
        user: user.serialize(),
      },
    })
  }

  /**
   * GET /api/v1/users/me
   * Récupérer le profil de l'utilisateur connecté
   */
  async me({ auth, response }: HttpContext) {
    const currentUser = auth.user!

    await currentUser.loadRoleWithPermissions()

    if (currentUser.associationId) {
      await currentUser.load('association')
    }

    return response.ok({
      success: true,
      data: {
        user: currentUser.serialize(),
        association: currentUser.association?.serialize() ?? null,
      },
    })
  }

  /**
   * PUT /api/v1/users/me
   * Modifier son propre profil
   */
  async updateMe({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Seuls certains champs sont modifiables par l'utilisateur lui-même
    const { firstname, lastname, phone, city_code } = request.only([
      'firstname',
      'lastname',
      'phone',
      'city_code',
    ])

    if (firstname) currentUser.firstname = firstname
    if (lastname) currentUser.lastname = lastname
    if (phone) currentUser.phone = phone
    if (city_code) currentUser.city_code = city_code

    await currentUser.save()
    await currentUser.loadRoleWithPermissions()

    return response.ok({
      success: true,
      message: 'Profil mis à jour',
      data: {
        user: currentUser.serialize(),
      },
    })
  }

  /**
   * PUT /api/v1/users/me/password
   * Changer son propre mot de passe
   */
  async changeMyPassword({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    const { currentPassword, newPassword, newPasswordConfirmation } = request.only([
      'currentPassword',
      'newPassword',
      'newPasswordConfirmation',
    ])

    // Vérifier le mot de passe actuel
    try {
      await User.verifyCredentials(currentUser.email, currentPassword)
    } catch {
      return response.badRequest({
        success: false,
        message: 'Mot de passe actuel incorrect',
      })
    }

    // Vérifier la confirmation
    if (newPassword !== newPasswordConfirmation) {
      return response.badRequest({
        success: false,
        message: 'Les mots de passe ne correspondent pas',
      })
    }

    // Vérifier que le nouveau mot de passe ne contient pas le nom/prénom
    const passwordCheck = validatePasswordNoPersonalInfo(
      newPassword,
      currentUser.firstname,
      currentUser.lastname
    )
    if (!passwordCheck.valid) {
      return response.badRequest({
        success: false,
        message: 'Mot de passe invalide',
        errors: passwordCheck.errors,
      })
    }

    currentUser.password = newPassword
    currentUser.mustChangePassword = false
    await currentUser.save()

    return response.ok({
      success: true,
      message: 'Mot de passe modifié avec succès',
    })
  }

   /**
   * ========================================
   * GESTION DES CANDIDATS / UTILISATEURS EN ATTENTE
   * ========================================
   */

  /**
   * GET /api/v1/users/pending
   * Liste des utilisateurs en attente de validation (candidats)
   */
  async pending({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const query = User.query()
      .whereNull('deletedAt')
      .where('isActive', false)
      .whereHas('role', (q) => q.where('name', 'candidat'))
      .preload('role')
      .orderBy('createdAt', 'desc')

    // Filtrer par association (sauf super_admin)
    if (!currentUser.isSuperAdmin) {
      query.where('associationId', currentUser.associationId!)
    }

    const users = await query.paginate(page, limit)

    return response.ok({
      success: true,
      data: {
        users: users.all().map((u) => u.serialize()),
        meta: {
          total: users.total,
          perPage: users.perPage,
          currentPage: users.currentPage,
          lastPage: users.lastPage,
        },
      },
    })
  }

  /**
   * POST /api/v1/users/:id/approve
   * Approuver un utilisateur (candidat → cadet)
   */
  async approve({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès (même association ou super_admin)
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Vérifier que c'est bien un candidat
    if (user.role?.name !== 'candidat') {
      return response.badRequest({
        success: false,
        message: 'Cet utilisateur n\'est pas un candidat en attente',
      })
    }

    // Récupérer le rôle cible (par défaut: cadet)
    const targetRoleName = request.input('role', 'cadet')
    const Role = (await import('#models/role')).default
    const targetRole = await Role.findBy('name', targetRoleName)

    if (!targetRole) {
      return response.badRequest({
        success: false,
        message: 'Rôle cible invalide',
      })
    }

    // Vérifier que l'utilisateur peut assigner ce rôle
    if (targetRole.level >= currentUser.roleLevel && !currentUser.isSuperAdmin) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas assigner un rôle supérieur ou égal au vôtre',
      })
    }

    // Approuver l'utilisateur
    user.roleId = targetRole.id
    user.isActive = true
    await user.save()
    await user.load('role')

    return response.ok({
      success: true,
      message: `Utilisateur approuvé en tant que "${targetRole.displayName}"`,
      data: {
        user: user.serialize(),
      },
    })
  }

  /**
   * POST /api/v1/users/:id/reject
   * Rejeter un utilisateur (candidat)
   */
  async reject({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const user = await User.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('role')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'accès (même association ou super_admin)
    if (!currentUser.isSuperAdmin && user.associationId !== currentUser.associationId) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Vérifier que c'est bien un candidat
    if (user.role?.name !== 'candidat') {
      return response.badRequest({
        success: false,
        message: 'Cet utilisateur n\'est pas un candidat en attente',
      })
    }

    const reason = request.input('reason')
    const deleteUser = request.input('delete', false)

    if (deleteUser) {
      // Suppression définitive
      await user.delete()

      return response.ok({
        success: true,
        message: 'Candidature rejetée et supprimée',
      })
    } else {
      // Soft delete (garde l'historique)
      user.deletedAt = DateTime.now()
      user.isActive = false
      await user.save()

      return response.ok({
        success: true,
        message: 'Candidature rejetée',
        data: {
          reason: reason || 'Non spécifiée',
        },
      })
    }
  }
}