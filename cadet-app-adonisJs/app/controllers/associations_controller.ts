import Association from '#models/association'
import { approveAssociationValidator, listAssociationValidator, rejectAssociationValidator, updateAssociationValidator } from '#validators/association'
import type { HttpContext } from '@adonisjs/core/http'
import { AssociationStatus } from '../../types/HelperPermAndRole.js'
import { DateTime } from 'luxon'
import User from '#models/user'


/**
 * Contrôleur des associations
 * Réservé au super_admin 
 */
export default class AssociationsController {

    /**
     * GET /api/v1/staffAdmin/associations
     * Lister toutes les associations
     */
    async index({ request, response}: HttpContext) {
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
     * GET /api/v1/staffAdmin/associations/pending
     * Associations en attente de validation
     */
    async pending({ response }: HttpContext) {
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
     * GET /api/v1/admin/associations/:id
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

    /**
     * POST /api/v1/staffAdmin/associations/:id/approve
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
     * POST /api/v1/staffAdmin/associations/:id/reject
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
     * POST /api/v1/staffAdmin/associations/:id/suspend
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
     * POST /api/v1/staffAdmin/associations/:id/reactivate
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
     * PUT /api/v1/admin/associations/:id
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
     * POST /api/v1/admin/associations/:id/extend-subscription
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
}