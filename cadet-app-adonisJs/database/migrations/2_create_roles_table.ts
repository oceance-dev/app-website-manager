import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Identification
      table.string('name', 50).notNullable().unique() // slug: admin, supervisor, etc.
      table.string('display_name', 100).notNullable() // Nom affiché: Administrateur
      table.string('description', 255).nullable()

      // Hiérarchie (plus le niveau est haut, plus le rôle est important)
      table.integer('level').notNullable().defaultTo(0)

      // Rôle système (ne peut pas être supprimé)
      table.boolean('is_system').notNullable().defaultTo(false)

      // Rôle actif
      table.boolean('is_active').notNullable().defaultTo(true)

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index
      table.index(['name'])
      table.index(['level'])
      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}