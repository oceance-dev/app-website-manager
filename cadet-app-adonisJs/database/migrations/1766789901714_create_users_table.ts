import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      // Clé primaire
      table.increments('id').primary()

      // Lien avec l'association (null pour super_admin CADEP)
      table
        .integer('association_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('associations')
        .onDelete('CASCADE')

      // Lien avec le rôle
      table
        .integer('role_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('roles')
        .onDelete('RESTRICT')

      // Informations de connexion
      table.string('email', 255).notNullable().unique()
      table.string('password', 255).notNullable()

      // Informations personnelles
      table.string('lastname', 100).notNullable()
      table.string('firstname', 100).notNullable()
      table.string('city_code', 10).notNullable()
      table.string('phone', 20).notNullable()
      table.timestamp('date_of_birth').notNullable()
      table.enum('sexe', ['Homme', 'Femme']).notNullable()

      // Statut
      table.boolean('is_active').notNullable().defaultTo(false)

      // Sécurité
      table.timestamp('last_login_at').nullable()
      table.string('last_login_ip', 45).nullable()
      table.integer('failed_login_attempts').notNullable().defaultTo(0)
      table.timestamp('locked_until').nullable()

      // Timestamps
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Vérification et mot de passe
      table.timestamp('email_verified_at').nullable()
      table.timestamp('password_changed_at').nullable()
      table.boolean('must_change_password').notNullable().defaultTo(false)

      // Soft delete
      table.timestamp('deleted_at').nullable()

      // Index
      table.index(['association_id'])
      table.index(['role_id'])
      table.index(['email'])
      table.index(['is_active'])
      table.index(['deleted_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}