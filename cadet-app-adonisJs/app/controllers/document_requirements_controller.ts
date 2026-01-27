import DocumentType from '#models/document_type'
import { DocumentRequirementService } from '#services/document_requirement_service'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * API /documentRequired
 */
export default class DocumentRequirementsController {
    private service: DocumentRequirementService

    constructor() {
        this.service = new DocumentRequirementService()
    }

    /**
     * ========================================
     * CRUD EXIGENCES
     * ========================================
     */
    /**
     * GET /document-requirements
     * Liste des exigences de l'association
     * @param param0 
     * @returns 
     */
    async index({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        const onlyEnabled = request.input('onlyEnabled', false)

        const requirements = onlyEnabled
            ? await this.service.getEnabled(currentUser.associationId!)
            : await this.service.getAll(currentUser.associationId!)

        return response.ok({
            success: true,
            data: {
                requirements: requirements.map((r) => r.serialize()),
            },
        })
    }

    /**
     * POST /create-document-requirements
     * Créer une exigence
     */
    async createExigence({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
        await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de gérer les exigences',
            })
        }

        const body = request.only([
            'documentTypeId',
            'isEnabled',
            'isRequired',
            'requiredFor',
            'requiredAt',
            'customInstructions',
            'customName',
            'sortOrder',
            'customValidityDays',
            'templateDocumentId',
        ])

        const result = await this.service.create(currentUser.associationId!, body)

         if (!result.success) {
            return response.badRequest({
                success: false,
                message: result.error,
            })
        }

