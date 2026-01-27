import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import Association from './association.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Folder from './folder.js'
import AssociationDocumentRequirement from './association_document_requirement.js'

export type DocumentCategory =
  | 'identity'
  | 'medical'
  | 'parental_authorization'
  | 'insurance'
  | 'registration'
  | 'certificate'
  | 'report'
  | 'administrative'
  | 'training'
  | 'photo'
  | 'other'

  /**
   * Visibilité des documents
   */
export type DocumentVisibility = 'private' | 'staff' | 'members' | 'cadet_breveter' | 'cadet' | 'candidat' | 'public'

export type DocumentStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'archived'

export const DocumentCategoryLabels: Record<DocumentCategory, string> = {
  identity: 'Pièce d\'identité',
  medical: 'Certificat médical',
  parental_authorization: 'Autorisation parentale',
  insurance: 'Attestation d\'assurance',
  registration: 'Dossier d\'inscription',
  certificate: 'Certificat / Diplôme',
  report: 'Rapport',
  administrative: 'Document administratif',
  training: 'Support de formation',
  photo: 'Photo',
  other: 'Autre',
}

/**
 * Labels pour les statuts
 */
export const DocumentStatusLabels: Record<DocumentStatus, string> = {
  pending: 'En attente',
  approved: 'Validé',
  rejected: 'Rejeté',
  expired: 'Expiré',
  archived: 'Archivé'
}

/**
 * Labels pour la visibilité
 */
export const DocumentVisibilityLabels: Record<DocumentVisibility, string> = {
  private: 'Privé',
  staff: 'Staff uniquement',
  members: 'Tous les membres',
  cadet_breveter: 'Cadet breveter',
  cadet: 'Cadet',
  candidat: 'Candidat',
  public: 'Public',
}

