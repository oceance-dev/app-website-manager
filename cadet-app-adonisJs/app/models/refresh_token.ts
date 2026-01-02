import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export default class RefreshToken extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /**
   * Lien avec l'utilisateur
   */
  @column()
  declare userId: number

  /**
   * Hash du token (SHA256)
   * On ne stocke jamais le token en clair !
   */
  @column()
  declare tokenHash: string

  /**
   * Famille du token
   * Tous les tokens d'une même session partagent la même famille
   * Permet de révoquer tous les tokens en cas de vol détecté
   */
  @column()
  declare family: string

  /**
   * IP de création
   */
  @column()
  declare createdIp: string

  /**
   * User-Agent du client
   */
  @column()
  declare userAgent: string | null

  /**
   * Date d'expiration
   */
  @column.dateTime()
  declare expiresAt: DateTime

  /**
   * Date de dernière utilisation
   * Si non null, le token a été utilisé pour un refresh
   * et ne doit plus être accepté (rotation)
   */
  @column.dateTime()
  declare lastUsedAt: DateTime | null

  /**
   * Token révoqué (déconnexion ou sécurité)
   */
  @column()
  declare isRevoked: boolean

  /**
   * Timestamps
   */
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Relations
   */
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * ========================================
   * MÉTHODES D'INSTANCE
   * ========================================
   */

  /**
   * Vérifie si le token est valide (non expiré, non révoqué, non utilisé)
   */
  get isValid(): boolean {
    if (this.isRevoked) return false
    if (this.lastUsedAt) return false // Déjà utilisé pour rotation
    if (this.expiresAt < DateTime.now()) return false
    return true
  }

  /**
   * Vérifie si le token est expiré
   */
  get isExpired(): boolean {
    return this.expiresAt < DateTime.now()
  }

  /**
   * Vérifie si le token a déjà été utilisé pour un refresh
   */
  get wasUsed(): boolean {
    return this.lastUsedAt !== null
  }

  /**
   * Révoquer ce token
   */
  async revoke(): Promise<void> {
    this.isRevoked = true
    await this.save()
  }

  /**
   * Marquer comme utilisé (après rotation)
   */
  async markAsUsed(): Promise<void> {
    this.lastUsedAt = DateTime.now()
    await this.save()
  }

  /**
   * ========================================
   * MÉTHODES STATIQUES
   * ========================================
   */

  /**
   * Révoquer tous les tokens d'une famille
   * Utilisé quand on détecte une réutilisation (vol potentiel)
   */
  static async revokeFamily(family: string): Promise<number> {
    const result = await this.query()
      .where('family', family)
      .update({ is_revoked: true })

    return result[0] // Nombre de lignes affectées
  }

  /**
   * Révoquer tous les tokens d'un utilisateur
   * Utilisé pour déconnexion globale ou suspension de compte
   */
  static async revokeAllForUser(userId: number): Promise<number> {
    const result = await this.query()
      .where('user_id', userId)
      .update({ is_revoked: true })

    return result[0]
  }

  /**
   * Supprimer les tokens expirés (maintenance)
   * À appeler via une tâche CRON
   */
  static async deleteExpired(): Promise<number> {
    const result = await this.query()
      .where('expires_at', '<', DateTime.now().toSQL())
      .delete()

    return result[0]
  }

  /**
   * Supprimer les tokens révoqués de plus de X jours (maintenance)
   */
  static async deleteOldRevoked(daysOld: number = 7): Promise<number> {
    const cutoffDate = DateTime.now().minus({ days: daysOld })

    const result = await this.query()
      .where('is_revoked', true)
      .where('updated_at', '<', cutoffDate.toSQL())
      .delete()

    return result[0]
  }

  /**
   * Compter les tokens actifs d'un utilisateur
   */
  static async countActiveForUser(userId: number): Promise<number> {
    const result = await this.query()
      .where('user_id', userId)
      .where('is_revoked', false)
      .whereNull('last_used_at')
      .where('expires_at', '>', DateTime.now().toSQL())
      .count('* as total')

    return Number(result[0].$extras.total) || 0
  }

  /**
   * Lister les sessions actives d'un utilisateur
   * (pour affichage dans le profil)
   */
  static async getActiveSessions(userId: number): Promise<RefreshToken[]> {
    return this.query()
      .where('user_id', userId)
      .where('is_revoked', false)
      .whereNull('last_used_at')
      .where('expires_at', '>', DateTime.now().toSQL())
      .orderBy('created_at', 'desc')
  }

  /**
   * Trouver un token par son hash
   */
  static async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.query()
      .where('token_hash', tokenHash)
      .first()
  }

  /**
   * Trouver un token valide par son hash
   */
  static async findValidByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.query()
      .where('token_hash', tokenHash)
      .where('is_revoked', false)
      .whereNull('last_used_at')
      .where('expires_at', '>', DateTime.now().toSQL())
      .preload('user')
      .first()
  }

  /**
   * ========================================
   * SERIALISATION
   * ========================================
   */

  /**
   * Sérialisation pour l'API (liste des sessions)
   */
  serialize() {
    return {
      id: this.id,
      createdIp: this.createdIp,
      userAgent: this.userAgent,
      createdAt: this.createdAt?.toISO(),
      expiresAt: this.expiresAt?.toISO(),
      lastUsedAt: this.lastUsedAt?.toISO(),
      isActive: this.isValid,
    }
  }
}