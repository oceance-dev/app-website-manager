import { Request, Response, NextFunction } from "express";
import candidatService from "../service/candidatService";
import { ApiError } from "../utils/ApiError";
import { validationResult } from "express-validator";

class CandidatController {


    /**
     * Controller permettant la création d'un candidat et d'un user en même temps
     * @param req 
     * @param res 
     * @param next 
     */
    async createCandidat(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            const newUser = await candidatService.createCandidat(userData);

            res.status(201).json({
                success: true,
                message: 'Candidat créer avec succès',
                data: newUser
            });

        } catch (error) {
            next(error);
        }
    }
}

export default new CandidatController();