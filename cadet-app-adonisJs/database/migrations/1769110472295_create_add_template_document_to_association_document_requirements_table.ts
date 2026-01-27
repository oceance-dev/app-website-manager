import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'association_document_requirements'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Document modèle (formulaire vierge) téléchargeable par les candidats
      table
        .integer('template_document_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('documents')
        .onDelete('SET NULL')
        .comment('Document modèle téléchargeable par les candidats')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('template_document_id')
    })
  }
}