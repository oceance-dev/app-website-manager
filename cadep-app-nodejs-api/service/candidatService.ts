import { CandidatModel } from "../models/Candidat";
import { User, UserModel } from "../models/User";
import { ApiError } from "../utils/ApiError";

/**
 * 
 */
export interface CandidatData {
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
    user: User;
}

class CandidatService {

    // Create candidat and create user
    async createCandidat(userData: CandidatData) {
        if (!userData) {
            throw ApiError.notFound('Aucune données présente');
        }

        const existingUser = await CandidatModel.findByEmail(userData.user.email);
        if (existingUser) {
            throw ApiError.conflict('L\'email existe déjà dans notre base de données');
        }

        const createUser = await UserModel.createUser(userData.user);
        let createCandidat;

        if (createUser > 0 ) {

            const age = this.calculateAge(userData.user.dateOfBirth);

            if (age < 16) {
                throw ApiError.unauthorized('Le candidat doit avoir au moins 16 ans')           
            }

         
            let response;
            if (userData.user_id !== null ) {
                response = await CandidatModel.createCandidat(userData);
            }
        }

        if (!createCandidat) {
            throw ApiError.badRequest('Impossible de récupérer l\'id lors de l\'insertion');
        }
        return {createUser: createUser, createCandidat: createCandidat}
    }


    /**
     * Fonction permettant de calculer l'age d'un futur cadet afin d'enregistré ça candidature
     * @param dateOfBirth 
     * @returns 
     */
    private calculateAge(dateOfBirth: string): number {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

}


export default new CandidatService();   