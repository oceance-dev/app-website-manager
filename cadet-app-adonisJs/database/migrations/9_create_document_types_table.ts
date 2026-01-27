import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_types'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Clé primaire
      table.increments('id').primary()

      // Lien optionnel avec l'association (null = type global CADEP)
      table
        .integer('association_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('associations')
        .onDelete('CASCADE')

      // Informations du type
      table.string('name', 100).notNullable() // Nom du type
      table.string('slug', 100).notNullable() // Identifiant unique
      table.text('description').nullable() // Description
      
      // Catégorie associée
      table
        .enum('category', [
          'identity',
          'medical',
          'parental_authorization',
          'insurance',
          'registration',
          'certificate',
          'report',
          'administrative',
          'training',
          'photo',
          'other',
        ])
        .notNullable()

      // Contraintes
      table.boolean('is_required').notNullable().defaultTo(false) // Obligatoire
      table.boolean('is_active').notNullable().defaultTo(true) // Actif
      table.boolean('requires_validation').notNullable().defaultTo(true) // Nécessite validation
      table.boolean('has_expiration').notNullable().defaultTo(false) // Peut expirer
      table.integer('validity_days').unsigned().nullable() // Durée de validité en jours

      // Extensions acceptées (JSON array)
      table.json('allowed_extensions').nullable() // ['pdf', 'jpg', 'png']
      table.bigInteger('max_file_size').unsigned().nullable() // Taille max en bytes

      // Pour qui ce type est requis
      table
        .enum('required_for', [
          'all', // Tous les membres
          'cadets', // Cadets uniquement
          'candidates', // Candidats uniquement
          'staff', // Staff uniquement
          'minors', // Mineurs uniquement
        ])
        .nullable()

      // Ordre d'affichage
      table.integer('sort_order').unsigned().notNullable().defaultTo(0)

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index
      table.index(['association_id'])
      table.index(['category'])
      table.index(['is_required'])
      table.index(['is_active'])
      table.unique(['association_id', 'slug'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}