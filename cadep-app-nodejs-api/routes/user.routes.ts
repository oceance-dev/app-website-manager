import { Router } from "express";
import { body } from "express-validator";
import { UserController } from "../controller/userController";
import { auth } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";

const router = Router();
const userController = new UserController();

/**
 * @route   POST /api/users
 * @desc    Créer un nouveau utilisateur
 * @access  Private (Admin uniquement)
 */
router.post(
    '/',
    authorize({ resource: 'RESOURCES.', action: 'ACTIONS.CREATE' }),
    [
        body('email')
            .isEmail()
            .withMessage('Email invalide')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 8 })
            .withMessage('Le mot de passe doit contenir au moins 8 caractères')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
        body('firstName')
            .trim()
            .notEmpty()
            .withMessage('Le prénom est requis')
            .isLength({ min: 2 })
            .withMessage('Le prénom doit contenir au moins 2 caractères'),
        body('lastName')
            .trim()
            .notEmpty()
            .withMessage('Le nom est requis')
            .isLength({ min: 2 })
            .withMessage('Le nom doit contenir au moins 2 caractères'),
        body('role')
            .optional()
            .isIn(['admin', 'cadet', 'formateur', 'responsable'])
            .withMessage('Rôle invalide'),
    ],
    userController.createUser.bind(userController)
);

export default router;
