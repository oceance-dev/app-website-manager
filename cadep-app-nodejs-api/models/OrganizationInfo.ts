import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface OrganizationModel {
    id: number;
    name: string;
    address: string | null;
    postal_code: string;
    city: string;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}

export const OrganizationInfoModel = {

    async findById(id: number): Promise<OrganizationModel | null> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM organization_info WHERE id = ?',
            [id]
        );
        return (rows[0] as OrganizationModel) || null;
    },

    async getOrganizationInfo(): Promise<OrganizationModel | null> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM organization_info LIMIT 1'
        );
        return (rows[0] as OrganizationModel) || null;
    },

    async getOrganizationByCityCode(postal_code: string): Promise<OrganizationModel | null> {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM organization_info WHERE postal_code = ?',
            [postal_code]
        );

        return (rows[0] as OrganizationModel) || null;
    },

    async createOrganization(org: OrganizationModel): Promise<number> {
        const [result] = await pool.execute<ResultSetHeader>(
            `INSERT INTO organization_info (name, address, postal_code, city, created_by)
            VALUES (?,?,?,?,?)`,
            [org.name, org.address, org.postal_code, org.city, org.created_by]
        );

        return result.insertId;
    },

    async updateOrganization(id: number, org: Partial<OrganizationModel>): Promise<void> {
        await pool.execute(
            `UPDATE organization_info 
            SET name = ?, address = ?, postal_code = ?, city = ?
            WHERE id = ?`,
            [org.name, org.address, org.postal_code, org.city, id]
        );
    }
};
