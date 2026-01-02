import Association from '#models/association'
import { approveAssociationValidator, listAssociationValidator, rejectAssociationValidator, updateAssociationValidator } from '#validators/association'
import type { HttpContext } from '@adonisjs/core/http'
import { AssociationStatus } from '../../types/HelperPermAndRole.js'
import { DateTime } from 'luxon'
import User from '#models/user'
import { listUsersValidator } from '#validators/user'
import Role from '#models/role'
import Document from '#models/document'
import Folder from '#models/document'

/**
 * /api/v1/association
 * Contrôleur des associations
 * Réservé au super_admin 
 */
export default class AssociationsController {

    /**
     * GET /staffApp/all-associations
     * Lister toutes les associations
     */
    async allAssociations({ request, response}: HttpContext) {
        const filters = await request.validateUsing(listAssociationValidator)
        const page = filters.page || 1
        const limit = filters.limit || 20

        const query = Association.query()

        if (filters.search) {
            query.where((q) => {
                q.whereILike('name', `%${filters.search}%`)
                    .orWhereILike('email', `%${filters.search}%`)
                    .orWhereILike('rna', `%${filters.search}%`)
                    .orWhereILike('siret', `%${filters.search}%`)
            })
        }

        if (filters.status) {
            query.where('status', filters.status)
        }

        // Tri
        const sortBy = filters.sortBy || 'createdAt'
        const sortOrder = filters.sortOrder ||'desc'
        query.orderBy(sortBy, sortOrder)

        const associations = await query.paginate(page, limit)

        return response.ok({
            success: true,
            data: {
                associations: associations.all().map((a) => a.serialize()),
                meta: {
                    total: associations.total,
                    perPage: associations.perPage,
                    currentPage: associations.currentPage,
                    lastPage: associations.lastPage,
                },
            },
        })
    }

    /**
     * GET /staffApp/pending-associations
     * Associations en attente de validation
     */
    async pendingAssociations({ response }: HttpContext) {
        const associations = await Association.query()
            .where('status', AssociationStatus.PENDING)
            .orderBy('createdAt', 'asc')

        return response.ok({
            success: true,
            data: {
                associations: associations.map((a) => a.serialize()),
                count: associations.length,
            },
        })
    }

