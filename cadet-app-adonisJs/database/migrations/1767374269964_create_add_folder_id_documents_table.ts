import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    // Vérifier si la colonne existe déjà
    const hasColumn = await this.db.rawQuery(
      `SELECT COUNT(*) as count FROM information_schema.columns 
       WHERE table_schema = DATABASE() 
       AND table_name = '${this.tableName}' 
       AND column_name = 'folder_id'`
    )

    if (hasColumn[0][0].count === 0) {
      this.schema.alterTable(this.tableName, (table) => {
        table
          .integer('folder_id')
          .unsigned()
          .nullable()
          .references('id')
          .inTable('folders')
          .onDelete('SET NULL')
          .after('candidat_id')

        table.index(['folder_id'])
      })
    }
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['folder_id'])
      table.dropColumn('folder_id')
    })
  }
}