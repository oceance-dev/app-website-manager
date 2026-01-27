import type { HttpContext } from '@adonisjs/core/http'

import DocumentService from "#services/document_service";
import Document, { DocumentCategory, DocumentStatus, DocumentVisibility } from '#models/document';
import { DateTime } from 'luxon';
import { createReadStream, existsSync, stat } from 'fs';
import DocumentType from '#models/document_type';
import { slugify } from '#helpers/slug';

/**
 * /api/v1/document
 */
export default class DocumentsController {
    private documentService: DocumentService

    constructor() {
        this.documentService = new DocumentService()
    }

    /**
     * =====
     * CRUD DOCUMENT
     * =====
     */

    /**
     * GET /getAllDocument
     * Lister les documents
     */

    async index({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.loadRoleWithPermissions()
        }

        const filters = request.qs()

        const result = await this.documentService.list({
            associationId: currentUser.associationId!,
            userId: filters.userId ? Number(filters.userId) : undefined,
            candidatId: filters.candidatId ? Number(filters.candidatId) : undefined,
            category: filters.category as DocumentCategory,
            status: filters.status as DocumentStatus,
            visibility: filters.visibility as DocumentVisibility,
            search: filters.search,
            page: filters.page ? Number(filters.page) : 1,
            limit: filters.limit ? Number(filters.limit) : 20,
            sortBy: filters.sortBy || 'createdAt',
            sortOrder: (filters.sortOrder as 'asc' | 'desc') || 'desc',
        })

        return response.ok({
            success: true,
            data: {
                documents: result.all().map((doc) => doc.serialize()),
                meta: {
                    total: result.total,
                    perPage: result.perPage,
                    currentPage: result.currentPage,
                    lastPage: result.lastPage,
                }
            }
        })
    }

    /**
     * POST /upload-document
     * Upload un document
     */
    async store({ auth, request, response} : HttpContext) {
        const currentUser = auth.user!

        const file = request.file('file', {
            size: '20mb',
            extnames: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx', '.mp3', '.mp4']
        })

        if (!file) {
            return response.badRequest({
                success: false,
                message: 'Aucun fichier fourni',
            })
        }

        const body = request.only([
            'category',
            'visibility',
            'name',
            'description',
            'candidatId',
            'folderId',
            'expirationDate',
            'documentDate',
            'isTemplate',
        ])

        console.log('📥 Backend received body:', body)
        console.log('📁 Backend folderId:', body.folderId || 'null (intentional for templates)', 'isTemplate:', body.isTemplate)

        const uploadOptions = {
            associationId: currentUser.associationId!,
            userId: currentUser.id,
            candidatId: body.candidatId ? Number(body.candidatId) : undefined,
            folderId: body.folderId ? Number(body.folderId) : undefined,
            category: body.category || 'other',
            visibility: body.visibility || 'private',
            name: body.name,
            description: body.description,
            expirationDate: body.expirationDate ? DateTime.fromISO(body.expirationDate) : undefined,
            documentDate: body.documentDate ? DateTime.fromISO(body.documentDate) : undefined,
            isTemplate: body.isTemplate === 'true' || body.isTemplate === true,
        }

        console.log('📤 Sending to service:', uploadOptions)

        const result = await this.documentService.upload(file, uploadOptions)

        if (!result.success) {
            return response.badRequest({
                success: false,
                message: result.error,
            })
        } 

        return response.created({
            success: true,
            message: 'Document uploadé avec succès',
            data: {
                document: result.document!.serialize(),
            }
        })
    }

