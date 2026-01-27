import AssociationDocumentRequirement from '#models/association_document_requirement'
import Document from '#models/document'
import Folder from '#models/folder'
import User from '#models/user'
import { DocumentRequirementService } from '#services/document_requirement_service'
import DocumentService from '#services/document_service'
import { FolderService } from '#services/folder_service'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { createReadStream, existsSync } from 'node:fs'

export default class CandidatsController {
    private documentService: DocumentService
    private requirementService: DocumentRequirementService
    private folderService: FolderService

    constructor() {
        this.documentService = new DocumentService()
        this.requirementService = new DocumentRequirementService()
        this.folderService = new FolderService()
    }

     /**
     * ========================================
     * EXIGENCES POUR L'INSCRIPTION
     * ========================================
     */

     /**
      * GET /document-requirements
      * Récupérer les exigences documentaires pour l'inscription
      */
     async requirementsDoc({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        // vérifier que l'utilisateur est bien un candidat
        if (!currentUser.role) {
            await currentUser.load('role')
        }

        const isMinor = currentUser.dateOfBirth
            ? DateTime.now().diff(currentUser.dateOfBirth, 'years').years < 18
            : false
        
        if (!isMinor) {
            throw new Error('Vous dépassez l\'âge limite')
        }

        const requirements = await this.requirementService.getForRegistration(
            currentUser.associationId!,
            { isMinor }
        )

        const myDocuments = await Document.query()
            .where('associationId', currentUser.associationId!)
            .where('userId', currentUser.id)
            .whereNull('deletedAt')

        const requirementsWithStatus = requirements.map((req) => {
            const matchingDoc = myDocuments.find(
                (doc) => doc.category === req.documentType.category
            )

            return {
                ...req.serializeForRegistration(),
                status: matchingDoc 
                    ? {
                        uploaded: true,
                        documentId: matchingDoc.id,
                        documentStatus: matchingDoc.status,
                        documentName: matchingDoc.name,
                        uploadedAt: matchingDoc.createdAt.toISO(),
                    }
                    : {
                        uploaded: false,
                        documentId: null,
                        documentStatus: null,
                        documentName: null,
                        uploadedAt: null,
                    },
            }
        })

        // Calculer le pourcentage de complétion
        const requiredCount = requirements.filter((r) => r.isRequired).length
        const completedRequired = requirementsWithStatus.filter(
            (r) => r.isRequired && r.status.uploaded
        ).length

        const percentage = requiredCount > 0 ? Math.round((completedRequired / requiredCount) * 100) : 100

        return response.ok({
            success: true,
            data: {
                requirements: requirementsWithStatus,
                completion: {
                    total: requiredCount,
                    completed: completedRequired,
                    percentage,
                    isComplete: completedRequired >= requiredCount,
                },
            },
        })
     }

     /**
     * ========================================
     * MES DOCUMENTS (CANDIDAT)
     * ========================================
     */

    /**
     * GET /get-my-documents
     * Liste de mes documents
     */
    async index({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        const documents = await Document.query()
            .where('associationId', currentUser.associationId!)
            .where('candidatId', currentUser.id)
            .whereNull('deletedAt')
            .orderBy('createdAt', 'desc')

        return response.ok({
            success: true,
            data: {
                documents: documents.map((doc) => doc.serialize()),
            },
        })
    }

    /**
     * POST /upload-my-document
     * Upload un document pour l'inscription d'un candidat
     */
    async uploadDocumentCandidat({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!

        const file = request.file('file', {
            size: '10mb',
            extnames: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx'],
        })

        if (!file) {
            return response.badRequest({
                success: false,
                message: 'Aucun fichier fourni',
            })
        }

        const body = request.only([
            'category',
            'documentRequirementId',
            'name',
            'description',
            'expirationDate',
            'documentDate',
        ])

        console.log('body', body)

        // Si requirementId fourni, récupérer la catégorie depuis l'exigence
        let category = body.category || 'other' // Catégorie par défaut
        let requirement: AssociationDocumentRequirement | null = null
        let isCustomDocument = false // Pour savoir si c'est un document personnalisé

        if (body.documentRequirementId) {
            requirement = await AssociationDocumentRequirement.query()
                .where('id', body.documentRequirementId)
                .where('associationId', currentUser.associationId!)
                .preload('documentType')
                .first()

            if (requirement) {
                category = requirement.documentType.category
            }
        } else {
            // Document personnalisé (sans requirement)
            isCustomDocument = true
        }

        // Pour les documents liés à un requirement, vérifier si un document existe déjà
        // et le remplacer (soft delete). Pour les documents personnalisés, créer toujours un nouveau
        if (!isCustomDocument) {
            const existingDoc = await Document.query()
                .where('associationId', currentUser.associationId!)
                .where('userId', currentUser.id)
                .where('category', category)
                .whereNull('deletedAt')
                .first()

            // Si existe on crée une nouvelle version (soft delete l'ancien)
            if (existingDoc) {
                await existingDoc.softDelete()
            }
        }

        // Récupère l'id du dossier
        const getFolderUser = await Folder.query()
            .where('ownerId', currentUser.id)
            .where('associationId', currentUser.associationId!)
            .where('name', `candidat-${currentUser.id}`)
            .where('slug', `candidat-${currentUser.id}`)
            .first()

        console.log('🔍 Searching folder for candidat:', currentUser.id)
        console.log('📁 Folder found:', getFolderUser ? `ID: ${getFolderUser.id}, Name: ${getFolderUser.name}` : 'NOT FOUND')

        if (!getFolderUser) {
             return response.badRequest({
                success: false,
                message: 'Dossier privé introuvable. Veuillez contacter l\'administrateur.',
            })
        }

        // Générer un nom de fichier unique
        const { randomUUID } = await import('crypto')
        const { extname } = await import('path')
        const fileId = randomUUID()
        const extension = extname(file.clientName).toLowerCase().slice(1)
        const fileName = `${fileId}.${extension}`

        // Construire le chemin relatif (sans basePath car il sera ajouté dans uploadToLocal)
        // Format: associations/{id}/folders/{slug1}/{slug2}/{fileName}
        const ancestors = await getFolderUser.getPath()
        const pathParts = ancestors.map(a => a.slug)

        const relativePath = [
            'associations',
            String(currentUser.associationId),
            'folders',
            ...pathParts,
            fileName
        ].join('/')

        console.log('📂 Relative path:', relativePath)

        // Upload le document
        const result = await this.documentService.upload(file, {
            associationId: currentUser.associationId!,
            userId: currentUser.id,
            candidatId: currentUser.id,
            folderId: getFolderUser.id,
            documentRequirementId: body.documentRequirementId,
            category,
            visibility: 'private',
            name: body.name || requirement?.effectiveName || file.clientName,
            description: body.description || requirement?.effectivesInstructions || null,
            expirationDate: body.expirationDate ? DateTime.fromISO(body.expirationDate) : undefined,
            documentDate: body.documentDate ? DateTime.fromISO(body.documentDate) : undefined,
            pathFile: relativePath,
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
     * GET /api/v1/candidate/documents/:id
     * Voir un de mes documents
     */
    async show({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!

        console.log('📄 Show document request:', params.id, 'by user:', currentUser.id)

        // Charger le rôle si nécessaire
        if (!currentUser.role) {
            await currentUser.load('role', (query) => query.preload('permissions'))
        }

        const document = await Document.query()
            .where('id', params.id)
            .whereNull('deletedAt')
            .first()

        if (!document) {
            console.log('❌ Document not found')
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        // Vérifier les droits d'accès
        const isOwner = document.userId === currentUser.id || document.candidatId === currentUser.id
        const isSameAssociation = document.associationId === currentUser.associationId
        const isStaff = currentUser.roleLevel >= 50 // Staff ou plus
        const canReadDocuments = currentUser.hasPermission('documents.read')

        // Autoriser l'accès si:
        // - L'utilisateur est le propriétaire
        // - OU c'est de la même association ET (c'est un staff OU a la permission documents.read)
        const hasAccess = isOwner || (isSameAssociation && (isStaff || canReadDocuments || currentUser.isSuperAdmin))

        if (!hasAccess) {
            console.log('❌ Access denied:', {
                isOwner,
                isSameAssociation,
                isStaff,
                canReadDocuments,
                userRoleLevel: currentUser.roleLevel
            })
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        console.log('✅ Document found:', {
            id: document.id,
            name: document.name,
            mimeType: document.mimeType
        })

        const downloadUrl = await this.documentService.getDownloadUrl(document)

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
     * DELETE /api/v1/candidate/documents/:id
     * Supprimer un de mes documents
     */
    async destroy({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!

        console.log('🗑️ Delete document request:', params.id, 'by user:', currentUser.id)

        // Charger le rôle si nécessaire
        if (!currentUser.role) {
            await currentUser.load('role', (query) => query.preload('permissions'))
        }

        const document = await Document.query()
            .where('id', params.id)
            .whereNull('deletedAt')
            .first()

        if (!document) {
            console.log('❌ Document not found')
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        // Vérifier les droits d'accès
        const isOwner = document.userId === currentUser.id || document.candidatId === currentUser.id
        const isSameAssociation = document.associationId === currentUser.associationId
        const isStaff = currentUser.roleLevel >= 50 // Staff ou plus
        const canDeleteDocuments = currentUser.hasPermission('documents.delete')

        // Autoriser la suppression si:
        // - L'utilisateur est le propriétaire
        // - OU c'est de la même association ET (c'est un staff OU a la permission documents.delete)
        const hasAccess = isOwner || (isSameAssociation && (isStaff || canDeleteDocuments || currentUser.isSuperAdmin))

        if (!hasAccess) {
            console.log('❌ Delete access denied:', {
                isOwner,
                isSameAssociation,
                isStaff,
                canDeleteDocuments,
                userRoleLevel: currentUser.roleLevel
            })
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        // Les staff/admins peuvent supprimer n'importe quel document
        // Les candidats ne peuvent supprimer que les documents non approuvés
        if (isOwner && !isStaff && document.status === 'approved') {
            return response.forbidden({
                success: false,
                message: 'Vous ne pouvez pas supprimer un document approuvé',
            })
        }

        console.log('✅ Deleting document:', document.id)
        await document.softDelete()

        return response.ok({
            success: true,
            message: 'Document supprimé',
        })
    }

    /**
     * GET /api/v1/candidate/documents/:id/download
     * Télécharger un de mes documents
     */
    async download({ auth, params, response }: HttpContext) {
        const currentUser = auth.user!

        console.log('📥 Download request for document:', params.id, 'by user:', currentUser.id)

        // Charger le rôle si nécessaire
        if (!currentUser.role) {
            await currentUser.load('role', (query) => query.preload('permissions'))
        }

        const document = await Document.query()
            .where('id', params.id)
            .whereNull('deletedAt')
            .first()

        if (!document) {
            console.log('❌ Document not found')
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        // Vérifier les droits d'accès
        const isOwner = document.userId === currentUser.id || document.candidatId === currentUser.id
        const isSameAssociation = document.associationId === currentUser.associationId
        const isStaff = currentUser.roleLevel >= 50 // Staff ou plus
        const canReadDocuments = currentUser.hasPermission('documents.read')

        // Autoriser l'accès si:
        // - L'utilisateur est le propriétaire
        // - OU c'est de la même association ET (c'est un staff OU a la permission documents.read)
        const hasAccess = isOwner || (isSameAssociation && (isStaff || canReadDocuments || currentUser.isSuperAdmin))

        if (!hasAccess) {
            console.log('❌ Access denied:', {
                isOwner,
                isSameAssociation,
                isStaff,
                canReadDocuments,
                userRoleLevel: currentUser.roleLevel
            })
            return response.forbidden({
                success: false,
                message: 'Accès non autorisé',
            })
        }

        console.log('📄 Document found:', {
            id: document.id,
            filePath: document.filePath,
            mimeType: document.mimeType,
            originalName: document.originalName
        })

        const localPath = this.documentService.getLocalPath(document)
        console.log('📁 Local path:', localPath)

        if (!existsSync(localPath)) {
            console.log('❌ File does not exist at path:', localPath)
            return response.notFound({
                success: false,
                message: 'Fichier non trouvé sur le serveur',
            })
        }

        console.log('✅ File exists, streaming...')

        // Encoder le nom du fichier pour éviter les erreurs avec les caractères spéciaux
        // Utiliser RFC 5987 encoding pour supporter les caractères non-ASCII
        const encodedFileName = encodeURIComponent(document.originalName)
        const contentDisposition = `attachment; filename="${document.originalName.replace(/[^\x20-\x7E]/g, '_')}"; filename*=UTF-8''${encodedFileName}`

        response.header('Content-Type', document.mimeType)
        response.header('Content-Disposition', contentDisposition)
        response.header('Content-Length', document.fileSize.toString())

        return response.stream(createReadStream(localPath))
    }

    /**
     * POST /api/v1/candidate/documents/:id/replace
     * Remplacer un document (nouvelle version)
     */
    async replace({ auth, params, request, response }: HttpContext) {
        const currentUser = auth.user!

        const oldDocument = await Document.query()
            .where('id', params.id)
            .where('userId', currentUser.id)
            .whereNull('deletedAt')
            .first()

        if (!oldDocument) {
            return response.notFound({
                success: false,
                message: 'Document non trouvé',
            })
        }

        const file = request.file('file', {
            size: '10mb',
            extnames: ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx'],
        })

        if (!file) {
            return response.badRequest({
                success: false,
                message: 'Aucun fichier fourni',
            })
        }

        // Soft delete l'ancien document
        await oldDocument.softDelete()

        // Upload le nouveau avec la même catégorie
        const result = await this.documentService.upload(file, {
            associationId: currentUser.associationId!,
            userId: currentUser.id,
            category: oldDocument.category,
            visibility: 'private',
            name: oldDocument.name,
            description: oldDocument.description || undefined,
            expirationDate: oldDocument.expirationDate || undefined,
            documentDate: oldDocument.documentDate || undefined,
        })

        if (!result.success) {
        // Restaurer l'ancien document en cas d'erreur
        oldDocument.deletedAt = null
        await oldDocument.save()

        return response.badRequest({
            success: false,
            message: result.error,
        })
        }

        return response.ok({
        success: true,
        message: 'Document remplacé avec succès',
        data: {
            document: result.document!.serialize(),
            previousDocumentId: oldDocument.id,
        },
        })
    }



      /**
     * ========================================
     * VÉRIFICATION COMPLÉTION
     * ========================================
     */

    /**
     * GET /api/v1/candidate/completion
     * Vérifier ma complétion de documents
     */
    async completion({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        // Calculer si mineur
        const isMinor = currentUser.dateOfBirth
            ? DateTime.now().diff(currentUser.dateOfBirth, 'years').years < 18
            : false

        const result = await this.requirementService.checkCompletion(
            currentUser.associationId!,
            currentUser.id,
            {
                isCandidat: true,
                requiredAt: 'registration',
            }
        )

        return response.ok({
            success: true,
            data: result,
        })
    }

    /**
     * GET /api/v1/candidate/can-submit
     * Vérifier si je peux soumettre ma candidature
     */
    async canSubmit({ auth, response }: HttpContext) {
        const currentUser = auth.user!

        // Calculer si mineur
        const isMinor = currentUser.dateOfBirth
            ? DateTime.now().diff(currentUser.dateOfBirth, 'years').years < 18
            : false

        const result = await this.requirementService.canBeApproved(
            currentUser.associationId!,
            currentUser.id,
        )

        return response.ok({
            success: true,
            data: {
                canSubmit: result.canApprove,
                missingDocuments: result.missing,
                message: result.canApprove
                ? 'Vous pouvez soumettre votre candidature'
                : `Documents manquants : ${result.missing.join(', ')}`,
            },
        })
    }

}