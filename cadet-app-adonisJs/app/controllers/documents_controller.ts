import type { HttpContext } from '@adonisjs/core/http'

import DocumentService from "#services/document_service";
import Document, { DocumentCategory, DocumentStatus, DocumentVisibility } from '#models/document';
import { DateTime } from 'luxon';
import { createReadStream, existsSync, stat } from 'fs';

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
            'expirationDate',
            'documentDate',
        ])

        const result = await this.documentService.upload(file, {
            associationId: currentUser.associationId!,
            userId: currentUser.id,
            candidatId: body.candidatId ? Number(body.candidatId) : undefined,
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
            }
        })
    }

    /**
     * GET /view/:id
     * Permet de voir le document
     */
    async show({ auth, params, response}: HttpContext) {
        const currentUser = auth.user!

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

        const hardDelete = request.input('hardDelete', false)
        await this.documentService.delete(document, hardDelete)

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

        // Stream le fichier
        response.header('Content-Type', document.mimeType)
        response.header('Content-Disposition', `inline; filename="${document.originalName}"`)
        response.header('Content-Length', document.fileSize.toString())
        // Ajouter les headers CORS pour permettre l'affichage dans iframe
        response.header('Access-Control-Allow-Origin', '*')
        response.header('Cross-Origin-Resource-Policy', 'cross-origin')

        return response.stream(createReadStream(localPath))
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
        if (user.isSuperAdmin) return true

        if (document.associationId !== user.associationId) return false

        if (document.userId === user.id) return true

        if (document.candidatId === user.id) return true

        switch (document.visibility) {
            case 'public':
                return true
            case 'members': 
                return true
            case 'staff':
                return user.roleLevel >= 50
            case 'private':
                return user.hasPermission('document.read')
            default:
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
        // Super admin peut tout modifier
        if (user.isSuperAdmin) return true

        // Vérifier l'association
        if (document.associationId !== user.associationId) return false

        // Propriétaire peut modifier
        if (document.userId === user.id) return true

        // Permission de suppression
        return user.hasPermission('documents.delete')
    }
}

