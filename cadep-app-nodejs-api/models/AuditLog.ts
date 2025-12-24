 import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';

  export interface AuditLog {
      id: number;
      user_id: number | null;
      action: string;
      entity_type: string | null;
      entity_id: number | null;
      details: object | null;
      ip_address: string | null;
      user_agent: string | null;
      created_at: Date;
  }

  export const AuditLogModel = {

      async findById(id: number): Promise<AuditLog | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM audit_logs WHERE id = ?',
              [id]
          );
          return (rows[0] as AuditLog) || null;
      },

      async findAll(limit: number = 100): Promise<AuditLog[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?',
              [limit]
          );
          return rows as AuditLog[];
      },

      async findByUserId(userId: number, limit: number = 50): Promise<AuditLog[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
              [userId, limit]
          );
          return rows as AuditLog[];
      },

      async findByAction(action: string, limit: number = 100): Promise<AuditLog[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ?',
              [action, limit]
          );
          return rows as AuditLog[];
      },

      async findByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
              [entityType, entityId]
          );
          return rows as AuditLog[];
      },

      async createLog(log: Partial<AuditLog>): Promise<number> {
          const detailsJson = log.details ? JSON.stringify(log.details) : null;

          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
              VALUES (?,?,?,?,?,?,?)`,
              [
                  log.user_id,
                  log.action,
                  log.entity_type,
                  log.entity_id,
                  detailsJson,
                  log.ip_address,
                  log.user_agent
              ]
          );

          return result.insertId;
      },

      async deleteOldLogs(daysToKeep: number = 90): Promise<void> {
          await pool.execute(
              'DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
              [daysToKeep]
          );
      }
  };
