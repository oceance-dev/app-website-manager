import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Association from './association.js'
import type { DocumentCategory } from './document.js'

/**
 * Pour qui le document est requis
 */
export type RequiredFor = 'all' | 'cadets' | 'candidates' | 'staff' | 'minors'

export default class DocumentType extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare associationId: number | null

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare category: DocumentCategory

  @column()
  declare isRequired: boolean

  @column()
  declare isActive: boolean

  @column()
  declare requiresValidation: boolean

  @column()
  declare hasExpiration: boolean

  @column()
  declare validityDays: number | null

  @column({
    prepare: (value) => (value ? JSON.stringify(value) : null),
    consume: (value) => {
      if (!value) return null

      // Si c'est déjà un array, le retourner directement
      if (Array.isArray(value)) return value

      // Si c'est une string, essayer de parser
      if (typeof value === 'string') {
        // Essayer de parser comme JSON
        if (value.startsWith('[')) {
          try {
            return JSON.parse(value)
          } catch {
            // Si échec, traiter comme liste séparée par virgules
            return value.split(',').map(ext => ext.trim()).filter(Boolean)
          }
        }
        // Sinon, traiter comme liste séparée par virgules
        return value.split(',').map(ext => ext.trim()).filter(Boolean)
      }

      return null
    },
  })
  declare allowedExtensions: string[] | null

  @column()
  declare maxFileSize: number | null

  @column()
  declare requiredFor: RequiredFor | null

  @column()
  declare sortOrder: number

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

  /**
   * ========================================
   * GETTERS
   * ========================================
   */

  /**
   * Taille max formatée
   */
  get maxFileSizeFormatted(): string | null {
    if (!this.maxFileSize) return null
    const bytes = this.maxFileSize
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Extensions acceptées formatées
   */
  get allowedExtensionsFormatted(): string {
    if (!this.allowedExtensions || this.allowedExtensions.length === 0) {
      return 'Tous les formats'
    }
    return this.allowedExtensions.map((ext) => `.${ext}`).join(', ')
  }

  /**
   * ========================================
   * MÉTHODES STATIQUES
   * ========================================
   */

  /**
   * Types actifs pour une association
   */
  static async forAssociation(associationId: number): Promise<DocumentType[]> {
    return this.query()
      .where((query) => {
        query.whereNull('associationId').orWhere('associationId', associationId)
      })
      .where('isActive', true)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
  }

  /**
   * Types requis pour une association
   */
  static async requiredForAssociation(associationId: number): Promise<DocumentType[]> {
    return this.query()
      .where((query) => {
        query.whereNull('associationId').orWhere('associationId', associationId)
      })
      .where('isActive', true)
      .where('isRequired', true)
      .orderBy('sort_order', 'asc')
  }

  /**
   * Types requis pour un rôle spécifique
   */
  static async requiredForRole(
    associationId: number,
    requiredFor: RequiredFor
  ): Promise<DocumentType[]> {
    return this.query()
      .where((query) => {
        query.whereNull('associationId').orWhere('associationId', associationId)
      })
      .where('isActive', true)
      .where('isRequired', true)
      .where((query) => {
        query.where('requiredFor', 'all').orWhere('requiredFor', requiredFor)
      })
      .orderBy('sort_order', 'asc')
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
      name: this.name,
      slug: this.slug,
      description: this.description,
      category: this.category,
      isRequired: this.isRequired,
      isActive: this.isActive,
      requiresValidation: this.requiresValidation,
      hasExpiration: this.hasExpiration,
      validityDays: this.validityDays,
      allowedExtensions: this.allowedExtensions,
      allowedExtensionsFormatted: this.allowedExtensionsFormatted,
      maxFileSize: this.maxFileSize,
      maxFileSizeFormatted: this.maxFileSizeFormatted,
      requiredFor: this.requiredFor,
      sortOrder: this.sortOrder,
      createdAt: this.createdAt?.toISO(),
    }
  }
}