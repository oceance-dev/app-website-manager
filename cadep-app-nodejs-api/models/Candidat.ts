import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';
  import { Password } from '../utils/password';

  export interface Candidat {
      id: number;
      user_id: number | null;
      //firstname: string;
      //lastname: string;
      //email: string;
      email_parent: string | null;
      //password_hash: string;
      //phone: string | null;
      //city_code: string | null;
      //date_of_birth: Date | null;
      //sexe: number | null;
      //address: string | null;
      //city: string | null;
      status: 'pending' | 'appointment_scheduled' | 'validated' | 'rejected';
      rejection_reason: string | null;
      request_date: Date;
      validated_at: Date | null;
      validated_by: number | null;
      created_at: Date;
      updated_at: Date;
  }

  export const CandidatModel = {

      async findById(id: number): Promise<Candidat | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM candidats WHERE id = ?',
              [id]
          );
          return (rows[0] as Candidat) || null;
      },

      async findByEmail(email: string): Promise<Candidat | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM candidats WHERE email = ?',
              [email]
          );
          return (rows[0] as Candidat) || null;
      },

      async findAll(): Promise<Candidat[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM candidats ORDER BY request_date DESC'
          );
          return rows as Candidat[];
      },

      async findByStatus(status: string): Promise<Candidat[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM candidats WHERE status = ? ORDER BY request_date DESC',
              [status]
          );
          return rows as Candidat[];
      },

      async createCandidat(candidat: Candidat): Promise<number> {
          

          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO candidats (user_id, email_parent, status, request_date)
              VALUES (?,?, 'pending', ?)`,
              [
                  candidat.user_id,
                  candidat.email_parent,
                  candidat.request_date,
              ]
          );

          return result.insertId;
      },

      async updateStatus(id: number, status: string): Promise<void> {
          await pool.execute(
              'UPDATE candidats SET status = ? WHERE id = ?',
              [status, id]
          );
      },

      async validateCandidat(id: number, validatedBy: number, userId: number): Promise<void> {
          await pool.execute(
              `UPDATE candidats 
              SET status = 'validated', validated_at = NOW(), validated_by = ?, user_id = ?
              WHERE id = ?`,
              [validatedBy, userId, id]
          );
      },

      async rejectCandidat(id: number, reason: string | null): Promise<void> {
          await pool.execute(
              `UPDATE candidats 
              SET status = 'rejected', rejection_reason = ?
              WHERE id = ?`,
              [reason, id]
          );
      },

      async countByStatus(status: string): Promise<number> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT COUNT(*) as count FROM candidats WHERE status = ?',
              [status]
          );
          return rows[0].count;
      }
  };