        return response.created({
            success: true,
            message: 'Exigence créée avec succès',
            data: {
                requirement: result.requirement!.serialize(),
            },
        })
    }

    /**
     * GET /document-requirements/:id
     * Voir une exigence
     */
    async show({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        const requirement = await this.service.getById(currentUser.associationId!, Number(params.id))

        if (!requirement) {
            return response.notFound({
                success: false,
                message: 'Exigence non trouvée',
            })
        }

        return response.ok({
            success: true,
            data: {
                requirement: requirement.serialize(),
            },
        })
    }

  /**
   * PUT /update-document-requirements/:id
   * Modifier une exigence
   */
    async update({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
        await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
        return response.forbidden({
            success: false,
            message: 'Vous n\'avez pas la permission de gérer les exigences',
        })
        }

        const body = request.only([
        'isEnabled',
        'isRequired',
        'requiredFor',
        'requiredAt',
        'customInstructions',
        'customName',
        'sortOrder',
        'customValidityDays',
        'templateDocumentId',
        ])

        const result = await this.service.update(currentUser.associationId!, Number(params.id), body)

        if (!result.success) {
        return response.badRequest({
            success: false,
            message: result.error,
        })
        }

        return response.ok({
            success: true,
            message: 'Exigence mise à jour',
            data: {
            requirement: result.requirement!.serialize(),
            },
        })
    }

    /**
   * DELETE /delete-document-requirements/:id
   * Supprimer une exigence
   */
    async destroy({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de gérer les exigences',
            })
        }

        const result = await this.service.delete(currentUser.associationId!, Number(params.id))

        if (!result.success) {
            return response.badRequest({
                success: false,
                message: result.error,
            })
        }

        return response.ok({
            success: true,
            message: 'Exigence supprimée',
        })
    }

    /**
   * ========================================
   * ACTIONS SPÉCIALES
   * ========================================
   */

  /**
   * POST /api/v1/document-requirements/:id/toggle
   * Activer/Désactiver une exigence
   */
    async toggle({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de gérer les exigences',
            })
        }

        const result = await this.service.toggle(currentUser.associationId!, Number(params.id))

        if (!result.success) {
            return response.badRequest({
                success: false,
                message: result.error,
            })
        }

        return response.ok({
            success: true,
            message: result.requirement!.isEnabled ? 'Exigence activée' : 'Exigence désactivée',
            data: {
                requirement: result.requirement!.serialize(),
            },
        })
    }

    /**
     * POST /api/v1/document-requirements/reorder
     * Réorganiser les exigences
     */
    async reorder({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de gérer les exigences',
            })
        }

        const { orderedIds } = request.only(['orderedIds'])

        if (!Array.isArray(orderedIds)) {
            return response.badRequest({
                success: false,
                message: 'orderedIds doit être un tableau',
            })
        }

        await this.service.reorder(currentUser.associationId!, orderedIds)

        return response.ok({
            success: true,
            message: 'Ordre mis à jour',
        })
    }

    /**
     * POST /api/v1/document-requirements/bulk-update
     * Mise à jour en masse
     */
    async bulkUpdate({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de gérer les exigences',
            })
        }

        const { updates } = request.only(['updates'])

        if (!Array.isArray(updates)) {
            return response.badRequest({
                success: false,
                message: 'updates doit être un tableau',
            })
        }

        const result = await this.service.bulkUpdate(currentUser.associationId!, updates)

        return response.ok({
            success: true,
            message: `${result.updated} exigence(s) mise(s) à jour`,
            data: {
                updated: result.updated,
            },
        })
    }

    /**
     * POST /api/v1/document-requirements/initialize
     * Initialiser les exigences par défaut
     */
    async initialize({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de gérer les exigences',
            })
        }

        await this.service.initializeDefaults(currentUser.associationId!)

        const requirements = await this.service.getAll(currentUser.associationId!)

        return response.ok({
            success: true,
            message: 'Exigences initialisées avec les valeurs par défaut',
            data: {
                requirements: requirements.map((r) => r.serialize()),
            },
        })
    }

    /**
     * POST /api/v1/document-requirements/reset
     * Réinitialiser aux valeurs par défaut
     */
    async reset({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de gérer les exigences',
            })
        }

        await this.service.resetToDefaults(currentUser.associationId!)

        const requirements = await this.service.getAll(currentUser.associationId!)

        return response.ok({
            success: true,
            message: 'Exigences réinitialisées',
            data: {
                requirements: requirements.map((r) => r.serialize()),
            },
        })
    }

      /**
     * ========================================
     * POUR L'INSCRIPTION (PUBLIC)
     * ========================================
     */

    /**
     * GET /associations/:slug/registration-requirements
     * Exigences pour l'inscription (accessible sans auth)
     */
    async forRegistration({ params, request, response }: HttpContext) {
        const Association = (await import('#models/association')).default

        // Récupérer l'association par slug
        const association = await Association.query()
        .where('slug', params.slug)
        .where('status', 'active')
        .first()

        if (!association) {
            return response.notFound({
                success: false,
                message: 'Association non trouvée',
            })
        }

        const isMinor = request.input('isMinor', false)

        const requirements = await this.service.getForRegistration(association.id, { isMinor })

        return response.ok({
            success: true,
            data: {
                association: {
                id: association.id,
                name: association.name,
                slug: association.slug,
                },
                requirements: requirements.map((r) => r.serializeForRegistration()),
            },
        })
    }

    /**
   * ========================================
   * VÉRIFICATION DE COMPLÉTION
   * ========================================
   */

    /**
     * GET /document-requirements/check/:userId
     * Vérifier la complétion des documents d'un utilisateur
     */
    async checkCompletion({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission (soi-même ou staff)
        const targetUserId = Number(params.userId)
        const isSelf = targetUserId === currentUser.id
        const hasPermission = currentUser.hasPermission('users.read') || currentUser.isAdmin

        if (!isSelf && !hasPermission) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        const options = {
            isCadet: request.input('isCadet', false),
            isCandidat: request.input('isCandidat', false),
            isStaff: request.input('isStaff', false),
            requiredAt: request.input('requiredAt'),
        }

        const result = await this.service.checkCompletion(
            currentUser.associationId!,
            targetUserId,
            options
        )

        return response.ok({
            success: true,
            data: result,
        })
    }

    /**
     * GET /document-requirements/my-completion
     * Ma complétion de documents
     */
    async myCompletion({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        const options = {
            isCandidat: request.input('isCandidat', false),
            requiredAt: request.input('requiredAt', 'registration'),
        }

        const result = await this.service.checkCompletion(
            currentUser.associationId!,
            currentUser.id,
            options
        )

        return response.ok({
            success: true,
            data: result,
        })
    }

    /**
     * GET /api/v1/document-requirements/can-approve/:userId
     * Vérifier si un candidat peut être approuvé
     */
    async canApprove({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('users.approve') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        const result = await this.service.canBeApproved(
            currentUser.associationId!,
            Number(params.userId)
        )

        return response.ok({
            success: true,
            data: result,
        })
    }



    /**
   * ========================================
   * TYPES DE DOCUMENTS DISPONIBLES
   * ========================================
   */

    /**
     * GET /api/v1/document-requirements/available-types
     * Types de documents disponibles (non encore ajoutés)
     */
    async availableTypes({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('association.manage') && !currentUser.isAdmin) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        // Récupérer les types globaux et ceux de l'association
        const allTypes = await DocumentType.query()
            .where((q) => {
                q.whereNull('associationId').orWhere('associationId', currentUser.associationId!)
            })
            .where('isActive', true)
            .orderBy('sort_order', 'asc')

        // Récupérer les types déjà configurés
        const existingRequirements = await this.service.getAll(currentUser.associationId!)
        const existingTypeIds = existingRequirements.map((r) => r.documentTypeId)

        // Filtrer les types non encore ajoutés
        const availableTypes = allTypes.filter((t) => !existingTypeIds.includes(t.id))

        return response.ok({
            success: true,
            data: {
                types: availableTypes.map((t) => t.serialize()),
            },
        })
    }
}