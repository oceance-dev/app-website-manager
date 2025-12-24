import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Password } from '../utils/password';

export interface User {
    id: number;
    firstname: string;
    lastname: string;
    phone: string;
    dateOfBirth: string;
    sexe: number;
    city_code: string;
    address: string | null;
    city: string | null;
    email: string;
    password_hash: string;
    role: string;
    is_active: boolean;
    token_version: number;
    failed_login_attempts: number;
    locked_until: Date | null;
    last_login: Date | null;

    created_at: Date;
    updated_at: Date;
}

export const UserModel = {

    async findByRole(role: string): Promise<User[]> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE role = ?',
            [role]
        );
        return rows as User[];
    },

    // Récupération de l'utilisateur en fonction de sont id
    async findById(id: number): Promise<User | null> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );
        return (rows[0] as User) || null;
    },

    async findByEmail(email: string): Promise<User | null> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        return (rows[0] as User) || null;
    },

    async createUser(user: User): Promise<number> {
        const passwordHash = await Password.hash(user.password_hash);
        const dateOfBirth = new Date(user.dateOfBirth);

        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO users (firstname, lastname, phone, date_of_birth, sexe, city_code, address, city, email, password_hash, role, is_active, token_version)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0)`,
            [user.firstname, user.lastname, user.phone, dateOfBirth, user.sexe, user.city_code, user.address, user.city, user.email, passwordHash, user.role, user.is_active]
        );

        return result.insertId;
    },

    async incrementFaildedAttempts(id: number): Promise<void> {
        await pool.execute(`
            UPDATE users
            SET failed_login_attemps = failed_login_attemps + 1,
                locked_until = CASE
                    WHEN failed_login_attemps >= 4 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE)
                    ELSE locked_until
                END
            WHERE id = ?`, 
            [id]);
    },

    async resetFailedAttempts(id: number): Promise<void> {
        await pool.execute(`
            UPDATE users
            SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
            WHERE id = ?
            `, [id]);
    },

    async incrementTokenVersion(id: number): Promise<void> {
        await pool.execute(
            'UPDATE users SET token_version = token_version + 1 WHERE id = ?',
            [id]
        );
    },

    async isLocked(user: User): Promise<boolean> {
        return user.locked_until !== null && new Date(user.locked_until) > new Date();
    }

}