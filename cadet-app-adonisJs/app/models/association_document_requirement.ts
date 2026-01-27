import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import Association from './association.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import DocumentType from './document_type.js'
import Document from './document.js'

/**
 * Pour qui le document est requis
 */
export type RequiredFor = 'all' | 'cadets' | 'candidates' | 'staff' | 'minors'

/**
 * Étape où le document est requis
 */
export type RequiredAt = 'registration' | 'approval' | 'anytime'

/**
 * Labels pour RequiredFor
 */
export const RequiredForLabels: Record<RequiredFor, string> = {
  all: 'Tous les membres',
  cadets: 'Cadets uniquement',
  candidates: 'Candidats uniquement',
  staff: 'Staff uniquement',
  minors: 'Mineurs uniquement',
}

/**
 * Labels pour RequiredAt
 */
export const RequiredAtLabels: Record<RequiredAt, string> = {
  registration: 'À l\'inscription',
  approval: 'Avant approbation',
  anytime: 'N\'importe quand',
}

export default class AssociationDocumentRequirement extends BaseModel {
  static table = 'association_document_requirements'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare associationId: number

  @column()
  declare documentTypeId: number

  @column()
  declare isEnabled: boolean

  @column()
  declare isRequired: boolean

  @column()
  declare requiredFor: RequiredFor | null

  @column()
  declare requiredAt: RequiredAt

  @column()
  declare customInstructions: string | null

  @column()
  declare customName: string | null

  @column()
  declare sortOrder: number

  @column()
  declare customValidityDays: number | null

  @column()
  declare templateDocumentId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

   /**
   * ========================================
   * RELATIONS
   * ========================================
   */
  @belongsTo(() => Association)
  declare association: BelongsTo<typeof Association>

  @belongsTo(() => DocumentType)
  declare documentType: BelongsTo<typeof DocumentType>

  @belongsTo(() => Document, {
    foreignKey: 'templateDocumentId',
  })
  declare templateDocument: BelongsTo<typeof Document>

   /**
   * ========================================
   * GETTERS
   * ========================================
   */

  /**
   * Nom effectif (custom ou celui du type)
   */
  get effectiveName(): string {
    return this.customName || this.documentType?.name || ''
  }

  /**
   * Instructions effectives
   */
  get effectivesInstructions(): string | null {
    return this.customInstructions || this.documentType?.description || null
  }

  /**
   * Durée de validité effective
   */
  get effectiveValidityDays(): number | null {
    return this.customValidityDays || this.documentType?.validityDays || null
  }

  /**
   * Pour qui effectif (custom ou celui du type)
   */
  get effectiveRequiredFor(): RequiredFor | null {
    return this.requiredFor || this.documentType?.requiredFor || null
  }

  get requiredForLabel(): string {
    const value = this.effectiveRequiredFor
    return value ? RequiredForLabels[value] : ''
  }

  get requiredAtLabel(): string {
    return RequiredAtLabels[this.requiredAt] || this.requiredAt
  }

  /**
   * ========================================
   * MÉTHODES STATIQUES
   * ========================================
   */

  /**
   * Récupérer les exigences d'une association
   */
  static async forAssociation(associationId: number): Promise<AssociationDocumentRequirement[]> {
    return this.query()
      .where('associationId', associationId)
      .where('isEnabled', true)
      .where('isRequired', true)
      .where('requiredAt', 'registration')
      .preload('documentType')
      .preload('templateDocument')
      .orderBy('sortOrder', 'asc')
  }

  /**
   * Récupérer les exigences requises pour l'inscription
   */
  static async forRegistration(associationId: number): Promise<AssociationDocumentRequirement[]> {
    return this.query()
      .where('associationId', associationId)
      .where('isEnabled', true)
      .where('isRequired', true)
      .where('requiredAt', 'registration')
      .preload('documentType')
      .preload('templateDocument')
      .orderBy('sortOrder', 'asc')
  }

  /**
   * Récupérer les exigences requises avant approbation
   */
  static async forApproval(associationId: number): Promise<AssociationDocumentRequirement[]> {
    return this.query()
      .where('associationId', associationId)
      .where('isEnabled', true)
      .where('isRequired', true)
      .whereIn('requiredAt', ['registration', 'approval'])
      .preload('documentType')
      .preload('templateDocument')
      .orderBy('sortOrder', 'asc')
  }

  /**
   * Récupérér les exigences pour un profil spécifique
   */
  static async forProfile(
    associationId: number,
    options: {
      isCadet?: boolean
      isCandidats?: boolean
      isStaff?: boolean
      isAssociation?: boolean
    }
  ): Promise<AssociationDocumentRequirement[]> {
    const query = this.query()
      .where('associationId', associationId)
      .where('isEnabled', true)
      .preload('documentType')
      .preload('templateDocument')
      .orderBy('sortOrder', 'asc')

    // Filtrer selon le profil

    query.where((q) => {
      q.whereNull('requiredFor').orWhere('requiredFor', 'all')

      if (options.isCadet) {
        q.orWhere('requiredFor', 'cadets')
      }

      if (options.isCandidats) {
        q.orWhere('requiredFor', 'candidates')
      }

      if (options.isStaff) {
        q.orWhere('requiredFor', 'staff')
      }
    })

    return query
  }

