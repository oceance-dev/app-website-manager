import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeSave, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { RolePermissions, UserRole, Permission } from '../../types/HelperPermAndRole.js'
import RefreshToken from './refresh_token.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Association from './association.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  /**
   * Lien avec l'association (null pour admin de l'association)
   */
  @column()
  declare associationId: number | null

  /**
   * Information de connexion
   */
  @column()
  declare email: string

  @column({ serializeAs: null})
  declare password: string

  /**
   * Informations personnelles
   */

  @column()
  declare lastname: string

  @column()
  declare firstname: string

  @column()
  declare city_code: string

  @column()
  declare phone: string

  @column()
  declare dateOfBirth: Date

  @column()
  declare sexe: 'Homme' | 'Femme'

  /**
   * Rôle et statut
   */
  @column()
  declare role: UserRole

  @column()
  declare isActive: boolean

  /**
   * Sécurité
   */
  @column.dateTime()
  declare lastLoginAt: DateTime | null

  @column()
  declare lastLoginIp: string | null

  @column()
  declare failedLoginAttempts: number

  @column.dateTime()
  declare lockedUntil: DateTime | null

  /**
   * Timestamps
   */
  
  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare emailVerifiedAt: DateTime | null

  @column.dateTime()
  declare passwordChangedAt: DateTime | null

  @column()
  declare mustChangePassword: boolean

  @column.dateTime()
  declare deletedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User, {
    expiresIn: '60 minutes',
    prefix: 'oat_',
    table: 'auth_access_tokens',
    type: 'auth_token',
  })

  /**
   * Relations
   */

  @belongsTo(() => Association)
  declare association: BelongsTo<typeof Association>

  @hasMany(() => RefreshToken)
  declare refreshTokens: HasMany<typeof RefreshToken>


  /**
   * Mise à jour de passwordChangedAt
   */
  @beforeSave()
  static async updatePasswordTimestamp(user: User) {
    if (user.$dirty.password) {
      user.passwordChangedAt = DateTime.now()
    }
  }


  /**
   * Computed de l'utilisateur
   */

  get fullName(): string {
    return `${this.firstname} ${this.lastname}`
  }

  // Vérifie si le compte est vérrouillé

  get isLocked(): boolean {
    if (!this.lockedUntil) return false
    return this.lockedUntil > DateTime.now()
  }

  // Récupère les permission de l'utilisateur basées sur son rôle 
  get permissions(): Permission[] {
    return RolePermissions[this.role] || []
  }

  /**
   * Méthodes de vérifications a une permission spécifique
   */

  // Vérifié si l'utilisateur a une permission spécifique

  hasPermission(permission: Permission): boolean {
    return this.permissions.includes(permission)
  }

  // Vérifie si l'utilisateur à toutes les permissions spécifiées
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(p)) 
  }

  // Vérifie si l'utilisateur a au moins une des permissions spécifiés
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(p))
  }

  // Vérifie si l'utilisateur a un des rôles spécifiés

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.role);
  }

  // Vérifie si l'utilisateur est super admin
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN || this.role === UserRole.SUPER_ADMIN
  }

  /**
   * Méthode de gestion du compte
   */

  // Enregistre une tentative de connexion échouée
  async recordFailedLogin(): Promise<void> {
    this.failedLoginAttempts += 1

    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = DateTime.now().plus({ minutes: 15})
    }

    await this.save()
  }

  // Réinitialise les tentatives de connexion après une connexion réussie
  async recordSuccessfulLogin(ip: string): Promise<void> {
    this.failedLoginAttempts = 0
    this.lockedUntil = null
    this.lastLoginAt = DateTime.now()
    this.lastLoginIp = ip
    await this.save()
  }

  /**
   * Sérialisation
   */
  //Sérialisation personnalisée pour l'api
  serialize() {
    return {
      id: this.id,
      associationId: this.associationId,
      email: this.email,
      firstName: this.firstname,
      lastName: this.lastname,
      dateOfBirth: this.dateOfBirth,
      phone: this.phone,
      city_code: this.city_code,
      sexe: this.sexe,
      role: this.role,
      permissions: this.permissions,
      isActive: this.isActive,
      emailVerifiedAt: this.emailVerifiedAt?.toISO(),
      lastLoginAt: this.lastLoginAt?.toISO(),
      createdAt: this.createdAt.toISO(),
      updatedAt: this.updatedAt?.toISO(),
    }
  }
}
