import { DateTime } from 'luxon'
import { BaseModel, column, manyToMany } from '@adonisjs/lucid/orm'
import type { ManyToMany } from '@adonisjs/lucid/types/relations'
import Role from './role.js'

export default class Permission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /**
   * Identification
   */
  @column()
  declare name: string // Ex: users.create, cadets.read

  @column()
  declare displayName: string // Ex: Créer des utilisateurs

  @column()
  declare description: string | null

  /**
   * Groupe pour organisation dans le front
   */
  @column()
  declare group: string // Ex: users, cadets, documents

  /**
   * Permission active
   */
  @column()
  declare isActive: boolean

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
  @manyToMany(() => Role, {
    pivotTable: 'role_permissions',
    pivotTimestamps: true,
  })
  declare roles: ManyToMany<typeof Role>

  /**
   * Scopes
   */
  static active() {
    return this.query().where('isActive', true)
  }

  static byGroup(group: string) {
    return this.query().where('group', group)
  }

  /**
   * Sérialisation pour l'API
   */
  serialize() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      group: this.group,
      isActive: this.isActive,
    }
  }
}