    /**
     * GET /view/:id
     * Permet de voir le document
     */
    async show({ auth, params, response}: HttpContext) {
        const currentUser = auth.user!

        // Charger le rôle avec permissions pour vérifier l'accès
        if (!currentUser.role) {
            await currentUser.load('role', (query) => query.preload('permissions'))
        }

        const document = await Document.query()
            .where('id', params.id)
            .whereNull('deletedAt')
            .preload('user')
            .preload('candidat')
            .preload('validator')
            .first()

        if (!document) {
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        if (!this.canAccessDocument(currentUser, document)) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        const downloadUrl = await this.documentService.getDownloadUrl(document)

        if (!downloadUrl) {
            return response.badRequest({
                success: false,
                message: 'Url non trouvé'
            })
        }

        return response.ok({
            success: true,
            data: {
                document: {
                    ...document.serialize(),
                    downloadUrl,
                },
            },
        })
    }

    /**
   * PUT /update-documents/:id
   * Modifier un document (métadonnées uniquement)
   */
    async update({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!

        // Charger le rôle avec permissions pour vérifier l'accès
        if (!currentUser.role) {
            await currentUser.load('role', (query) => query.preload('permissions'))
        }

        const document = await Document.query()
        .where('id', params.id)
        .whereNull('deletedAt')
        .first()

        if (!document) {
        return response.notFound({
            success: false,
            message: 'Document non trouvé',
        })
        }

        // Vérifier l'accès
        if (!this.canModifyDocument(currentUser, document)) {
            return response.forbidden({
                success: false,
                message: 'Vous ne pouvez pas modifier ce document',
            })
        }

        const body = request.only([
            'name',
            'description',
            'visibility',
            'expirationDate',
            'documentDate',
        ])

        if (body.name) document.name = body.name
        if (body.description !== undefined) document.description = body.description
        if (body.visibility) document.visibility = body.visibility
        if (body.expirationDate) document.expirationDate = DateTime.fromISO(body.expirationDate)
        if (body.documentDate) document.documentDate = DateTime.fromISO(body.documentDate)

        await document.save()

        return response.ok({
            success: true,
            message: 'Document mis à jour',
            data: {
                document: document.serialize(),
            },
        })
    }

    /**
     * DELETE /delete-documents/:id
     * Supprimer un document
     */
    async destroy({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!

        // Charger le rôle avec permissions pour vérifier l'accès
        if (!currentUser.role) {
            await currentUser.load('role', (query) => query.preload('permissions'))
        }

        const document = await Document.query()
        .where('id', params.id)
        .whereNull('deletedAt')
        .first()

        if (!document) {
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }
        // Vérifier l'accès
        if (!this.canModifyDocument(currentUser, document)) {
            return response.forbidden({
                success: false,
                message: 'Vous ne pouvez pas supprimer ce document',
            })
        }

        // Par défaut, on fait un hard delete pour supprimer aussi le fichier physique
        const hardDelete = request.input('hardDelete', true)

        console.log('🗑️ Deleting document:', {
            id: document.id,
            name: document.name,
            filePath: document.filePath,
            hardDelete: hardDelete,
        })

        await this.documentService.delete(document, hardDelete)

        console.log('✅ Document deleted successfully')

        return response.ok({
            success: true,
            message: 'Document supprimé',
        })
    }

    /**
     * GET /:id/download
     * Télécharger un document
     */
    async downloadDocument({ auth, params, request, response }: HttpContext) {
        // Essayer de récupérer l'utilisateur depuis le header ou le token dans l'URL
        let currentUser = auth.user

        // Si pas d'utilisateur dans auth, essayer de récupérer le token depuis l'URL
        if (!currentUser) {
            const tokenFromUrl = request.input('token')
            if (tokenFromUrl) {
                // Vérifier le token manuellement
                try {
                    // Le middleware auth devrait avoir géré ça, mais on garde une sécurité
                    console.log('Token from URL detected for document download')
                } catch (error) {
                    return response.unauthorized({
                        success: false,
                        message: 'Token invalide',
                    })
                }
            }
        }

        if (!currentUser) {
            return response.unauthorized({
                success: false,
                message: 'Authentification requise',
            })
        }

        // Charger le rôle avec permissions pour vérifier l'accès
        if (!currentUser.role) {
            await currentUser.load('role', (query) => query.preload('permissions'))
        }

        const document = await Document.query()
            .where('id', params.id)
            .whereNull('deletedAt')
            .first()

        if (!document) {
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        // Vérifier l'accès
        if (!this.canAccessDocument(currentUser, document)) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        // Récupérer le fichier
        const localPath = this.documentService.getLocalPath(document)

        if (!existsSync(localPath)) {
            return response.notFound({
                success: false,
                message: 'Fichier non trouvé',
            })
        }

        // Encoder le nom du fichier pour éviter les erreurs avec les caractères spéciaux
        // Utiliser RFC 5987 encoding pour supporter les caractères non-ASCII
        const encodedFileName = encodeURIComponent(document.originalName)
        const contentDisposition = `inline; filename="${document.originalName.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodedFileName}`

        // Stream le fichier
        response.header('Content-Type', document.mimeType)
        response.header('Content-Disposition', contentDisposition)
        response.header('Content-Length', document.fileSize.toString())
        // Ajouter les headers CORS pour permettre l'affichage dans iframe
        response.header('Access-Control-Allow-Origin', '*')
        response.header('Cross-Origin-Resource-Policy', 'cross-origin')

        return response.stream(createReadStream(localPath))
    }

    /**
     * POST /:id/approve
     * Approuver un document
     */
    async approve({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        if (!currentUser.hasPermission('documents.Validate') && !currentUser.isSuperAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de valider des documents'
            })
        }

        const document = await Document.query()
            .where('id', params.id)
            .where('associationId', currentUser.associationId!)
            .whereNull('deletedAt')
            .first()

        if (!document) {
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        await document.approve(currentUser.id)

        return response.ok({
            success: true,
            message: 'Document approuvé',
            data: {
                document: document.serialize(),
            },
        })
    }

    /**
     * POST /:id/reject
     * Rejeter un document
     */
    async reject({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('documents.validate') && !currentUser.isSuperAdmin) {
            return response.forbidden({
                success: false,
                message: 'Vous n\'avez pas la permission de valider des documents',
            })
        }

        const document = await Document.query()
            .where('id', params.id)
            .where('associationId', currentUser.associationId!)
            .whereNull('deletedAt')
            .first()

        if (!document) {
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        const reason = request.input('reason', '')
        await document.reject(currentUser.id, reason)

        return response.ok({
            success: true,
            message: 'Document rejeté',
            data: {
                document: document.serialize(),
            }
        })
    }

    /**
     * GET /api/v1/documents/pending
     * Documents en attente de validation
     */
    async pending({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        if (!currentUser.role) {
            await currentUser.load('role')
        }

        // Vérifier la permission
        if (!currentUser.hasPermission('documents.validate') && !currentUser.isSuperAdmin) {
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        const filters = request.qs()

        const result = await this.documentService.list({
            associationId: currentUser.associationId!,
            status: 'pending',
            category: filters.category as DocumentCategory,
            page: filters.page ? Number(filters.page) : 1,
            limit: filters.limit ? Number(filters.limit) : 20,
        })

        return response.ok({
            success: true,
            data: {
                documents: result.all().map((doc) => doc.serialize()),
                meta: {
                total: result.total,
                perPage: result.perPage,
                currentPage: result.currentPage,
                lastPage: result.lastPage,
                },
            },
        })
    }

     /**
     * ========================================
     * MES DOCUMENTS
     * ========================================
     */

    /**
     * GET /api/v1/documents/my
     * Mes documents
     */
    async my({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        const filters = request.qs()

        const result = await this.documentService.list({
            associationId: currentUser.associationId!,
            userId: currentUser.id,
            category: filters.category as DocumentCategory,
            status: filters.status as DocumentStatus,
            page: filters.page ? Number(filters.page) : 1,
            limit: filters.limit ? Number(filters.limit) : 20,
        })

        return response.ok({
            success: true,
            data: {
                documents: result.all().map((doc) => doc.serialize()),
                meta: {
                total: result.total,
                perPage: result.perPage,
                currentPage: result.currentPage,
                lastPage: result.lastPage,
                },
            },
        })
    }

    /**
     * POST /api/v1/documents/my
     * Upload un de mes documents
     */
    async uploadMy({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        const file = request.file('file', {
            size: '10mb',
            extnames: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx'],
        })

        if (!file) {
            return response.badRequest({
                success: false,
                message: 'Aucun fichier fourni',
            })
        }

        const body = request.only(['category', 'name', 'description', 'folderId', 'expirationDate', 'documentDate'])

        const result = await this.documentService.upload(file, {
            associationId: currentUser.associationId!,
            userId: currentUser.id,
            folderId: body.folderId ? Number(body.folderId) : undefined,
            category: body.category || 'other',
            visibility: 'private', // Mes documents sont toujours privés
            name: body.name,
            description: body.description,
            expirationDate: body.expirationDate ? DateTime.fromISO(body.expirationDate) : undefined,
            documentDate: body.documentDate ? DateTime.fromISO(body.documentDate) : undefined,
        })

        if (!result.success) {
            return response.badRequest({
                success: false,
                message: result.error,
            })
        }

        return response.created({
            success: true,
            message: 'Document uploadé avec succès',
            data: {
                document: result.document!.serialize(),
            },
        })
    }

     /**
   * ========================================
   * DOCUMENTS D'UN CADET
   * ========================================
   */

  /**
   * GET /:candidatId/documents
   * Documents d'un candidat
   */
  async candidatDocuments({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.load('role')
    }

    // Vérifier la permission
    if (!currentUser.hasPermission('documents.read') && !currentUser.isSuperAdmin) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    const filters = request.qs()

    const result = await this.documentService.list({
      associationId: currentUser.associationId!,
      candidatId: Number(params.candidatId),
      category: filters.category as DocumentCategory,
      status: filters.status as DocumentStatus,
      page: filters.page ? Number(filters.page) : 1,
      limit: filters.limit ? Number(filters.limit) : 20,
    })

    return response.ok({
      success: true,
      data: {
        documents: result.all().map((doc) => doc.serialize()),
        meta: {
          total: result.total,
          perPage: result.perPage,
          currentPage: result.currentPage,
          lastPage: result.lastPage,
        },
      },
    })
  }

  /**
   * POST /:candidatId/documents
   * Upload un document pour un candidats
   */
  async uploadCandidatDocument({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.load('role')
    }

    // Vérifier la permission
    if (!currentUser.hasPermission('documents.upload') && !currentUser.isSuperAdmin) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission d\'uploader des documents',
      })
    }

    const file = request.file('file', {
      size: '10mb',
      extnames: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx'],
    })

    if (!file) {
      return response.badRequest({
        success: false,
        message: 'Aucun fichier fourni',
      })
    }

    const body = request.only([
      'category',
      'visibility',
      'name',
      'description',
      'folderId',
      'expirationDate',
      'documentDate',
    ])

    const result = await this.documentService.upload(file, {
      associationId: currentUser.associationId!,
      userId: currentUser.id,
      candidatId: Number(params.candidatId),
      folderId: body.folderId ? Number(body.folderId) : undefined,
      category: body.category || 'other',
      visibility: body.visibility || 'private',
      name: body.name,
      description: body.description,
      expirationDate: body.expirationDate ? DateTime.fromISO(body.expirationDate) : undefined,
      documentDate: body.documentDate ? DateTime.fromISO(body.documentDate) : undefined,
    })

    if (!result.success) {
      return response.badRequest({
        success: false,
        message: result.error,
      })
    }

    return response.created({
      success: true,
      message: 'Document uploadé avec succès',
      data: {
        document: result.document!.serialize(),
      },
    })
  }

    /**
     * ========================================
     * TYPES DE DOCUMENTS
     * ========================================
     */

    /**
     * GET /api/v1/documents/types
     * Liste des types de documents
     */
    async types({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        const types = await DocumentType.forAssociation(currentUser.associationId!)

        return response.ok({
            success: true,
            data: {
                types: types.map((t) => t.serialize()),
            },
        })
    }

    /**
     * GET /api/v1/documents/types/required
     * Types de documents requis
     */
    async requiredTypes({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        const types = await DocumentType.requiredForAssociation(currentUser.associationId!)

        return response.ok({
        success: true,
        data: {
            types: types.map((t) => t.serialize()),
        },
        })
    }

    /**
     * ========================================
     * GESTION DES TYPES DE DOCUMENTS PERSONNALISÉS
     * ========================================
     */

    /**
     * GET /api/v1/documents/types/custom
     * Liste des types personnalisés de l'association
     */
    async customTypes({ auth, response }: HttpContext) {
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

        const types = await DocumentType.query()
            .where('associationId', currentUser.associationId!)
            .orderBy('sort_order', 'asc')
            .orderBy('name', 'asc')

        return response.ok({
            success: true,
            data: {
                types: types.map((t) => t.serialize()),
            },
        })
    }

    /**
     * POST /api/v1/documents/types/create
     * Créer un nouveau type de document personnalisé
     */
    async createType({ auth, request, response }: HttpContext) {
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

        const data = request.only([
            'name',
            'description',
            'category',
            'isRequired',
            'isActive',
            'requiresValidation',
            'hasExpiration',
            'validityDays',
            'allowedExtensions',
            'maxFileSize',
            'requiredFor',
        ])

        // Validation
        if (!data.name || data.name.trim() === '') {
            return response.badRequest({
                success: false,
                message: 'Le nom est obligatoire',
            })
        }

        if (!data.category) {
            return response.badRequest({
                success: false,
                message: 'La catégorie est obligatoire',
            })
        }

        try {
            // Générer un slug unique pour cette association
            const baseSlug = slugify(data.name)
            let slug = baseSlug
            let counter = 1

            // Vérifier l'unicité du slug pour cette association
            while (true) {
                const existing = await DocumentType.query()
                    .where('slug', slug)
                    .where('associationId', currentUser.associationId!)
                    .first()

                if (!existing) break

                slug = `${baseSlug}-${counter}`
                counter++
            }

            // Obtenir le prochain ordre de tri
            const maxSort = await DocumentType.query()
                .where('associationId', currentUser.associationId!)
                .max('sort_order as maxSort')
                .first()

            const nextSort = maxSort?.$extras.maxSort ? maxSort.$extras.maxSort + 10 : 100

            // Créer le type
            const type = await DocumentType.create({
                associationId: currentUser.associationId!,
                name: data.name.trim(),
                slug,
                description: data.description || null,
                category: data.category,
                isRequired: data.isRequired ?? false,
                isActive: data.isActive ?? true,
                requiresValidation: data.requiresValidation ?? false,
                hasExpiration: data.hasExpiration ?? false,
                validityDays: data.validityDays || null,
                allowedExtensions: data.allowedExtensions || null,
                maxFileSize: data.maxFileSize || null,
                requiredFor: data.requiredFor || 'all',
                sortOrder: nextSort,
            })

            return response.created({
                success: true,
                message: 'Type de document créé avec succès',
                data: {
                    type: type.serialize(),
                },
            })
        } catch (error) {
            console.error('Error creating document type:', error)
            return response.internalServerError({
                success: false,
                message: 'Erreur lors de la création du type de document',
            })
        }
    }

    /**
     * PUT /api/v1/documents/types/:id
     * Mettre à jour un type de document personnalisé
     */
    async updateType({ auth, params, request, response }: HttpContext) {
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

        try {
            const type = await DocumentType.find(params.id)

            if (!type) {
                return response.notFound({
                    success: false,
                    message: 'Type de document non trouvé',
                })
            }

            // Seuls les types personnalisés de l'association peuvent être modifiés
            if (type.associationId !== currentUser.associationId!) {
                return response.forbidden({
                    success: false,
                    message: 'Vous ne pouvez modifier que vos types personnalisés',
                })
            }

            const data = request.only([
                'name',
                'description',
                'category',
                'isRequired',
                'isActive',
                'requiresValidation',
                'hasExpiration',
                'validityDays',
                'allowedExtensions',
                'maxFileSize',
                'requiredFor',
            ])

            // Si le nom change, régénérer le slug
            if (data.name && data.name !== type.name) {
                const baseSlug = slugify(data.name)
                let slug = baseSlug
                let counter = 1

                while (true) {
                    const existing = await DocumentType.query()
                        .where('slug', slug)
                        .where('associationId', currentUser.associationId!)
                        .whereNot('id', params.id)
                        .first()

                    if (!existing) break

                    slug = `${baseSlug}-${counter}`
                    counter++
                }

                type.slug = slug
            }

            // Mettre à jour les champs
            if (data.name !== undefined) type.name = data.name.trim()
            if (data.description !== undefined) type.description = data.description || null
            if (data.category !== undefined) type.category = data.category
            if (data.isRequired !== undefined) type.isRequired = data.isRequired
            if (data.isActive !== undefined) type.isActive = data.isActive
            if (data.requiresValidation !== undefined) type.requiresValidation = data.requiresValidation
            if (data.hasExpiration !== undefined) type.hasExpiration = data.hasExpiration
            if (data.validityDays !== undefined) type.validityDays = data.validityDays || null
            if (data.allowedExtensions !== undefined) type.allowedExtensions = data.allowedExtensions || null
            if (data.maxFileSize !== undefined) type.maxFileSize = data.maxFileSize || null
            if (data.requiredFor !== undefined) type.requiredFor = data.requiredFor

            await type.save()

            return response.ok({
                success: true,
                message: 'Type de document mis à jour',
                data: {
                    type: type.serialize(),
                },
            })
        } catch (error) {
            console.error('Error updating document type:', error)
            return response.internalServerError({
                success: false,
                message: 'Erreur lors de la mise à jour du type de document',
            })
        }
    }

    /**
     * DELETE /api/v1/documents/types/:id
     * Supprimer un type de document personnalisé
     */
    async deleteType({ auth, params, response }: HttpContext) {
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

        try {
            const type = await DocumentType.find(params.id)

            if (!type) {
                return response.notFound({
                    success: false,
                    message: 'Type de document non trouvé',
                })
            }

            // Seuls les types personnalisés de l'association peuvent être supprimés
            if (type.associationId !== currentUser.associationId!) {
                return response.forbidden({
                    success: false,
                    message: 'Vous ne pouvez supprimer que vos types personnalisés',
                })
            }

            // Vérifier s'il y a des exigences utilisant ce type
            await type.load('requirements')
            if (type.requirements && type.requirements.length > 0) {
                return response.badRequest({
                    success: false,
                    message: 'Ce type est utilisé dans des exigences documentaires. Supprimez d\'abord les exigences.',
                })
            }

            await type.delete()

            return response.ok({
                success: true,
                message: 'Type de document supprimé',
            })
        } catch (error) {
            console.error('Error deleting document type:', error)
            return response.internalServerError({
                success: false,
                message: 'Erreur lors de la suppression du type de document',
            })
        }
    }

    /**
     * =====
     * STATISTIQUES
     * =====
     */

    /**
     * GET /stats
     * Statistiques des documents 
     */
    async stats({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        const stats = await this.documentService.stats(currentUser.associationId!)

        return response.ok({
            success: true,
            data: { stats },
        })
    }

    /**
     * =====
     * HELPERS PRIVÉS
     * =====
     */

    /**
     * Vérifier si l'utilisateur peut accèder au document
     * @param user
     * @param document
     * @returns
     */

    private canAccessDocument(user: any, document: Document): boolean {
        console.log('🔍 Checking document access:', {
            userId: user.id,
            documentId: document.id,
            documentUserId: document.userId,
            documentCandidatId: document.candidatId,
            documentVisibility: document.visibility,
            userIsSuperAdmin: user.isSuperAdmin,
            userRoleLevel: user.roleLevel,
        })

        if (user.isSuperAdmin) {
            console.log('✅ Access granted: user is super admin')
            return true
        }

        if (document.associationId !== user.associationId) {
            console.log('❌ Access denied: different association')
            return false
        }

        if (document.userId === user.id) {
            console.log('✅ Access granted: user is document owner')
            return true
        }

        if (document.candidatId === user.id) {
            console.log('✅ Access granted: user is document candidat')
            return true
        }

        switch (document.visibility) {
            case 'public':
                console.log('✅ Access granted: document is public')
                return true
            case 'members':
                console.log('✅ Access granted: document is for members')
                return true
            case 'staff':
                const hasStaffAccess = user.roleLevel >= 50
                console.log(hasStaffAccess ? '✅ Access granted: user is staff' : '❌ Access denied: user is not staff')
                return hasStaffAccess
            case 'private':
                const hasPermission = user.hasPermission('documents.read')
                console.log(hasPermission ? '✅ Access granted: user has documents.read permission' : '❌ Access denied: user lacks documents.read permission')
                return hasPermission
            default:
                console.log('❌ Access denied: unknown visibility')
                return false
        }
    }

    /**
     * Vérifier si l'utilisateur peut modifier le document
     * @param user
     * @param document
     * @returns
     */
    private canModifyDocument(user: any, document: Document): boolean {
        console.log('🔍 Checking document modification access:', {
            userId: user.id,
            documentId: document.id,
            documentUserId: document.userId,
            userIsSuperAdmin: user.isSuperAdmin,
        })

        // Super admin peut tout modifier
        if (user.isSuperAdmin) {
            console.log('✅ Modification granted: user is super admin')
            return true
        }

        // Vérifier l'association
        if (document.associationId !== user.associationId) {
            console.log('❌ Modification denied: different association')
            return false
        }

        // Propriétaire peut modifier
        if (document.userId === user.id) {
            console.log('✅ Modification granted: user is document owner')
            return true
        }

        // Permission de suppression
        const hasPermission = user.hasPermission('documents.delete')
        console.log(hasPermission ? '✅ Modification granted: user has documents.delete permission' : '❌ Modification denied: user lacks documents.delete permission')
        return hasPermission
    }
}

