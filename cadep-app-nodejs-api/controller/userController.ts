import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError";
import userService from "../service/userService";


class UserController {

    /**
     * Récupérer tous les cadets (avec filtres optionnels)
     */
    async getAllCadets(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { status, year, limit, offset } = req.body;

            //const cadets = await Ca
        } catch (error) {
            throw new Error('Erreur');
        }
    }
    
    async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
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

            const newUser = await userService.createUser(userData);

            res.status(201).json({
                success: true,
                message: 'Utilisateur créer avec succès',
                date: newUser
            });

        } catch (error) {
           next(error);
        }
    }
}

export { UserController };
export default new UserController();