import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';

  export type CandidatDocumentType =
      'id_card' |
      'photo' |
      'medical_certificate' |
      'parental_authorization' |
      'inscription_form' |
      'engagement_form' |
      'health_form';

  export interface CandidatDocument {
      id: number;
      candidat_id: number;
      document_type: CandidatDocumentType;
      document_name: string;
      file_path: string;
      file_size: number | null;
      mime_type: string | null;
      category: 'required' | 'form';
      uploaded_at: Date;
  }

  export const CandidatDocumentModel = {

      async findById(id: number): Promise<CandidatDocument | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM candidat_documents WHERE id = ?',
              [id]
          );
          return (rows[0] as CandidatDocument) || null;
      },

      async findByCandidatId(candidatId: number): Promise<CandidatDocument[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM candidat_documents WHERE candidat_id = ? ORDER BY uploaded_at DESC',
              [candidatId]
          );
          return rows as CandidatDocument[];
      },

      async findByType(candidatId: number, documentType: string): Promise<CandidatDocument | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM candidat_documents WHERE candidat_id = ? AND document_type = ?',
              [candidatId, documentType]
          );
          return (rows[0] as CandidatDocument) || null;
      },

      async createDocument(document: Partial<CandidatDocument>): Promise<number> {
          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO candidat_documents (candidat_id, document_type, document_name, file_path, file_size, mime_type, category)
              VALUES (?,?,?,?,?,?,?)`,
              [
                  document.candidat_id,
                  document.document_type,
                  document.document_name,
                  document.file_path,
                  document.file_size,
                  document.mime_type,
                  document.category
              ]
          );

          return result.insertId;
      },

      async updateDocument(candidatId: number, documentType: string, filePath: string, fileName: string, fileSize: number, mimeType: string): Promise<void> {
          await pool.execute(
              `UPDATE candidat_documents 
              SET file_path = ?, document_name = ?, file_size = ?, mime_type = ?, uploaded_at = NOW()
              WHERE candidat_id = ? AND document_type = ?`,
              [filePath, fileName, fileSize, mimeType, candidatId, documentType]
          );
      },

      async deleteDocument(id: number): Promise<void> {
          await pool.execute(
              'DELETE FROM candidat_documents WHERE id = ?',
              [id]
          );
      },

      async countByCandidatId(candidatId: number): Promise<number> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT COUNT(*) as count FROM candidat_documents WHERE candidat_id = ?',
              [candidatId]
          );
          return rows[0].count;
      }
  };
