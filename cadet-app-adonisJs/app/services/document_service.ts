import { DateTime } from 'luxon'
import { createReadStream, createWriteStream, existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { join, extname } from 'node:path'
import { randomUUID } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import env from '#start/env'
import Document, { DocumentCategory, DocumentVisibility, DocumentStatus } from '#models/document'
import DocumentType from '#models/document_type'
import app from '@adonisjs/core/services/app'

/**
 * Configuration du stockage
 */
interface StorageConfig {
  driver: 'local' | 's3'
  localPath: string
  s3: {
    endpoint: string
    region: string
    bucket: string
    accessKeyId: string
    secretAccessKey: string
  }
}

/**
 * Options d'upload
 */
interface UploadOptions {
  associationId: number
  userId: number
  candidatId?: number
  folderId?: number
  documentRequirementId?: number
  category: DocumentCategory
  visibility?: DocumentVisibility
  name?: string
  description?: string
  expirationDate?: DateTime
  documentDate?: DateTime
  metadata?: Record<string, unknown>
  pathFile?: string
  isTemplate?: boolean // Skip category-specific validation for template documents
}

/**
 * Résultat d'upload
 */
interface UploadResult {
  success: boolean
  document?: Document
  error?: string
}

/**
 * Options de liste
 */
interface ListOptions {
  associationId: number
  userId?: number
  candidatId?: number
  category?: DocumentCategory
  status?: DocumentStatus
  visibility?: DocumentVisibility
  search?: string
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * ========================================
 * SERVICE DE DOCUMENTS
 * ========================================
 */

export default class DocumentService {
  private config: StorageConfig
  private s3Client: S3Client | null = null

  /**
   * Mapper pour détecter le MIME type correct basé sur l'extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'txt': 'text/plain',
      'csv': 'text/csv',

      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',

      // Audio/Video
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
    }

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
  }

  constructor() {
    this.config = {
      driver: (env.get('STORAGE_DRIVER', 'local') as 'local' | 's3'),
      localPath: env.get('STORAGE_LOCAL_PATH', 'storage/uploads'),
      s3: {
        endpoint: env.get('S3_ENDPOINT', ''),
        region: env.get('S3_REGION', 'fr-par'),
        bucket: env.get('S3_BUCKET', ''),
        accessKeyId: env.get('S3_ACCESS_KEY_ID', ''),
        secretAccessKey: env.get('S3_SECRET_ACCESS_KEY', ''),
      },
    }

    // Initialiser le client S3 si nécessaire
    if (this.config.driver === 's3' && this.config.s3.endpoint) {
      this.s3Client = new S3Client({
        endpoint: this.config.s3.endpoint,
        region: this.config.s3.region,
        credentials: {
          accessKeyId: this.config.s3.accessKeyId,
          secretAccessKey: this.config.s3.secretAccessKey,
        },
        forcePathStyle: true, // Nécessaire pour Scaleway
      })
    }
  }

  /**
   * ========================================
   * UPLOAD
   * ========================================
   */

  /**
   * Upload un fichier
   */
  async upload(file: MultipartFile, options: UploadOptions): Promise<UploadResult> {
    try {
      // Valider le fichier
      const validationError = await this.validateFile(file, options)
      if (validationError) {
        return { success: false, error: validationError }
      }

      // Générer un nom unique
      const fileId = randomUUID()
      const extension = extname(file.clientName).toLowerCase().slice(1)
      const fileName = `${fileId}.${extension}`

      // Générer le chemin du fichier si non fourni
      let filePath = options.pathFile
      if (!filePath) {
        // Construire le chemin par défaut: associations/{associationId}/{category}/{fileName}
        filePath = [
          'associations',
          String(options.associationId),
          options.category,
          fileName
        ].join('/')
      }

      console.log('📂 Generated file path:', filePath)

      // Upload selon le driver
      let fileUrl: string | null = null
      if (this.config.driver === 's3') {
        //fileUrl = await this.uploadToS3(file, filePath)
      } else {
        await this.uploadToLocal(file, filePath)
      }

      // Détecter le bon MIME type
      const mimeType = this.getMimeTypeFromExtension(extension) || file.type || 'application/octet-stream'

      // Créer l'entrée en BDD
      const documentData = {
        associationId: options.associationId,
        userId: options.userId,
        candidatId: options.candidatId || null,
        folderId: options.folderId || null,
        documentRequirementId: options.documentRequirementId || null,
        name: options.name || file.clientName,
        originalName: file.clientName,
        filePath: filePath,
        fileUrl,
        mimeType,
        fileSize: file.size,
        extension,
        category: options.category,
        visibility: options.visibility || 'private',
        status: 'pending',
        description: options.description || null,
        metadata: options.metadata || null,
        expirationDate: options.expirationDate || null,
        documentDate: options.documentDate || null,
        version: 1,
      }

      console.log('💾 Creating document in DB with data:', {
        ...documentData,
        folderId: documentData.folderId,
        documentRequirementId: documentData.documentRequirementId,
        name: documentData.name,
      })

      const document = await Document.create(documentData)

      console.log('✅ Document created with ID:', document.id, 'folderId:', document.folderId)

      return { success: true, document }
    } catch (error) {
      console.error('Upload error:', error)
      return { success: false, error: 'Erreur lors de l\'upload du fichier' }
    }
  }

  /**
   * Upload vers S3 (Scaleway Object Storage)
   */
  private async uploadToS3(file: MultipartFile, filePath: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not configured')
    }

    const fileBuffer = await this.fileToBuffer(file)

    const command = new PutObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: filePath,
      Body: fileBuffer,
      ContentType: file.type || 'application/octet-stream',
      ACL: 'private',
    })

    await this.s3Client.send(command)

    // Retourner l'URL (sans signature, on générera une URL signée à la demande)
    return `${this.config.s3.endpoint}/${this.config.s3.bucket}/${filePath}`
  }

  /**
   * Upload en local
   */
  private async uploadToLocal(file: MultipartFile, filePath: string): Promise<void> {
    const fullPath = join(app.makePath(this.config.localPath), filePath)
    const directory = join(fullPath, '..')
    const fileName = filePath.split('/').pop()

    console.log('📤 uploadToLocal - Input filePath:', filePath)
    console.log('📁 uploadToLocal - Full path:', fullPath)
    console.log('📂 uploadToLocal - Directory:', directory)
    console.log('📄 uploadToLocal - File name:', fileName)

    // Créer le répertoire si nécessaire
    if (!existsSync(directory)) {
      console.log('🆕 Creating directory:', directory)
      mkdirSync(directory, { recursive: true })
    } else {
      console.log('✅ Directory already exists:', directory)
    }

    // Déplacer le fichier
    await file.move(directory, { name: fileName })
    console.log('✅ File moved successfully to:', join(directory, fileName!))
  }

  /**
   * ========================================
   * DOWNLOAD / ACCESS
   * ========================================
   */

  /**
   * Obtenir une URL de téléchargement (signée pour S3)
   */
  async getDownloadUrl(document: Document, expiresInSeconds: number = 3600): Promise<string> {
    if (this.config.driver === 's3' && this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: document.filePath,
      })

      return getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds })
    }

    // En local, retourner le chemin API
    return `/api/v1/documents/${document.id}/download`
  }

  /**
   * Obtenir le chemin local d'un fichier
   */
  getLocalPath(document: Document): string {
    return join(app.makePath(this.config.localPath), document.filePath)
  }

  /**
   * Télécharger depuis S3 vers un fichier temporaire
   */
  async downloadFromS3(document: Document): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 client not configured')
    }

    const command = new GetObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: document.filePath,
    })

    const response = await this.s3Client.send(command)
    const tempPath = join(app.tmpPath(), `download_${randomUUID()}.${document.extension}`)

    // Créer le répertoire tmp si nécessaire
    const tmpDir = app.tmpPath()
    if (!existsSync(tmpDir)) {
      mkdirSync(tmpDir, { recursive: true })
    }

    // Écrire le fichier
    const writeStream = createWriteStream(tempPath)
    await pipeline(response.Body as NodeJS.ReadableStream, writeStream)

    return tempPath
  }

  /**
   * ========================================
   * DELETE
   * ========================================
   */

  /**
   * Supprimer un document (soft delete par défaut)
   */
  async delete(document: Document, hardDelete: boolean = false): Promise<void> {
    if (hardDelete) {
      // Supprimer le fichier physique
      await this.deleteFile(document.filePath)
      // Supprimer l'entrée BDD
      await document.delete()
    } else {
      // Soft delete
      await document.softDelete()
    }
  }

  /**
   * Supprimer le fichier physique
   */
  private async deleteFile(filePath: string): Promise<void> {
    if (this.config.driver === 's3' && this.s3Client) {
      const command = new DeleteObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: filePath,
      })
      await this.s3Client.send(command)
    } else {
      const fullPath = join(app.makePath(this.config.localPath), filePath)
      if (existsSync(fullPath)) {
        unlinkSync(fullPath)
      }
    }
  }

  /**
   * ========================================
   * VALIDATION
   * ========================================
   */

  /**
   * Valider un fichier
   */
  async validateFile(file: MultipartFile, options: UploadOptions): Promise<string | null> {
    // Vérifier si le fichier existe
    if (!file) {
      return 'Aucun fichier fourni'
    }

    // Vérifier les erreurs de validation du fichier
    if (!file.isValid) {
      return file.errors[0]?.message || 'Fichier invalide'
    }

    // Skip category-specific validation for template documents
    if (!options.isTemplate) {
      // Récupérer les types de documents pour cette catégorie
      const documentTypes = await DocumentType.query()
        .where((query) => {
          query.whereNull('associationId').orWhere('associationId', options.associationId)
        })
        .where('category', options.category)
        .where('isActive', true)
        .first()

      if (documentTypes) {
        // Vérifier l'extension
        if (documentTypes.allowedExtensions && documentTypes.allowedExtensions.length > 0) {
          const extension = extname(file.clientName).toLowerCase().slice(1)
          console.log('🔍 Debug extension:', {
            clientName: file.clientName,
            extname: extname(file.clientName),
            extension: extension,
            allowedExtensions: documentTypes.allowedExtensions
          })
          if (!documentTypes.allowedExtensions.includes(extension)) {
            return `Extension non autorisée. Extensions acceptées: ${documentTypes.allowedExtensionsFormatted}`
          }
        }

        // Vérifier la taille
        if (documentTypes.maxFileSize && file.size > documentTypes.maxFileSize) {
          return `Fichier trop volumineux. Taille maximum: ${documentTypes.maxFileSizeFormatted}`
        }
      }
    }

    // Limites par défaut
    const maxSize = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSize) {
      return 'Fichier trop volumineux (max 10 MB)'
    }

    // Extensions autorisées par défaut
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xls', 'xlsx']
    const extension = extname(file.clientName).toLowerCase().slice(1)
    if (!allowedExtensions.includes(extension)) {
      return `Extension non autorisée. Extensions acceptées: ${allowedExtensions.join(', ')}`
    }

    return null
  }

  /**
   * ========================================
   * LISTING
   * ========================================
   */

  /**
   * Lister les documents
   */
  async list(options: ListOptions) {
    const query = Document.query()
      .where('associationId', options.associationId)
      .whereNull('deletedAt')
      .preload('user')

    // Filtres
    if (options.userId) {
      query.where('userId', options.userId)
    }

    if (options.candidatId) {
      query.where('candidatId', options.candidatId)
    }

    if (options.category) {
      query.where('category', options.category)
    }

    if (options.status) {
      query.where('status', options.status)
    }

    if (options.visibility) {
      query.where('visibility', options.visibility)
    }

    if (options.search) {
      query.where((q) => {
        q.whereILike('name', `%${options.search}%`)
          .orWhereILike('originalName', `%${options.search}%`)
          .orWhereILike('description', `%${options.search}%`)
      })
    }

    // Tri
    const sortBy = options.sortBy || 'createdAt'
    const sortOrder = options.sortOrder || 'desc'
    query.orderBy(sortBy, sortOrder)

    // Pagination
    const page = options.page || 1
    const limit = options.limit || 20

    return query.paginate(page, limit)
  }

  /**
   * Documents en attente de validation
   */
  async pending(associationId: number) {
    return Document.pendingForAssociation(associationId)
  }

  /**
   * Documents d'un utilisateur
   */
  async forUser(userId: number) {
    return Document.forUser(userId)
  }

  /**
   * Documents d'un cadet
   */
  async forCandidat(candidatId: number) {
    return Document.forCandidat(candidatId)
  }

  /**
   * ========================================
   * VERSIONING
   * ========================================
   */

  /**
   * Créer une nouvelle version d'un document
   */
  async createVersion(
    originalDocument: Document,
    file: MultipartFile,
    userId: number
  ): Promise<UploadResult> {
    const result = await this.upload(file, {
      associationId: originalDocument.associationId,
      userId,
      candidatId: originalDocument.candidatId || undefined,
      category: originalDocument.category,
      visibility: originalDocument.visibility,
      name: originalDocument.name,
      description: originalDocument.description || undefined,
      expirationDate: originalDocument.expirationDate || undefined,
      metadata: originalDocument.metadata || undefined,
    })

    if (result.success && result.document) {
      // Lier à la version précédente
      result.document.parentId = originalDocument.id
      result.document.version = originalDocument.version + 1
      await result.document.save()

      // Archiver l'ancienne version
      await originalDocument.archive()
    }

    return result
  }

  /**
   * ========================================
   * HELPERS
   * ========================================
   */

  /**
   * Générer le chemin de stockage
   */
  private generateFilePath(
    associationId: number,
    category: DocumentCategory,
    fileName: string
  ): string {
    const year = DateTime.now().year
    const month = DateTime.now().month.toString().padStart(2, '0')
    return `associations/${associationId}/${category}/${year}/${month}/${fileName}`
  }

  /**
   * Convertir un fichier en buffer
   */
  private async fileToBuffer(file: MultipartFile): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const stream = createReadStream(file.tmpPath!)
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  }

  /**
   * Statistiques des documents
   */
  async stats(associationId: number) {
    const total = await Document.query()
      .where('associationId', associationId)
      .whereNull('deletedAt')
      .count('* as count')

    const pending = await Document.query()
      .where('associationId', associationId)
      .whereNull('deletedAt')
      .where('status', 'pending')
      .count('* as count')

    const byCategory = await Document.query()
      .where('associationId', associationId)
      .whereNull('deletedAt')
      .select('category')
      .count('* as count')
      .groupBy('category')

    const byStatus = await Document.query()
      .where('associationId', associationId)
      .whereNull('deletedAt')
      .select('status')
      .count('* as count')
      .groupBy('status')

    const totalSize = await Document.query()
      .where('associationId', associationId)
      .whereNull('deletedAt')
      .sum('file_size as total')

    return {
      total: Number(total[0].$extras.count) || 0,
      pending: Number(pending[0].$extras.count) || 0,
      byCategory: byCategory.reduce(
        (acc, item) => {
          acc[item.category] = Number(item.$extras.count) || 0
          return acc
        },
        {} as Record<string, number>
      ),
      byStatus: byStatus.reduce(
        (acc, item) => {
          acc[item.status] = Number(item.$extras.count) || 0
          return acc
        },
        {} as Record<string, number>
      ),
      totalSize: Number(totalSize[0].$extras.total) || 0,
    }
  }
}