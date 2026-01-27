import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'role_permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('roles')
        .onDelete('CASCADE')

      table
        .integer('permission_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('permissions')
        .onDelete('CASCADE')

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Contrainte unique pour éviter les doublons
      table.unique(['role_id', 'permission_id'])

      // Index
      table.index(['role_id'])
      table.index(['permission_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}