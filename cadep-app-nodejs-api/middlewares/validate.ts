import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult, ValidationChain } from "express-validator";
import { ApiError } from '../utils/ApiError';

export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const messages = errors.array().map(err => err.msg);
            return next(ApiError.badRequest(messages.join(', ')));
        }
        next();
    };
};

export const validators = {
    id: param('id').isInt({ min: 1}).withMessage('ID invalide').toInt(),

    auth: {
        login: [
            body('email')
                .trim()
                .notEmpty().withMessage('Email requis')
                .isEmail().withMessage('Email invalide')
                .normalizeEmail(),
            body('password')
                .notEmpty().withMessage('Mot de passe requis')
        ],
        registerCandidat: [
            body('firstname')
                .trim()
                .notEmpty().withMessage('Prénom requis')
                .isLength({ min: 2, max: 100 }).withMessage('Prénom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Prénom invalide'),

            body('lastname')
                .trim()
                .notEmpty().withMessage('Nom requis')
                .isLength({ min: 2, max: 100 }).withMessage('Nom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom invalide'),

            body('email')
                .trim()
                .notEmpty().withMessage('Email requis')
                .isEmail().withMessage('Email invalide')
                .normalizeEmail()
                .isLength({ max: 255 }).withMessage('Email trop long'),

            body('emailParent')
                .optional({ checkFalsy: true })
                .trim()
                .isEmail().withMessage('Email parent invalide')
                .normalizeEmail()
                .isLength({ max: 255 }).withMessage('Email parent trop long'),

            body('password')
                .notEmpty().withMessage('Mot de passe requis')
                .isLength({ min: 8, max: 100 }).withMessage('Mot de passe: 8-100 caractères')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),

            body('confirmPassword')
                .notEmpty().withMessage('Confirmation du mot de passe requise')
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Les mots de passe ne correspondent pas');
                    }
                    return true;
                }),

            body('phone')
                .optional({ checkFalsy: true })
                .trim()
                .matches(/^(\+33|0)[1-9](\s?\d{2}){4}$/).withMessage('Numéro de téléphone invalide (format: +33 6 12 34 56 78 ou 06 12 34 56 78)'),

            body('dateOfbirth')
                .optional({ checkFalsy: true })
                .trim()
                .isISO8601().withMessage('Date de naissance invalide (format: YYYY-MM-DD)')
                .custom((value) => {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    if (age < 8 || age > 25) {
                        throw new Error('Âge requis: 8-25 ans');
                    }
                    return true;
                }),

            body('sexe')
                .optional({ checkFalsy: true })
                .isInt({ min: 0, max: 1 }).withMessage('Sexe invalide (0 = Homme, 1 = Femme)'),

            body('cityCode')
                .optional({ checkFalsy: true })
                .trim()
                .matches(/^\d{5}$/).withMessage('Code postal invalide (5 chiffres requis)')

        ],
        registerOrganization: [
            body('nameAssociation')
                .trim()
                .notEmpty().withMessage('Nom de l\'association requis')
                .isLength({ min: 2, max: 255 }).withMessage('Nom de l\'association: 2-255 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom de l\'association est invalide'),
            body('cityCode')
                .trim()
                .notEmpty().withMessage('Code postal requis'),
            body('city')
                .trim()
                .notEmpty().withMessage('Ville requis')
                .isLength({ min: 3, max: 100 }).withMessage('Ville: 3-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Ville invalide'),
            body('adresse')
                .optional()
                .trim()
                .isLength({ min: 5, max: 255 }).withMessage('Adresse: 5-255 caractères')
                .matches(/^[a-zA-ZÀ-ÿ0-9\s',.\-/°]+$/).withMessage('Adresse invalide'),
            body('lastname')
                .trim()
                .notEmpty().withMessage('Nom requis')
                .isLength({ min: 2, max: 100 }).withMessage('Nom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom invalide'),
            body('firstname')
                .trim()
                .notEmpty().withMessage('Prénom requis')
                .isLength({ min: 2, max: 100 }).withMessage('Prénom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Prénom invalide'),
            body('email')
                .trim()
                .notEmpty().withMessage('Email requis')
                .isEmail().withMessage('Email invalide')
                .normalizeEmail(),
            body('password')
                .notEmpty().withMessage('Mot de passe requis')
                .isLength({ min: 12 }).withMessage('Minimum 12 caractères')
                .matches(/[A-Z]/).withMessage('Une majuscule requise')
                .matches(/[a-z]/).withMessage('Une minuscule requise')
                .matches(/[0-9]/).withMessage('Un chiffre requis')
                .matches(/[^A-Za-z0-9]/).withMessage('Un caractère spécial requis'),
        ],
        registerOrganizationMember: [
            body('firstname')
                .trim()
                .notEmpty().withMessage('Prénom requis')
                .isLength({ min: 2, max: 100 }).withMessage('Prénom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Prénom invalide'),

            body('lastname')
                .trim()
                .notEmpty().withMessage('Nom requis')
                .isLength({ min: 2, max: 100 }).withMessage('Nom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom invalide'),

            body('email')
                .trim()
                .notEmpty().withMessage('Email requis')
                .isEmail().withMessage('Email invalide')
                .normalizeEmail()
                .isLength({ max: 255 }).withMessage('Email trop long'),

            body('password')
                .notEmpty().withMessage('Mot de passe requis')
                .isLength({ min: 8, max: 100 }).withMessage('Mot de passe: 8-100 caractères')
                .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),

            body('confirmPassword')
                .notEmpty().withMessage('Confirmation du mot de passe requise')
                .custom((value, { req }) => {
                    if (value !== req.body.password) {
                        throw new Error('Les mots de passe ne correspondent pas');
                    }
                    return true;
                }),

            body('phone')
                .trim()
                .notEmpty().withMessage('Téléphone requis')
                .matches(/^(\+33|0)[1-9](\s?\d{2}){4}$/).withMessage('Numéro de téléphone invalide (format: +33 6 12 34 56 78 ou 06 12 34 56 78)'),

            body('dateOfbirth')
                .trim()
                .notEmpty().withMessage('Date de naissance requise')
                .isISO8601().withMessage('Date de naissance invalide (format: YYYY-MM-DD)')
                .custom((value) => {
                    const birthDate = new Date(value);
                    const today = new Date();
                    const age = today.getFullYear() - birthDate.getFullYear();
                    if (age < 18) {
                        throw new Error('Vous devez avoir au moins 18 ans');
                    }
                    if (age > 100) {
                        throw new Error('Date de naissance invalide');
                    }
                    return true;
                }),

            body('sexe')
                .notEmpty().withMessage('Sexe requis')
                .isInt({ min: 0, max: 1 }).withMessage('Sexe invalide (0 = Homme, 1 = Femme)'),

            body('role')
                .trim()
                .notEmpty().withMessage('Rôle requis')
                .isIn(['Trésorier', 'Encadrant']).withMessage('Rôle invalide (Trésorier ou Encadrant uniquement)')
        ]
    },

    user: {

        // ============================================
        // VALIDATORS - UPDATE USER INFO
        // ============================================
        update: [
            body('firstname')
                .optional()
                .trim()
                .isLength({ min: 2, max: 100 }).withMessage('Prénom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Prénom invalide'),

            body('lastname')
                .optional()
                .trim()
                .isLength({ min: 2, max: 100 }).withMessage('Nom: 2-100 caractères')
                .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/).withMessage('Nom invalide'),

            body('email')
                .optional()
                .trim()
                .isEmail().withMessage('Email invalide')
                .normalizeEmail()
                .isLength({ max: 255 }).withMessage('Email trop long'),

            body('phone')
                .optional({ checkFalsy: true })
                .trim()
                .matches(/^(\+33|0)[1-9](\s?\d{2}){4}$/).withMessage('Numéro de téléphone invalide'),

            body('dateOfbirth')
                .optional()
                .trim()
                .isISO8601().withMessage('Date de naissance invalide'),

            body('sexe')
                .optional()
                .isInt({ min: 0, max: 1 }).withMessage('Sexe invalide'),

            body('role')
                .optional()
                .isIn(['Admin', 'Président', 'Trésorier', 'Encadrant', 'Cadet', 'Ancien Cadet', 'Candidat'])
                .withMessage('Rôle invalide'),

            body('statut')
                .optional()
                .isIn(['Actif', 'Inactif']).withMessage('Statut invalide')
        ]
    },

    candidat: {
        candidatAction: [
             body('candidatId')
                .notEmpty().withMessage('ID du candidat requis')
                .isInt({ min: 1 }).withMessage('ID du candidat invalide')
        ],
        candidatReject: [
            body('candidatId')
                .notEmpty().withMessage('ID du candidat requis')
                .isInt({ min: 1 }).withMessage('ID du candidat invalide'),

            body('reason')
                .optional({ checkFalsy: true })
                .trim()
                .isLength({ max: 500 }).withMessage('Raison du rejet: maximum 500 caractères')
        ]
    },

    // ============================================
    // VALIDATORS - DOCUMENT UPLOAD
    // ============================================
    document: {
        documentType: [
            body('documentType')
                .trim()
                .notEmpty().withMessage('Type de document requis')
                .isIn([
                    'id_card',
                    'photo',
                    'medical_certificate',
                    'parental_authorization',
                    'inscription_form',
                    'engagement_form',
                    'health_form'
                ]).withMessage('Type de document invalide')
        ]
    },

    folder: {
        createFolder: [
            body('name')
                .trim()
                .notEmpty().withMessage('Nom du dossier requis')
                .isLength({ min: 1, max: 255 }).withMessage('Nom du dossier: 1-255 caractères')
                .matches(/^[a-zA-ZÀ-ÿ0-9\s_\-()]+$/).withMessage('Nom du dossier invalide (caractères alphanumériques, espaces, _, -, () autorisés)'),

            body('parentId')
                .optional({ nullable: true, checkFalsy: true })
                .isInt({ min: 1 }).withMessage('ID du dossier parent invalide')
        ]
    },

    appointment: {
        createAppointement: [
            body('candidatId')
                .notEmpty().withMessage('ID du candidat requis')
                .isInt({ min: 1 }).withMessage('ID du candidat invalide'),

            body('date')
                .trim()
                .notEmpty().withMessage('Date du rendez-vous requise')
                .isISO8601().withMessage('Date invalide (format: YYYY-MM-DD)')
                .custom((value) => {
                    const appointmentDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    if (appointmentDate < today) {
                        throw new Error('La date du rendez-vous ne peut pas être dans le passé');
                    }
                    return true;
                }),

            body('time')
                .trim()
                .notEmpty().withMessage('Heure du rendez-vous requise')
                .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Heure invalide (format: HH:MM)'),

            body('notes')
                .optional({ checkFalsy: true })
                .trim()
                .isLength({ max: 1000 }).withMessage('Notes: maximum 1000 caractères')
        ]
    },

    pagination: [
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('sort').optional().isIn(['asc', 'desc']),
        query('sortBy').optional().matches(/^[a-zA-Z_]+$/)
    ]
};