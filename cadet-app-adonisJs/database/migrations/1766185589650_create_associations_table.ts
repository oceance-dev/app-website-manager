import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'associations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Informations générales
      table.string('name', 255).notNullable()
      table.string('rna', 10).notNullable().unique()        // W + 9 chiffres
      table.string('siret', 14).notNullable().unique()      // 14 chiffres

      // Contact
      table.string('email', 255).nullable().unique()
      table.string('phone', 20).nullable()

      // Adresse
      table.string('address', 255).notNullable()
      table.string('city', 100).notNullable()
      table.string('postal_code', 10).notNullable()         // snake_case pour la DB
      table.string('country', 100).notNullable().defaultTo('France')

      // Statut et abonnement
      table
        .enum('status', ['pending', 'active', 'suspended', 'cancelled'])
        .notNullable()
        .defaultTo('pending')
      table.timestamp('approved_at').nullable()             // snake_case
      table.timestamp('subscribed_at').nullable()           // snake_case
      table.timestamp('subscription_ends_at').nullable()    // snake_case

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Index pour les recherches fréquentes
      table.index(['status'])
      table.index(['rna'])
      table.index(['siret'])
      table.index(['email'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}