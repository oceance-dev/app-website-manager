import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

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

      // Lien avec l'utilisateur propriétaire
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      // Lien optionnel avec un cadet (pour documents spécifiques à un cadet)
      table
        .integer('candidat_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // Informations du document
      table.string('name', 255).notNullable() // Nom affiché
      table.string('original_name', 255).notNullable() // Nom original du fichier
      table.string('file_path', 500).notNullable() // Chemin de stockage
      table.string('file_url', 500).nullable() // URL publique (si applicable)
      table.string('mime_type', 100).notNullable() // Type MIME
      table.bigInteger('file_size').unsigned().notNullable() // Taille en bytes
      table.string('extension', 20).notNullable() // Extension du fichier

      // Catégorisation
      table
        .enum('category', [
          'identity', // Pièce d'identité
          'medical', // Certificat médical
          'parental_authorization', // Autorisation parentale
          'insurance', // Attestation d'assurance
          'registration', // Dossier d'inscription
          'certificate', // Certificats/Diplômes
          'report', // Rapports
          'administrative', // Documents administratifs
          'training', // Supports de formation
          'photo', // Photos
          'other', // Autres
        ])
        .notNullable()
        .defaultTo('other')

      // Visibilité
      table
        .enum('visibility', [
          'private', // Visible uniquement par le propriétaire et admins
          'staff', // Visible par le staff
          'members', // Visible par tous les membres
          'cadet_breveter',
          'cadet',
          'candidat',
          'public', // Visible publiquement
        ])
        .notNullable()
        .defaultTo('private')

      // Statut
      table
        .enum('status', [
          'pending', // En attente de validation
          'approved', // Validé
          'rejected', // Rejeté
          'expired', // Expiré
          'archived', // Archivé
        ])
        .notNullable()
        .defaultTo('pending')

      // Métadonnées
      table.text('description').nullable() // Description du document
      table.json('metadata').nullable() // Métadonnées additionnelles (JSON)
      table.date('expiration_date').nullable() // Date d'expiration
      table.date('document_date').nullable() // Date du document

      // Validation
      table
        .integer('validated_by')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.timestamp('validated_at').nullable()
      table.text('rejection_reason').nullable()

      // Versioning
      table.integer('version').unsigned().notNullable().defaultTo(1)
      table
        .integer('parent_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('documents')
        .onDelete('SET NULL')

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable() // Soft delete

      // Index
      table.index(['association_id'])
      table.index(['user_id'])
      table.index(['candidat_id'])
      table.index(['category'])
      table.index(['status'])
      table.index(['visibility'])
      table.index(['expiration_date'])
      table.index(['deleted_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}