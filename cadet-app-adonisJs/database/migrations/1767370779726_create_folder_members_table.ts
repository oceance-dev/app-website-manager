import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'folder_members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Clé primaire
      table.increments('id').primary()

      // Lien avec le dossier
      table
        .integer('folder_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('folders')
        .onDelete('CASCADE')

      // Lien avec l'utilisateur
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Permissions spécifiques pour ce membre
      table.boolean('can_view').notNullable().defaultTo(true)
      table.boolean('can_upload').notNullable().defaultTo(false)
      table.boolean('can_download').notNullable().defaultTo(true)
      table.boolean('can_delete').notNullable().defaultTo(false)
      table.boolean('can_manage').notNullable().defaultTo(false) // Peut gérer les membres

      // Ajouté par
      table
        .integer('added_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index
      table.unique(['folder_id', 'user_id'])
      table.index(['folder_id'])
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}