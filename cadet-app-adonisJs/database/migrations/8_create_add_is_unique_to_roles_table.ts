import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'roles'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_unique').notNullable().defaultTo(false).comment('Ce rôle ne peut être attribué qu\'à un seul membre')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_unique')
    })
  }
}