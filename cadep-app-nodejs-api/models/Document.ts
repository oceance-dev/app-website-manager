import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';

  export type DocumentType = 'PDF' | 'DOCX' | 'XLSX' | 'PPTX' | 'OTHER';

  export interface Document {
      id: number;
      name: string;
      folder_id: number;
      file_path: string;
      file_size: number | null;
      file_size_display: string | null;
      mime_type: string | null;
      document_type: DocumentType;
      uploaded_by: number;
      uploaded_at: Date;
      updated_at: Date;
  }

  export const DocumentModel = {

      async findById(id: number): Promise<Document | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM documents WHERE id = ?',
              [id]
          );
          return (rows[0] as Document) || null;
      },

      async findAll(): Promise<Document[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM documents ORDER BY uploaded_at DESC'
          );
          return rows as Document[];
      },

      async findByFolderId(folderId: number): Promise<Document[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM documents WHERE folder_id = ? ORDER BY uploaded_at DESC',
              [folderId]
          );
          return rows as Document[];
      },

      async findByUploadedBy(userId: number): Promise<Document[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM documents WHERE uploaded_by = ? ORDER BY uploaded_at DESC',
              [userId]
          );
          return rows as Document[];
      },

      async createDocument(document: Partial<Document>): Promise<number> {
          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO documents (name, folder_id, file_path, file_size, file_size_display, mime_type, document_type, uploaded_by)
              VALUES (?,?,?,?,?,?,?,?)`,
              [
                  document.name,
                  document.folder_id,
                  document.file_path,
                  document.file_size,
                  document.file_size_display,
                  document.mime_type,
                  document.document_type,
                  document.uploaded_by
              ]
          );

          return result.insertId;
      },

      async updateDocument(id: number, name: string): Promise<void> {
          await pool.execute(
              'UPDATE documents SET name = ? WHERE id = ?',
              [name, id]
          );
      },

      async deleteDocument(id: number): Promise<void> {
          await pool.execute(
              'DELETE FROM documents WHERE id = ?',
              [id]
          );
      },

      async countByFolderId(folderId: number): Promise<number> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT COUNT(*) as count FROM documents WHERE folder_id = ?',
              [folderId]
          );
          return rows[0].count;
      },

      async searchByName(searchTerm: string): Promise<Document[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM documents WHERE name LIKE ? ORDER BY uploaded_at DESC',
              [`%${searchTerm}%`]
          );
          return rows as Document[];
      }
  };
