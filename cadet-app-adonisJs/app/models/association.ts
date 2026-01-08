import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { AssociationStatus } from '../../types/HelperPermAndRole.js'
import User from './user.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

export default class Association extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /**
   * Informations générales
   */

  @column()
  declare name: string

  @column()
  declare rna?: string | null // Numéro RNA (w + 9 chiffres)

  @column()
  declare siret?: string | null // 14 chiffres

  /**
   * Contact
   */

  @column()
  declare email?: string | null

  @column()
  declare phone?: string | null

  /**
   * Adresse
   */
  @column()
  declare address: string

  @column()
  declare city: string

  @column()
  declare postalCode: string

  @column()
  declare country: string

  /**
   * Statut et abonnement
   */

  @column()
  declare status: AssociationStatus

  @column.dateTime()
  declare approvedAt: DateTime | null

  @column.dateTime()
  declare subscribedAt: DateTime | null

  @column.dateTime()
  declare subscriptionEndsAt: DateTime | null

  /**
   * Métadonnées
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Relations
   */
  @hasMany(() => User)
  declare users: HasMany<typeof User>

  /**
   * Computed: Association active ?
   */
  get isActive(): boolean {
    return this.status === AssociationStatus.ACTIVE
  }
  /**
   * Computed: Abonnement valide ?
   */
  get hasValidSubscription(): boolean {
    if (!this.subscriptionEndsAt) return false
    return this.subscriptionEndsAt > DateTime.now()
  }

  /**
   * Sérialisation
   */
  serializa() {
    return {
      id: this.id,
      name: this.name,
      rna: this.rna,
      siret: this.siret,
      email: this.email,
      phone: this.phone,
      address: this.address,
      city: this.city,
      postalCode: this.postalCode,
      country: this.country,
      status: this.status,
      hasValidSubscription: this.hasValidSubscription,
      approvedAt: this.approvedAt?.toISO() ?? null,
      subscribedAt: this.subscribedAt?.toISO() ?? null,
      subscriptionEndsAt: this.subscriptionEndsAt?.toISO() ?? null,
      createdAt: this.createdAt.toISO(),
      updatedAt: this.updatedAt.toISO(),
    }
  }

}