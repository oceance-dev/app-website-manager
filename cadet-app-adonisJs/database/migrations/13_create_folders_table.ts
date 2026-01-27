import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'folders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Clé primaire
      table.increments('id').primary()

      // Lien avec l'association (isolation multi-tenant)
      table
        .integer('association_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('associations')
        .onDelete('CASCADE')

      // Dossier parent (pour l'arborescence)
      table
        .integer('parent_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('folders')
        .onDelete('CASCADE')

      // Propriétaire du dossier (null = dossier système)
      table
        .integer('owner_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // Informations du dossier
      table.string('name', 255).notNullable()
      table.string('slug', 255).notNullable()
      table.text('description').nullable()
      table.string('color', 7).nullable() // Couleur hex (#FF5733)
      table.string('icon', 50).nullable() // Nom de l'icône

      // Type de dossier
      table
        .enum('type', [
          'system', // Dossier système (créé automatiquement)
          'shared', // Dossier partagé (créé par admin)
          'private', // Dossier privé (personnel)
        ])
        .notNullable()
        .defaultTo('shared')

      // Visibilité / Accès
      table
        .enum('visibility', [
          'private', // Uniquement le propriétaire
          'restricted', // Membres spécifiques (via folder_members)
          'staff', // Tout le staff
          'members', // Tous les membres de l'association
          'public', // Public (accessible sans connexion)
        ])
        .notNullable()
        .defaultTo('private')

      // Permissions par défaut pour les documents dans ce dossier
      table.boolean('allow_upload').notNullable().defaultTo(false) // Autoriser l'upload par les membres
      table.boolean('allow_download').notNullable().defaultTo(true) // Autoriser le téléchargement
      table.boolean('allow_delete').notNullable().defaultTo(false) // Autoriser la suppression par les membres

      // Métadonnées
      table.integer('sort_order').unsigned().notNullable().defaultTo(0)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_pinned').notNullable().defaultTo(false) // Épinglé en haut

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable() // Soft delete

      // Index
      table.index(['association_id'])
      table.index(['parent_id'])
      table.index(['owner_id'])
      table.index(['type'])
      table.index(['visibility'])
      table.index(['deleted_at'])
      table.unique(['association_id', 'parent_id', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}