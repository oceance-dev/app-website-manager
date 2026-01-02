import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, beforeSave, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import RefreshToken from './refresh_token.js'
import Association from './association.js'
import Role from './role.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  /**
   * Lien avec l'association (null pour super_admin CADEP)
   */
  @column()
  declare associationId: number | null

  /**
   * Lien avec le rôle
   */
  @column()
  declare roleId: number

  /**
   * Information de connexion
   */
  @column()
  declare email: string

  @column({ serializeAs: null })
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

  @column.dateTime()
  declare dateOfBirth: DateTime

  @column()
  declare sexe: 'Homme' | 'Femme'

  /**
   * Statut
   */
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

  @belongsTo(() => Role)
  declare role: BelongsTo<typeof Role>

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
   * Computed
   */
  get fullName(): string {
    return `${this.firstname} ${this.lastname}`
  }

  get isLocked(): boolean {
    if (!this.lockedUntil) return false
    return this.lockedUntil > DateTime.now()
  }

  /**
   * Méthodes de vérification des permissions
   * IMPORTANT: Le rôle doit être preload avec ses permissions avant d'utiliser ces méthodes
   * await user.load('role', (query) => query.preload('permissions'))
   */

  // Récupère les noms des permissions depuis le rôle
  get permissions(): string[] {
    if (!this.role || !this.role.permissions) return []
    return this.role.permissions.map((p) => p.name)
  }

  // Vérifie si l'utilisateur a une permission spécifique
  hasPermission(permissionName: string): boolean {
    // Super admin a toutes les permissions
    if (this.isSuperAdmin) return true
    return this.permissions.includes(permissionName)
  }

  // Vérifie si l'utilisateur a toutes les permissions spécifiées
  hasAllPermissions(permissionNames: string[]): boolean {
    if (this.isSuperAdmin) return true
    return permissionNames.every((p) => this.permissions.includes(p))
  }

  // Vérifie si l'utilisateur a au moins une des permissions spécifiées
  hasAnyPermission(permissionNames: string[]): boolean {
    if (this.isSuperAdmin) return true
    return permissionNames.some((p) => this.permissions.includes(p))
  }

  // Vérifie si l'utilisateur a un rôle spécifique (par nom)
  hasRole(roleName: string): boolean {
    return this.role?.name === roleName
  }

  // Vérifie si l'utilisateur a un des rôles spécifiés
  hasAnyRole(roleNames: string[]): boolean {
    if (!this.role) return false
    return roleNames.includes(this.role.name)
  }

  // Vérifie si l'utilisateur est super admin
  get isSuperAdmin(): boolean {
    return this.role?.name === 'super_admin'
  }

  // Vérifie si l'utilisateur est admin (admin ou super_admin)
  get isAdmin(): boolean {
    return this.role?.name === 'admin' || this.role?.name === 'super_admin'
  }

  // Vérifie si l'utilisateur fait partie du bureau (président, trésorier, secrétaire)
  get isBureau(): boolean {
    const bureauRoles = ['president', 'tresorier', 'secretaire', 'admin', 'super_admin']
    return this.role ? bureauRoles.includes(this.role.name) : false
  }

  // Vérifie si l'utilisateur est un encadrant (staff, formateur, directeur formation)
  get isEncadrant(): boolean {
    const encadrantRoles = ['staff', 'formateur', 'directeur_formation', 'president', 'admin', 'super_admin']
    return this.role ? encadrantRoles.includes(this.role.name) : false
  }

  // Retourne le niveau du rôle
  get roleLevel(): Number {
    return this.role?.level ?? 0
  }

  // Vérifie si ce user a un rôle supérieur ou égal à un autre user
  isHigherOrEqualThan(otherUser: User): boolean {
    return this.roleLevel >= otherUser.roleLevel
  }

  // Vérifie si ce user a un rôle strictement supérieur à un autre
  isHigherThan(otherUser: User): boolean {
    return this.roleLevel > otherUser.roleLevel
  }

  // Vérifie si ce user peut gérer un autre user (niveau strictement supérieur)
  canManage(otherUser: User): boolean {
    // Super admin peut gérer tout le monde
    if (this.isSuperAdmin) return true
    // On ne peut pas se gérer soi-même pour certaines actions
    if (this.id === otherUser.id) return false
    // On peut gérer seulement les utilisateurs de niveau inférieur
    return this.isHigherThan(otherUser)
  }

  /**
   * Méthode de gestion du compte
   */
  async recordFailedLogin(): Promise<void> {
    this.failedLoginAttempts += 1

    if (this.failedLoginAttempts >= 5) {
      this.lockedUntil = DateTime.now().plus({ minutes: 15 })
    }

    await this.save()
  }

  async recordSuccessfulLogin(ip: string): Promise<void> {
    this.failedLoginAttempts = 0
    this.lockedUntil = null
    this.lastLoginAt = DateTime.now()
    this.lastLoginIp = ip
    await this.save()
  }

  /**
   * Charger le rôle avec les permissions
   */
  async loadRoleWithPermissions(): Promise<void> {
   const user = await User.query()
      .where('id', this.id)
      .preload('role', (query) => {
        query.preload('permissions')
      })
      .firstOrFail()
    
    this.role = user.role
  }

  /**
   * Sérialisation pour l'API
   */
  serialize() {
    return {
      id: this.id,
      associationId: this.associationId,
      email: this.email,
      firstName: this.firstname,
      lastName: this.lastname,
      fullName: this.fullName,
      dateOfBirth: this.dateOfBirth?.toISO(),
      phone: this.phone,
      city_code: this.city_code,
      sexe: this.sexe,
      role: this.role?.serializeBasic() ?? null,
      permissions: this.permissions,
      isActive: this.isActive,
      isSuperAdmin: this.isSuperAdmin,
      isAdmin: this.isAdmin,
      emailVerifiedAt: this.emailVerifiedAt?.toISO(),
      lastLoginAt: this.lastLoginAt?.toISO(),
      createdAt: this.createdAt?.toISO(),
      updatedAt: this.updatedAt?.toISO(),
    }
  }
}