export default class Document extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare associationId: number

  @column()
  declare userId: number

  @column()
  declare candidatId: number | null

  @column()
  declare folderId: number | null

  @column()
  declare documentRequirementId: number | null

  @column()
  declare name: string

  @column()
  declare originalName: string

  @column()
  declare filePath: string

  @column()
  declare fileUrl: string | null

  @column()
  declare mimeType: string

  @column()
  declare fileSize: number

  @column()
  declare extension: string

  // Catégorisation
  @column()
  declare category: DocumentCategory

  @column()
  declare visibility: DocumentVisibility

  @column()
  declare status: DocumentStatus

  // Métadonnées
  @column()
  declare description: string | null

  @column({
    prepare: (value) => (value ? JSON.stringify(value) : null),
    consume: (value) => (value ? JSON.parse(value) : null),
  })
  declare metadata: Record<string, unknown> | null

  @column.date()
  declare expirationDate: DateTime | null

  @column.date()
  declare documentDate: DateTime | null

  @column()
  declare validatedBy: number | null

  @column.dateTime()
  declare validatedAt: DateTime | null

  @column()
  declare rejectionReason: string | null

  @column()
  declare version: number

  @column()
  declare parentId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  /**
   * =====
   * RELATIONS
   * =====
   */
  @belongsTo(() => Association)
  declare association: BelongsTo<typeof Association>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'candidatId' })
  declare candidat: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'validatedBy' })
  declare validator: BelongsTo<typeof User>

  @belongsTo(() => Folder, { foreignKey: 'folderId' })
  declare folder: BelongsTo<typeof Folder>

  @belongsTo(() => AssociationDocumentRequirement, { foreignKey: 'documentRequirementsId' })
  declare documentRequirement: BelongsTo<typeof AssociationDocumentRequirement>

  @belongsTo(() => Document, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Document>

  @hasMany(() => Document, { foreignKey: 'parentId' })
  declare versions: HasMany<typeof Document>

  /**
   * =====
   * GETTERS
   * =====
   */
  get fileSizeFormatted(): string {
    const bytes = this.fileSize
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Document expiré ?
  get isExpired(): boolean {
    if (!this.expirationDate) return false

    return this.expirationDate < DateTime.now()
  }

  /**
   * Document en attente de validation ?
   */
  get isPending(): boolean {
    return this.status === 'pending'
  }

  /**
   * Document validé ?
   */
  get isApproved(): boolean {
    return this.status === 'approved'
  }

  /**
   * Label de la catégorie
   */
  get categoryLabel(): string {
    return DocumentCategoryLabels[this.category] || this.category
  }

  /**
   * Label du statut
   */
  get statusLabel(): string {
    return DocumentStatusLabels[this.status] || this.status
  }

  /**
   * Label de la visibilité
   */
  get visibilityLabel(): string {
    return DocumentVisibilityLabels[this.visibility] || this.visibility
  }

  /**
   * =====
   * Méthodes d'instance
   * =====
   */
  async approve(validatorId: number): Promise<void> {
    this.status = 'approved'
    this.validatedBy = validatorId
    this.validatedAt = DateTime.now()
    this.rejectionReason = null
    await this.save()
  }

  async reject(validatorId: number, reason: string): Promise<void> {
    this.status = 'rejected'
    this.validatedBy = validatorId
    this.validatedAt = DateTime.now()
    this.rejectionReason = reason
    await this.save()
  }
  
  async archive(): Promise<void> {
    this.status = 'archived'
    await this.save()
  }

  async markAsExpired(): Promise<void> {
    this.status = 'expired'
    await this.save()
  }

  async softDelete(): Promise<void> {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  /**
   * =====
   * Méthode statiques
   * =====
   */

  /**
   * Documents expirés 
   */

  static async findExpired(): Promise<Document[]> {
    return this.query()
      .whereNull('deletedAt')
      .where('status', 'approved')
      .whereNotNull('expirationDate')
      .where('expirationDate', '<', DateTime.now().toSQL())
  }

  /**
   * Marquer tous les documents expirés
   */
  static async markAllExpired(): Promise<number> {
    const result = await this.query()
      .whereNull('deletedAt')
      .where('status', 'approved')
      .whereNotNull('expirationDate')
      .where('expirationDate', '<', DateTime.now().toSQL())
      .update({ status: 'expired'})

    return result[0]
  }

  /**
   * Documents en attente pour une association
   */
  static async pendingForAssociation(associationId: number): Promise<Document[]> {
    return this.query()
      .where('associationId', associationId)
      .whereNull('deletedAt')
      .where('status', 'pending')
      .preload('user')
      .preload('candidat')
      .orderBy('createdAt', 'asc')
  }

  /**
   * Documents d'un utilisateur
   */
  static async forUser(userId: number): Promise<Document[]> {
    return this.query()
      .where('userId', userId)
      .whereNull('deletedAt')
      .orderBy('createdAt', 'desc')
  }

  /**
   * Document d'un candidat
   */
  static async forCandidat(candidatId: number): Promise<Document[]> {
    return this.query()
      .where('candidatId', candidatId)
      .whereNull('deletedAt')
      .orderBy('createdAt', 'desc')
  }
   
  /**
   * ========================================
   * SÉRIALISATION
   * ========================================
   */

  serialize() {
    return {
      id: this.id,
      associationId: this.associationId,
      userId: this.userId,
      candidatId: this.candidatId,
      folderId: this.folderId,
      documentRequirementId: this.documentRequirementId,
      name: this.name,
      originalName: this.originalName,
      fileName: this.originalName,
      filePath: this.filePath,
      fileUrl: this.fileUrl,
      mimeType: this.mimeType,
      fileSize: this.fileSize,
      fileSizeFormatted: this.fileSizeFormatted,
      extension: this.extension,
      category: this.category,
      categoryLabel: this.categoryLabel,
      visibility: this.visibility,
      visibilityLabel: this.visibilityLabel,
      status: this.status,
      statusLabel: this.statusLabel,
      description: this.description,
      metadata: this.metadata,
      expirationDate: this.expirationDate?.toISODate(),
      documentDate: this.documentDate?.toISODate(),
      isExpired: this.isExpired,
      isPending: this.isPending,
      isApproved: this.isApproved,
      version: this.version,
      validatedAt: this.validatedAt?.toISO(),
      rejectionReason: this.rejectionReason,
      createdAt: this.createdAt?.toISO(),
      updatedAt: this.updatedAt?.toISO(),
      // Relations
      user: this.user?.serialize(),
      cadet: this.candidat?.serialize(),
      validator: this.validator?.serialize(),
    }
  }

  serializeBasic() {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      categoryLabel: this.categoryLabel,
      status: this.status,
      statusLabel: this.statusLabel,
      fileSize: this.fileSizeFormatted,
      extension: this.extension,
      createdAt: this.createdAt?.toISO(),
    }
  }
}