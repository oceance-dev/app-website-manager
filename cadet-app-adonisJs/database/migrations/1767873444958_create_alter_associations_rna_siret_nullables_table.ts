import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'associations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('rna', 10).nullable().alter()
      table.string('siret', 14).nullable().alter()
      table.string('address', 255).nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('rna', 10).notNullable().alter()
      table.string('siret', 14).notNullable().alter()
      table.string('address', 255).notNullable().alter()
    })
  }
}