  /**
   * Initialiser les exigences par défaut pour une association
   * (copie les types globaux)
   */
  static async initializeForAssociation(associationId: number): Promise<void> {
    // Récupérer les types globaux
    const globalTypes = await DocumentType.query()
      .whereNull('associationId')
      .where('isActive', true)
      .orderBy('sortOrder', 'asc')

    // Créer les exigences par défaut
    for (const docType of globalTypes) {
      const existing = await this.query()
        .where('associationId', associationId)
        .where('documentTypeId', docType.id)
        .first()

      if (!existing) {
        await this.create({
          associationId,
          documentTypeId: docType.id,
          isEnabled: docType.isRequired, // Activer par défaut si requis globalement
          isRequired: docType.isRequired,
          requiredFor: docType.requiredFor,
          requiredAt: 'registration',
          sortOrder: docType.sortOrder,
        })
      }
    }
  }

  /**
   * Vérifier si un utilisateur a tous les documents requis
   */
  static async checkUserCompletion(
    associationId: number,
    userId: number,
    options: {
      isCandidat?: boolean
      requiredAt?: RequiredAt
    } = {}
  ): Promise<{ isComplete: boolean
    total: number
    completed: number
    missing: AssociationDocumentRequirement[]
  }> {
    const Document = (await import('./document.js')).default

    let query = this.query()
      .where('associationId', associationId)
      .where('isEnabled', true)
      .where('isRequired', true)
      .preload('documentType')

    if (options.requiredAt) {
      if (options.requiredAt === 'approval') {
        query.whereIn('requiredAt', ['registration', 'approval'])
      } else {
        query.where('requiredAt', options.requiredAt)
      }
    }

    // Filtrer pour les candidats si applicable
    if (options.isCandidat !== undefined) {
      query.where((q) => {
        q.whereNull('requiredFor')
          .orWhere('requiredFor', 'all')
        if (options.isCandidat) {
          q.orWhere('requiredFor', 'candidates')
        }
      })
    }

    const requirements = await query;

    const userDocuments = await Document.query()
      .where('associationId', associationId)
      .where('userId', userId)
      .whereNull('deletedAt')
      .whereIn('status', ['pending', 'approved'])

    const missing: AssociationDocumentRequirement[] = []

    for (const req of requirements) {
      const hasDocument = userDocuments.some(
        (doc) => doc.category === req.documentType.category
      )
      if (!hasDocument) {
        missing.push(req)
      }
    }

    return {
      isComplete: missing.length === 0,
      total: requirements.length,
      completed: requirements.length - missing.length,
      missing,
    }
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
      documentTypeId: this.documentTypeId,
      isEnabled: this.isEnabled,
      isRequired: this.isRequired,
      requiredFor: this.effectiveRequiredFor,
      requiredForLabel: this.requiredForLabel,
      requiredAt: this.requiredAt,
      requiredAtLabel: this.requiredAtLabel,
      customInstructions: this.customInstructions,
      customName: this.customName,
      sortOrder: this.sortOrder,
      customValidityDays: this.customValidityDays,
      templateDocumentId: this.templateDocumentId,
      // Valeurs effectives
      effectiveName: this.effectiveName,
      effectiveInstructions: this.effectivesInstructions,
      effectiveValidityDays: this.effectiveValidityDays,
      // Relations
      documentType: this.documentType?.serialize(),
      templateDocument: this.templateDocument ? {
        id: this.templateDocument.id,
        name: this.templateDocument.name,
        fileName: this.templateDocument.fileName,
        fileUrl: this.templateDocument.fileUrl,
        mimeType: this.templateDocument.mimeType,
      } : null,
      // Timestamps
      createdAt: this.createdAt?.toISO(),
      updatedAt: this.updatedAt?.toISO(),
    }
  }

  serializeForRegistration() {
    return {
      id: this.id,
      documentTypeId: this.documentTypeId,
      name: this.effectiveName,
      description: this.effectivesInstructions,
      category: this.documentType?.category,
      isRequired: this.isRequired,
      requiredFor: this.effectiveRequiredFor,
      requiredForLabel: this.requiredForLabel,
      allowedExtensions: this.documentType?.allowedExtensions,
      maxFileSize: this.documentType?.maxFileSize,
      validityDays: this.effectiveValidityDays,
      sortOrder: this.sortOrder,
      templateDocument: this.templateDocument ? {
        id: this.templateDocument.id,
        name: this.templateDocument.name,
        fileName: this.templateDocument.fileName,
        fileUrl: this.templateDocument.fileUrl,
        mimeType: this.templateDocument.mimeType,
      } : null,
    }
  }
}