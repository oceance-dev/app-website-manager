import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError";
import OrgainizationService from "../service/organisationService";


export class OrganisationController {

    async createOrganisation(req: Request, res: Response, next: NextFunction) {
        try {
            const data = req.body;

            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                throw ApiError.badRequest('Données invalides');
            }

            if (!data) {
                throw ApiError.badRequest('Aucune données pour l\'inscription');
            }

            const userData = {
                ...data,
            };

            const resultOrganization = await OrgainizationService.createOrganization(data);

            //const newUser = await candidatService.createCandidat(userData);

            res.status(201).json({
                success: true,
                message: 'Association et administrateur créer avec succés',
                data: resultOrganization
            });

        } catch (error) {
            next(error);
        }
    }
}