    /**
     * POST /staffApp/associations/:id/approve
     * Approuver une association
     * 
     * Dans un futur proche faire en sorte d'approuver automatiquement à l'aide d'analyse
     */
    async approve({ params, request, response }: HttpContext) {
        const association = await Association.find(params.id)

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })
        }

        if (association.status !== AssociationStatus.PENDING) {
            return response.badRequest({
                success: false,
                message: 'Cette association n\'est pas en attente de validation',
            })
        }

        const payload = await request.validateUsing(approveAssociationValidator)
        const subscriptionMonths = payload.subscriptionMonths || 12

        association.status = AssociationStatus.ACTIVE
        association.approvedAt = DateTime.now()
        association.subscribedAt = DateTime.now()
        association.subscriptionEndsAt = DateTime.now().plus({ months: subscriptionMonths})
        await association.save()

        await User.query()
            .where('associationId', association.id)
            .update({ isActive: true })

        return response.ok({
            success: true,
            message: 'Association approuvée avec succès',
            data: {
                association: association.serialize(),
            },
        })
    }

    /**
     * POST /staffApp/associations/:id/reject
     * Rejeter une association
     * Cas 1 : Ne dispose pas de siret
     * Cas 2 : Fausse déclaration
     */
    async reject({ params, request, response }: HttpContext) {
        const association = await Association.find(params.id)

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée'
            })
        }

        if (association.status !== AssociationStatus.PENDING) {
            return response.badRequest({
                success: false,
                message: 'Cette association n\'est pas en attente de validation',
            })
        }
        
        const payload = await request.validateUsing(rejectAssociationValidator)

        association.status = AssociationStatus.CANCELLED
        await association.save()

        // Todo par la suite envoie de mail
        console.log(`Association ${association.name} rejetée : ${payload.reason}`)

        return response.ok({
            success: true,
            message: 'Association rejetée',
            data: {
                association: association.serialize(),
                reason: payload.reason
            },
        })
    }

    /**
     * POST /staffApp/associations/:id/suspend
     * Suspendre une association
     */
    async suspend({ params, response }: HttpContext) {
        const association = await Association.find(params.id)

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })   
        }

        association.status = AssociationStatus.SUSPENDED
        await association.save()

        await User.query()
            .where('associationId', association.id)
            .update({ isActive: false})

        return response.ok({
            success: true,
            message: 'Association suspendue',
            data: {
                association: association.serialize(),
            }
        })
    }

    /**
     * POST /staffApp/associations/:id/reactivate
     * Réactiver une association suspendue
     */
    async reactivate({ params, response }: HttpContext) {
        const association = await Association.find(params.id)

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })
        }

        association.status = AssociationStatus.ACTIVE
        await association.save()

        await User.query()
            .where('associationId', association.id)
            .where('role', 'admin')
            .update({ isActive: true})
        
        return response.ok({
            success: true,
            message: 'Association réactivée',
            data: {
                association: association.serialize(),
            },
        })
    }

     /**
   * ========================================
   * ROUTES UTILISATEUR AUTHENTIFIÉ
   * ========================================
   */

    /**
     * GET /api/v1/my-association
     * Récupérer mon association
     */
    async myAssociation({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        currentUserNotFound(currentUser.associationId ?? 0, response)

        const association = await Association.query()
            .where('id', currentUser.associationId ?? 0)
            .withCount('users')
            .first()

        if (!association) {
        return response.notFound({
            success: false,
            message: 'Association non trouvée',
        })
        }

        return response.ok({
        success: true,
        data: {
            association: {
            ...association.serialize(),
            usersCount: Number(association.$extras.users_count) || 0,
            },
        },
        })
    }

    /**
     * PUT /api/v1/my-association
     * Modifier mon association (admin de l'association uniquement)
     */
    async updateMyAssociation({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        // Charger le rôle si pas déjà fait
        if (!currentUser.role) {
        await currentUser.loadRoleWithPermissions()
        }

        // Vérifier que l'utilisateur est admin ou président de l'association
        const canEdit = currentUser.isSuperAdmin || 
                        currentUser.hasRole('admin') || 
                        currentUser.hasRole('president')

        if (!canEdit) {
        return response.forbidden({
            success: false,
            message: 'Vous n\'avez pas les droits pour modifier cette association',
        })
        }

        if (!currentUser.associationId) {
        return response.notFound({
            success: false,
            message: 'Vous n\'êtes rattaché à aucune association',
        })
        }

        const association = await Association.find(currentUser.associationId)

        if (!association) {
        return response.notFound({
            success: false,
            message: 'Association non trouvée',
        })
        }

        // Seuls certains champs peuvent être modifiés par l'association elle-même
        const payload = request.only([
        'name',
        'email',
        'phone',
        'address',
        'city',
        'postalCode',
        ])

        // Vérifier unicité email si modifié
        if (payload.email && payload.email !== association.email) {
        const existingAssociation = await Association.findBy('email', payload.email)
        if (existingAssociation) {
            return response.badRequest({
            success: false,
            message: 'Cet email est déjà utilisé par une autre association',
            })
        }
        }

        association.merge(payload)
        await association.save()

        return response.ok({
        success: true,
        message: 'Association mise à jour',
        data: {
            association: association.serialize(),
        },
        })
    }

     /**
     * GET /api/v1/my-association/stats
     * Statistiques de mon association
     */
    async myAssociationStats({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.associationId) {
        return response.notFound({
            success: false,
            message: 'Vous n\'êtes rattaché à aucune association',
        })
        }

        // Compter les utilisateurs par rôle
        const usersByRole = await User.query()
            .where('associationId', currentUser.associationId)
            .whereNull('deletedAt')
            .preload('role')
            .select('roleId')
            .groupBy('roleId')
            .count('* as count')

        // Compter les utilisateurs actifs/inactifs
        const activeUsers = await User.query()
            .where('associationId', currentUser.associationId)
            .whereNull('deletedAt')
            .where('isActive', true)
            .count('* as count')

        const inactiveUsers = await User.query()
            .where('associationId', currentUser.associationId)
            .whereNull('deletedAt')
            .where('isActive', false)
            .count('* as count')

        // Compter les documents de l'association
        const documentsCount = await Document.query()
            .where('associationId', currentUser.associationId)
            .whereNull('deletedAt')
            .count('* as count')

        // Compter les dossiers de l'association
        const foldersCount = await Folder.query()
            .where('associationId', currentUser.associationId)
            .whereNull('deletedAt')
            .count('* as count')

        return response.ok({
            success: true,
            data: {
                stats: {
                usersByRole: usersByRole,
                activeUsers: Number(activeUsers[0].$extras.count) || 0,
                inactiveUsers: Number(inactiveUsers[0].$extras.count) || 0,
                documentsCount: Number(documentsCount[0].$extras.count) || 0,
                foldersCount: Number(foldersCount[0].$extras.count) || 0,
                },
            },
        })
    }

    /**
     * PUT /admin/associations/:id
     * Modifier une association
     * 
     * Cas 1 : Seul l'admin de l'association peux modifier
     */
    async update({ params, request, response }: HttpContext) {
        const association = await Association.find(params.id)

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })
        }

        const payload = await request.validateUsing(updateAssociationValidator)
        association.merge(payload)
        await association.save()

        return response.ok({
            success: true,
            message: 'Association mise à jour',
            data: {
                association: association.serialize(),
            },
        })
    }

    /**
     * POST /admin/associations/:id/extend-subscription
     */
    async extendSubscription({ params, request, response }: HttpContext) {
        const association = await Association.find(params.id)

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })
        }

        const months = request.input('months', 12)
        const baseDate = association.subscriptionEndsAt && association.subscriptionEndsAt > DateTime.now()
            ? association.subscriptionEndsAt
            : DateTime.now()
        association.subscriptionEndsAt = baseDate.plus({ months })
        await association.save()

        return response.ok({
            succes: true,
            message: `Abonnement prolongé de ${months} mois`,
            data: {
                association: association.serialize(),
            },
        })
    }

    /**
     * GET /associations/:id/occupied-roles
     * Récupérer les rôles déjà occupés dans une association
     * Route publique pour l'inscription des membres
     */
    async getOccupiedRoles({ params, response }: HttpContext) {
        const association = await Association.find(params.id)

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })
        }

        // Récupérer les utilisateurs actifs de l'association avec leurs rôles
        const users = await User.query()
            .where('associationId', params.id)
            .where('isActive', true)
            .whereNull('deletedAt')
            .preload('role', (roleQuery) => {
                roleQuery.whereIn('name', ['president', 'directeur_formation'])
            })

        // Filtrer les utilisateurs qui ont un rôle unique et extraire les noms de rôles
        const occupiedRoles = users
            .filter(u => u.role && ['president', 'directeur_formation'].includes(u.role.name))
            .map(u => u.role.name)
            .filter((value, index, self) => self.indexOf(value) === index) // Uniques

        return response.ok({
            success: true,
            data: {
                roles: occupiedRoles,
            }
        })
    }

    /**
     * GET /admin/association/:id/allMembers
     * Récupère l'ensemble des membres de l'association
     */
    async allMembers({ auth, response, request }: HttpContext) {
        const currentUser = auth.user!

        const filters = await request.validateUsing(listUsersValidator)
        const page = filters.page || 1
        const limit = filters.limit || 20

        if (!currentUser.associationId) {
            return response.notFound({
                success: false,
                message: 'Vous n\'êtes rattaché à aucune association',
            })
        }

        const query = User.query()
            .where('associationId', currentUser.associationId)
            .whereNull('deletedAt')
            .preload('role')

        if (filters.search) {
            query.where((q) => {
                q.whereILike('firstname', `%${filters.search}%`)
                    .orWhereILike('lastname', `%${filters.search}%`)
                    .orWhereILike('email', `%${filters.search}%`)
            })
        }

        if (filters.isActive !== undefined) {
            query.where('isActive', filters.isActive)
        }

        const sortBy = filters.sortBy || 'createdAt'
        const sortOrder = filters.sortOrder ||'desc'
        query.orderBy(sortBy, sortOrder)

        const getAllMembersAssociation = await query.paginate(page, limit)

        return response.ok({
            success: true,
            data: {
                members: getAllMembersAssociation.all().map((a) => a.serialize()),
                meta: {
                    total: getAllMembersAssociation.total,
                    perPage: getAllMembersAssociation.perPage,
                    currentPage: getAllMembersAssociation.currentPage,
                    lastPage: getAllMembersAssociation.lastPage,
                },
            },
        })
    }

    /**
     * POST /admin/membres/:id/approve
     * Permet d'approuver un membre de l'association
     */
    async approveMember({ auth, params, response, request }: HttpContext) {
        const currentUser = auth.user!

        // Charger le rôle si pas déjà fait
        if (!currentUser.role) {
        await currentUser.loadRoleWithPermissions()
        }

        const { roleId } = request.only(['roleId'])

        // Vérifier que roleId est fourni
        if (!roleId) {
            return response.badRequest({
                success: false,
                message: 'Le paramètre roleId est requis',
            })
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

        // Vérifier si le rôle est unique et déjà occupé
        if (newRole.isUnique) {
            const existingUserWithRole = await User.query()
                .where('roleId', newRole.id)
                .where('associationId', params.id)
                .whereNull('deletedAt')
                .first()

            if (existingUserWithRole) {
                return response.badRequest({
                    success: false,
                    message: `Le rôle "${newRole.displayName}" est déjà attribué à un autre membre de votre association`,
                })
            }
        }

        user.roleId = newRole.id
        user.isActive = true
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
     * POST /admin/membres/:id/reject
     * Rejeter une demande d'ajout pour un membre de l'association
     */
    async rejectMember({ auth, params, response, request }: HttpContext) {
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
        }
    
        return response.ok({
            success: true,
            message: 'Candidature rejetée',
            data: {
                reason: reason || 'Non spécifiée',
            },
        })
    }

    /**
     * POST /admin/membres/:id/suspend
     * Suspendre un membre d'une association provisoirement
     */
    async suspendMember({ auth, params, response, request }: HttpContext) {

        return response.ok({
            success: true,
            message: 'Suspension du membre réalisé'
        })
    }

    /**
     * DELETE /admin/membres/:id/delete
     * Supprimer un membre de l'association
     */
    async deleteMembers({ auth, params, response, request}: HttpContext) {

        return response.ok({
            success: true,
            message: 'Suppression du membre confirmer'
        })
    }

     /**
     * GET /admin/:id
     * Détails d'une association
     */
    async show({ params, response }: HttpContext) {
        const association = await Association.query()
            .where('id', params.id)
            .preload('users')
            .first()

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })
        }

        return response.ok({
            success: true,
            data: {
                association: association.serialize(),
                users: association.users.map((u) => u.serialize()),
                stats: {
                    totalUsers: association.users.length,
                },
            },
        })
    }
}

function currentUserNotFound(associationId: Number, response: any) { 
    if (!associationId) {
        return response.notFound({
            success: false,
            message: 'Vous n\'êtes rattaché à aucune association',
        })
    }
}
