import type { HttpContext } from '@adonisjs/core/http'
import Role from '#models/role'
import Permission from '#models/permission'

/**
 * Contrôleur des rôles et permissions
 * API pour récupérer les rôles/permissions (utilisé par le front)
 */
export default class RolesController {
  /**
   * GET /api/v1/roles
   * Liste tous les rôles actifs avec leurs permissions
   */
  async index({ auth, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle de l'utilisateur si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    let query = Role.query()
      .where('isActive', true)
      .preload('permissions')
      .orderBy('level', 'desc')

    // Si pas super_admin, ne montrer que les rôles de niveau inférieur
    if (!currentUser.isSuperAdmin && currentUser.role) {
        const userLevel = Number(currentUser.role.level)
        query.where('level', '<', userLevel)
    }

    const roles = await query

    return response.ok({
      success: true,
      data: {
        roles: roles.map((r) => r.serialize()),
      },
    })
  }

  /**
   * GET /api/v1/roles/:id
   * Détails d'un rôle avec ses permissions
   */
  async show({ params, response }: HttpContext) {
    const role = await Role.query()
      .where('id', params.id)
      .where('isActive', true)
      .preload('permissions')
      .first()

    if (!role) {
      return response.notFound({
        success: false,
        message: 'Rôle non trouvé',
      })
    }

    return response.ok({
      success: true,
      data: {
        role: role.serialize(),
      },
    })
  }

  /**
   * GET /api/v1/roles/assignable
   * Liste des rôles que l'utilisateur peut assigner
   * (rôles de niveau strictement inférieur au sien)
   * Exclut: cadet, cadet_brevete, candidat et rôles uniques déjà occupés
   */
  async assignable({ auth, response }: HttpContext) {
    const currentUser = auth.user!

    // Charger le rôle si pas déjà fait
    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const userLevel = Number(currentUser.role?.level ?? 0)

    // Récupérer tous les rôles assignables
    const roles = await Role.query()
      .where('isActive', true)
      .where('level', '<', userLevel)
      .whereNotIn('name', ['cadet', 'cadet_brevete', 'candidat'])
      .withCount('users', (query) => {
        query.whereNull('deletedAt').where('associationId', currentUser.associationId ?? 0)
      })
      .orderBy('level', 'desc')

    // Filtrer les rôles uniques déjà occupés
    const availableRoles = roles.filter((role) => {
      if (!role.isUnique) return true
      const usersCount = Number(role.$extras.users_count) || 0
      return usersCount === 0
    })

    return response.ok({
      success: true,
      data: {
        roles: availableRoles.map((r) => r.serializeBasic()),
      },
    })
  }

  /**
   * GET /api/v1/permissions
   * Liste toutes les permissions actives (groupées)
   */
  async permissions({ response }: HttpContext) {
    const permissions = await Permission.query()
      .where('isActive', true)
      .orderBy('group')
      .orderBy('name')

    // Grouper par groupe
    const grouped = permissions.reduce(
      (acc, perm) => {
        if (!acc[perm.group]) {
          acc[perm.group] = []
        }
        acc[perm.group].push(perm.serialize())
        return acc
      },
      {} as Record<string, ReturnType<typeof Permission.prototype.serialize>[]>
    )

    return response.ok({
      success: true,
      data: {
        permissions: grouped,
        all: permissions.map((p) => p.serialize()),
      },
    })
  }

  /**
   * GET /api/v1/me/permissions
   * Retourne les permissions de l'utilisateur connecté
   * (utile pour le front pour gérer l'affichage)
   */
  async myPermissions({ auth, response }: HttpContext) {
    const currentUser = auth.user!

    await currentUser.loadRoleWithPermissions()

    return response.ok({
      success: true,
      data: {
        role: currentUser.role?.serializeBasic() ?? null,
        permissions: currentUser.permissions,
        isSuperAdmin: currentUser.isSuperAdmin,
        isAdmin: currentUser.isAdmin,
      },
    })
  }

  /**
   * ========================================
   * CRUD Rôles (Super Admin uniquement)
   * ========================================
   */

  /**
   * POST /api/v1/admin/roles
   * Créer un nouveau rôle personnalisé
   */
  async store({ request, response }: HttpContext) {
    const { name, displayName, description, level, permissionIds } = request.only([
      'name',
      'displayName',
      'description',
      'level',
      'permissionIds',
    ])

    // Vérifier que le nom n'existe pas
    const existing = await Role.findBy('name', name)
    if (existing) {
      return response.badRequest({
        success: false,
        message: 'Un rôle avec ce nom existe déjà',
      })
    }

    const role = await Role.create({
      name,
      displayName,
      description,
      level: level || 10,
      isSystem: false,
      isActive: true,
    })

    // Attacher les permissions
    if (permissionIds && Array.isArray(permissionIds)) {
      await role.related('permissions').sync(permissionIds)
    }

    await role.load('permissions')

    return response.created({
      success: true,
      message: 'Rôle créé avec succès',
      data: {
        role: role.serialize(),
      },
    })
  }

  /**
   * PUT /api/v1/admin/roles/:id
   * Modifier un rôle
   */
  async update({ params, request, response }: HttpContext) {
    const role = await Role.find(params.id)

    if (!role) {
      return response.notFound({
        success: false,
        message: 'Rôle non trouvé',
      })
    }

    // Empêcher la modification des rôles système
    if (role.isSystem) {
      return response.forbidden({
        success: false,
        message: 'Les rôles système ne peuvent pas être modifiés',
      })
    }

    const { displayName, description, level, permissionIds, isActive } = request.only([
      'displayName',
      'description',
      'level',
      'permissionIds',
      'isActive',
    ])

    role.merge({
      displayName: displayName ?? role.displayName,
      description: description ?? role.description,
      level: level ?? role.level,
      isActive: isActive ?? role.isActive,
    })

    await role.save()

    // Mettre à jour les permissions
    if (permissionIds && Array.isArray(permissionIds)) {
      await role.related('permissions').sync(permissionIds)
    }

    await role.load('permissions')

    return response.ok({
      success: true,
      message: 'Rôle mis à jour',
      data: {
        role: role.serialize(),
      },
    })
  }

  /**
   * DELETE /api/v1/admin/roles/:id
   * Supprimer un rôle (si non système et non utilisé)
   */
  async destroy({ params, response }: HttpContext) {
    const role = await Role.query()
      .where('id', params.id)
      .withCount('users')
      .first()

    if (!role) {
      return response.notFound({
        success: false,
        message: 'Rôle non trouvé',
      })
    }

    if (role.isSystem) {
      return response.forbidden({
        success: false,
        message: 'Les rôles système ne peuvent pas être supprimés',
      })
    }

    // Vérifier si des utilisateurs utilisent ce rôle
    const usersCount = Number(role.$extras.users_count) || 0
    if (usersCount > 0) {
      return response.badRequest({
        success: false,
        message: `Ce rôle est utilisé par ${usersCount} utilisateur(s). Réassignez-les d'abord.`,
      })
    }

    // Détacher les permissions et supprimer
    await role.related('permissions').detach()
    await role.delete()

    return response.ok({
      success: true,
      message: 'Rôle supprimé',
    })
  }

  /**
   * PUT /api/v1/admin/roles/:id/permissions
   * Mettre à jour les permissions d'un rôle
   */
  async updatePermissions({ params, request, response }: HttpContext) {
    const role = await Role.find(params.id)

    if (!role) {
      return response.notFound({
        success: false,
        message: 'Rôle non trouvé',
      })
    }

    // Empêcher la modification des rôles système (sauf super_admin)
    if (role.isSystem && role.name !== 'super_admin') {
      return response.forbidden({
        success: false,
        message: 'Les permissions des rôles système ne peuvent pas être modifiées',
      })
    }

    const { permissionIds } = request.only(['permissionIds'])

    if (!permissionIds || !Array.isArray(permissionIds)) {
      return response.badRequest({
        success: false,
        message: 'Liste des permissions invalide',
      })
    }

    // Vérifier que toutes les permissions existent
    const permissions = await Permission.query()
      .whereIn('id', permissionIds)
      .where('isActive', true)

    if (permissions.length !== permissionIds.length) {
      return response.badRequest({
        success: false,
        message: 'Certaines permissions sont invalides ou inactives',
      })
    }

    await role.related('permissions').sync(permissionIds)
    await role.load('permissions')

    return response.ok({
      success: true,
      message: 'Permissions mises à jour',
      data: {
        role: role.serialize(),
      },
    })
  }

  /**
   * GET /api/v1/admin/roles/:id/users
   * Liste des utilisateurs ayant ce rôle
   */
  async users({ params, request, response }: HttpContext) {
    const role = await Role.find(params.id)

    if (!role) {
      return response.notFound({
        success: false,
        message: 'Rôle non trouvé',
      })
    }

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const users = await role
      .related('users')
      .query()
      .whereNull('deletedAt')
      .preload('association')
      .paginate(page, limit)

    return response.ok({
      success: true,
      data: {
        role: role.serializeBasic(),
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
}