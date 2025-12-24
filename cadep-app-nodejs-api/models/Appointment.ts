import { pool } from '../config/database';
  import { RowDataPacket, ResultSetHeader } from 'mysql2';

  export interface Appointment {
      id: number;
      candidat_id: number;
      appointment_date: Date;
      appointment_time: string;
      notes: string | null;
      created_by: number | null;
      created_at: Date;
      updated_at: Date;
  }

  export const AppointmentModel = {

      async findById(id: number): Promise<Appointment | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM appointments WHERE id = ?',
              [id]
          );
          return (rows[0] as Appointment) || null;
      },

      async findByCandidatId(candidatId: number): Promise<Appointment | null> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM appointments WHERE candidat_id = ? ORDER BY appointment_date DESC LIMIT 1',
              [candidatId]
          );
          return (rows[0] as Appointment) || null;
      },

      async findAll(): Promise<Appointment[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM appointments ORDER BY appointment_date ASC, appointment_time ASC'
          );
          return rows as Appointment[];
      },

      async findByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
          const [rows] = await pool.execute<RowDataPacket[]>(
              'SELECT * FROM appointments WHERE appointment_date BETWEEN ? AND ? ORDER BY appointment_date ASC, appointment_time ASC',
              [startDate, endDate]
          );
          return rows as Appointment[];
      },

      async createAppointment(appointment: Partial<Appointment>): Promise<number> {
          const [result] = await pool.execute<ResultSetHeader>(
              `INSERT INTO appointments (candidat_id, appointment_date, appointment_time, notes, created_by)
              VALUES (?,?,?,?,?)`,
              [
                  appointment.candidat_id,
                  appointment.appointment_date,
                  appointment.appointment_time,
                  appointment.notes,
                  appointment.created_by
              ]
          );

          return result.insertId;
      },

      async updateAppointment(id: number, appointment: Partial<Appointment>): Promise<void> {
          await pool.execute(
              `UPDATE appointments 
              SET appointment_date = ?, appointment_time = ?, notes = ?
              WHERE id = ?`,
              [appointment.appointment_date, appointment.appointment_time, appointment.notes, id]
          );
      },

      async deleteAppointment(id: number): Promise<void> {
          await pool.execute(
              'DELETE FROM appointments WHERE id = ?',
              [id]
          );
      }
  };
