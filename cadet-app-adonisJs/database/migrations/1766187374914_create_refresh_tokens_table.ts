import { BaseSchema } from '@adonisjs/lucid/schema'
import { DateTime } from 'luxon'

export default class extends BaseSchema {
  protected tableName = 'refresh_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('token_hash', 64).notNullable()
      table.string('family', 32).notNullable()
      table.string('created_ip', 45).notNullable()
      table.string('user_agent', 500).nullable()

      table.timestamp('expires_at').notNullable()
      table.timestamp('last_used_at').nullable()
      table.boolean('is_revoked').notNullable().defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.dateTime('updated_at').notNullable()

      // Index
      table.index(['user_id'])
      table.index(['token_hash'])
      table.index(['family'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}