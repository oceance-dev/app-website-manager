import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'association_document_requirements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Clé primaire
      table.increments('id').primary()

      // Lien avec l'association
      table
        .integer('association_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('associations')
        .onDelete('CASCADE')

      // Lien avec le type de document
      table
        .integer('document_type_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('document_types')
        .onDelete('CASCADE')

      // Configuration pour cette association
      table.boolean('is_enabled').notNullable().defaultTo(true) // Activé pour cette asso
      table.boolean('is_required').notNullable().defaultTo(false) // Obligatoire pour cette asso

      // Pour qui ce document est requis (override du document_type)
      table
        .enum('required_for', [
          'all', // Tous les membres
          'cadets', // Cadets uniquement
          'candidates', // Candidats uniquement
          'staff', // Staff uniquement
          'minors', // Mineurs uniquement
        ])
        .nullable()

      // Étape du processus où le document est requis
      table
        .enum('required_at', [
          'registration', // À l'inscription
          'approval', // Avant approbation
          'anytime', // N'importe quand
        ])
        .notNullable()
        .defaultTo('registration')

      // Instructions personnalisées
      table.text('custom_instructions').nullable()
      table.string('custom_name', 255).nullable() // Nom personnalisé pour cette asso

      // Ordre d'affichage
      table.integer('sort_order').unsigned().notNullable().defaultTo(0)

      // Délai de validité personnalisé (override du document_type)
      table.integer('custom_validity_days').unsigned().nullable()

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index et contraintes
      table.unique(['association_id', 'document_type_id'], 'assoc_doc_req_unique')
      table.index(['association_id'])
      table.index(['document_type_id'])
      table.index(['is_enabled'])
      table.index(['is_required'])
      table.index(['required_for'])
      table.index(['required_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}