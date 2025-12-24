import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';

  export interface DocumentPermission {
      id: number;
      document_id: number;
      user_id: number;
      can_access: boolean;
      granted_by: number | null;
      granted_at: Date;
  }

  export const DocumentPermissionModel = {

      async findById(id: number): Promise<DocumentPermission | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM document_permissions WHERE id = ?',
              [id]
          );
          return (rows[0] as DocumentPermission) || null;
      },

      async findByDocumentId(documentId: number): Promise<DocumentPermission[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM document_permissions WHERE document_id = ?',
              [documentId]
          );
          return rows as DocumentPermission[];
      },

      async findByUserId(userId: number): Promise<DocumentPermission[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM document_permissions WHERE user_id = ? AND can_access = true',
              [userId]
          );
          return rows as DocumentPermission[];
      },

      async findByDocumentAndUser(documentId: number, userId: number): Promise<DocumentPermission | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM document_permissions WHERE document_id = ? AND user_id = ?',
              [documentId, userId]
          );
          return (rows[0] as DocumentPermission) || null;
      },

      async createPermission(permission: Partial<DocumentPermission>): Promise<number> {
          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO document_permissions (document_id, user_id, can_access, granted_by)
              VALUES (?,?,?,?)`,
              [permission.document_id, permission.user_id, permission.can_access, permission.granted_by]
          );

          return result.insertId;
      },

      async updatePermission(id: number, canAccess: boolean): Promise<void> {
          await pool.execute(
              'UPDATE document_permissions SET can_access = ? WHERE id = ?',
              [canAccess, id]
          );
      },

      async deletePermission(id: number): Promise<void> {
          await pool.execute(
              'DELETE FROM document_permissions WHERE id = ?',
              [id]
          );
      },

      async deleteByDocumentAndUser(documentId: number, userId: number): Promise<void> {
          await pool.execute(
              'DELETE FROM document_permissions WHERE document_id = ? AND user_id = ?',
              [documentId, userId]
          );
      },

      async hasAccess(documentId: number, userId: number): Promise<boolean> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT can_access FROM document_permissions WHERE document_id = ? AND user_id = ?',
              [documentId, userId]
          );
          return rows.length > 0 && rows[0].can_access === 1;
      }
  };
