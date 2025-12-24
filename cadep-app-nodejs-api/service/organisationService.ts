import { OrganizationInfoModel, OrganizationModel } from "../models/OrganizationInfo";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import userService from "./userService";


export interface OrganizationData {
    organization: OrganizationModel;
    user: User;
}

class OrgainizationService {

    async createOrganization(data: OrganizationData): Promise<number> {

        // Permet de vérifier la conformité des données fournis
        if (!data) {
            throw ApiError.badRequest('Les données pour la création de l\association ne sont pas présente');
        }
        if (!data.user) {
            throw ApiError.badRequest('Aucune données est présente pour la création de l\'utilisateur');
        }
        if (!data.organization) {
            throw ApiError.badRequest('Aucune données est présente pour la création de l\'association');
        }

        const checkExistingOrganization = OrganizationInfoModel.getOrganizationByCityCode(data.organization.postal_code);

        if (checkExistingOrganization !== null) {
            throw ApiError.conflict('Une association des cadets est déjà créer dans le département');
        }

        const createUser = userService.createUser(data.user);

        let createOrganization = undefined;
        if (createUser !== null) {
            createOrganization = await OrganizationInfoModel.createOrganization(data.organization);
        }

        if (createOrganization === undefined) {
            throw ApiError.badRequest('Récupération de l\id pour l\association impossible');
        }

        return createOrganization;
    }
}

export default new OrgainizationService();