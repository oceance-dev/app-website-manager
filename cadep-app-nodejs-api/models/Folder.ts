import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';

  export interface Folder {
      id: number;
      name: string;
      parent_id: number | null;
      created_by: number;
      created_at: Date;
      updated_at: Date;
  }

  export const FolderModel = {

      async findById(id: number): Promise<Folder | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM folders WHERE id = ?',
              [id]
          );
          return (rows[0] as Folder) || null;
      },

      async findAll(): Promise<Folder[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM folders ORDER BY name ASC'
          );
          return rows as Folder[];
      },

      async findByParentId(parentId: number | null): Promise<Folder[]> {
          if (parentId === null) {
              const [rows] = await pool.execute<RowDataPacket[]>(
                  'SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name ASC'
              );
              return rows as Folder[];
          } else {
              const [rows] = await pool.execute<RowDataPacket[]>(
                  'SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC',
                  [parentId]
              );
              return rows as Folder[];
          }
      },

      async createFolder(folder: Partial<Folder>): Promise<number> {
          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO folders (name, parent_id, created_by)
              VALUES (?,?,?)`,
              [folder.name, folder.parent_id, folder.created_by]
          );

          return result.insertId;
      },

      async updateFolder(id: number, name: string): Promise<void> {
          await pool.execute(
              'UPDATE folders SET name = ? WHERE id = ?',
              [name, id]
          );
      },

      async deleteFolder(id: number): Promise<void> {
          await pool.execute(
              'DELETE FROM folders WHERE id = ?',
              [id]
          );
      },

      async countByParentId(parentId: number | null): Promise<number> {
          if (parentId === null) {
              const [rows] = await pool.execute<RowDataPacket[]>(
                  'SELECT COUNT(*) as count FROM folders WHERE parent_id IS NULL'
              );
              return rows[0].count;
          } else {
              const [rows] = await pool.execute<RowDataPacket[]>(
                  'SELECT COUNT(*) as count FROM folders WHERE parent_id = ?',
                  [parentId]
              );
              return rows[0].count;
          }
      }
  };
