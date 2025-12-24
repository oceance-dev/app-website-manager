import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';

  export interface FolderPermission {
      id: number;
      folder_id: number;
      user_id: number;
      role: 'viewer' | 'editor' | 'admin';
      created_at: Date;
  }

  export const FolderPermissionModel = {

      async findById(id: number): Promise<FolderPermission | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM folder_permissions WHERE id = ?',
              [id]
          );
          return (rows[0] as FolderPermission) || null;
      },

      async findByFolderId(folderId: number): Promise<FolderPermission[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM folder_permissions WHERE folder_id = ?',
              [folderId]
          );
          return rows as FolderPermission[];
      },

      async findByUserId(userId: number): Promise<FolderPermission[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM folder_permissions WHERE user_id = ?',
              [userId]
          );
          return rows as FolderPermission[];
      },

      async findByFolderAndUser(folderId: number, userId: number): Promise<FolderPermission | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM folder_permissions WHERE folder_id = ? AND user_id = ?',
              [folderId, userId]
          );
          return (rows[0] as FolderPermission) || null;
      },

      async createPermission(permission: Partial<FolderPermission>): Promise<number> {
          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO folder_permissions (folder_id, user_id, role)
              VALUES (?,?,?)`,
              [permission.folder_id, permission.user_id, permission.role]
          );

          return result.insertId;
      },

      async updatePermission(id: number, role: string): Promise<void> {
          await pool.execute(
              'UPDATE folder_permissions SET role = ? WHERE id = ?',
              [role, id]
          );
      },

      async deletePermission(id: number): Promise<void> {
          await pool.execute(
              'DELETE FROM folder_permissions WHERE id = ?',
              [id]
          );
      },

      async deleteByFolderAndUser(folderId: number, userId: number): Promise<void> {
          await pool.execute(
              'DELETE FROM folder_permissions WHERE folder_id = ? AND user_id = ?',
              [folderId, userId]
          );
      }
  };
