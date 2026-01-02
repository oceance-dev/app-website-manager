import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Permission from './permission.js'

export default class Role extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /**
   * - Super_admin
   * - Admin
   * - President
   * - Directeur de formation : directeur_formation
   * - Trésorier : tresorier
   * - Secrétaire : secretaire
   * - Formateur : formateur
   * - Cadet breveter : cadet_breveter
   * - Cadet : cadet
   * - Candidat : candidat
   */
  @column()
  declare name: string
  
  @column()
  declare displayName: string

  @column()
  declare description: string

  @column()
  declare level: Number

  @column()
  declare isSystem: boolean

  @column()
  declare isActive: boolean

  @column()
  declare isUnique: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Relations
   */
  @manyToMany(() => Permission, {
    pivotTable: 'role_permissions',
    pivotTimestamps: true,
  })
  declare permissions: ManyToMany<typeof Permission
  >

  @hasMany(() => User)
  declare users: HasMany<typeof User>

   /**
   * Méthodes utilitaires
   */

  // Vérifie si le rôle a une permission spécifique
  hasPermission(permissionName: string): boolean {
    return this.permissions.some((p) => p.name === permissionName)
  }

  // Vérifie si le rôle a toutes les permissions spécifiées
  hasAllPermissions(permissionNames: string[]): boolean {
    return permissionNames.every((name) => this.hasPermission(name))
  }

  // Vérifie si le rôle a au moins une des permissions spécifiées
  hasAnyPermission(permissionNames: string[]): boolean {
    return permissionNames.some((name) => this.hasPermission(name))
  }

  // Vérifie si ce rôle est supérieur ou égal à un autre
  isHigherOrEqualThan(otherRole: Role): boolean {
    return this.level >= otherRole.level
  }

  // Vérifie si ce rôle est strictement supérieur à un autre
  isHigherThan(otherRole: Role): boolean {
    return this.level > otherRole.level
  }

  /**
   * Scopes
   */
  static active() {
    return this.query().where('isActive', true)
  }

  static system() {
    return this.query().where('isSystem', true)
  }

  serialize() {
     return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      level: this.level,
      isSystem: this.isSystem,
      isActive: this.isActive,
      isUnique: this.isUnique,
      permissions: this.permissions?.map((p) => p.serialize()) || [],
      createdAt: this.createdAt?.toISO(),
      updatedAt: this.updatedAt?.toISO(),
    }
  }

  /**
   * Sérialisation simplifiée (sans permissions)
   */
  serializeBasic() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      level: this.level,
      isUnique: this.isUnique
    }
  }
}