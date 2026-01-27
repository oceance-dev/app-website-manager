import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'permissions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Identification
      table.string('name', 100).notNullable().unique() // slug: users.create, cadets.read
      table.string('display_name', 100).notNullable() // Nom affiché: Créer des utilisateurs
      table.string('description', 255).nullable()

      // Groupe pour organisation dans le front
      table.string('group', 50).notNullable() // users, cadets, documents, associations

      // Permission active
      table.boolean('is_active').notNullable().defaultTo(true)

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index
      table.index(['name'])
      table.index(['group'])
      table.index(['is_active'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}