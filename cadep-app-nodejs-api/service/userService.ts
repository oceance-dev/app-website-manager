import { User, UserModel } from '../models/User';
import { Candidat, CandidatModel } from '../models/Candidat';
import { ApiError } from '../utils/ApiError';
import { sanitize } from '../middlewares/sanitize';
import { CandidatData } from './candidatService';
import { response } from 'express';


interface UserFilters {
    status?: string;
    role?: string;
    year?: number;
    limit: number;
    offset: number;
}

interface UserData {
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
    //candidatData: CandidatData;

    created_at: Date;
    updated_at: Date;
}

class UserService {

    /**
     * Récupérer les users avec le role cadet
     */

    async findAllCadet(filters: UserFilters) {
        const limit = Math.min(filters.limit || 50, 100);
        const offset = filters.offset || 0;

        const cadets = await UserModel.findByRole('cadet');

        if (!cadets) {
            return []
        }

        return cadets.map(cadet => this.sanitizeUser(cadet));
    }

    async findById(id: number) {
        const user = await UserModel.findById(id);

        if (!user) {
            return null;
        }

        return this.sanitizeUser(user);
    }

    // Continuer a définir l'inscription
    async createUser(userData: UserData): Promise<number> {

        if (!userData) {
            throw ApiError.notFound('Aucune données présente');
        }

        const existingUser = await UserModel.findByEmail(userData.email);
        if (existingUser) {
            throw ApiError.conflict('L\'email existe déjà dans notre base de données');
        }

        const dataToInsert = {
            ...userData,
            registrationDate: new Date().toISOString()
        };

        const createUser = await UserModel.createUser(dataToInsert);


        return createUser;
    }


    
    private sanitizeUser(user: any) {
        const {password_hash, token_version, failed_login_attempts, locked_until, last_login, ...safeCadet } = user;

        return safeCadet;
    }
}

export default new UserService();