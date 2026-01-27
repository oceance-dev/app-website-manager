import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    // Mapper pour détecter le MIME type correct basé sur l'extension
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
    }

    // Mettre à jour les MIME types pour chaque extension
    for (const [extension, mimeType] of Object.entries(mimeTypes)) {
      await this.defer(async (db) => {
        await db
          .from(this.tableName)
          .where('extension', extension)
          .update({ mime_type: mimeType })
      })
    }
  }

  async down() {
    // Pas de rollback pour ce fix
  }
}