import vine from '@vinejs/vine'
import { UserRole } from '../../types/HelperPermAndRole.js'

/**
 * Validation modification du profil utilisateur
 */
export const updateUserValidator = vine.compile(
    vine.object({
        email: vine
            .string()
            .email()
            .normalizeEmail()
            .optional(),

        firstname: vine
            .string()
            .trim()
            .minLength(2)
            .maxLength(100)
            .optional(),

        lastname: vine
            .string()
            .trim()
            .minLength(2)
            .maxLength(100)
            .optional(),

        phone: vine
            .string()
            .trim()
            .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/)
            .optional(),
        
        city_code: vine
            .string()
            .trim()
            .regex(/^\d{5}$/)
            .optional(),

        dateOfBirth: vine
            .date({
                formats: ['YYYY-MM-DD', 'DD/MM/YYYY'],
            })
            .optional(),

        sexe: vine.enum(['Homme', 'Femme']).optional(),
    })
)

/**
 * Validation Changement de mot de passe
 */

export const resetPasswordValidator = vine.compile(
    vine.object({
        newPassword: vine
            .string()
            .minLength(12)
            .maxLength(128)
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/),
        
        newPasswordConfirmation: vine.string().sameAs('newPassword'),
    })
)

/**
 * Validation liste des utilisateurs (filtres)
 */
export const listUsersValidator = vine.compile(
    vine.object({
        page: vine.number().positive().optional(),
        limit: vine.number().positive().max(100).optional(),
        search: vine.string().trim().maxLength(100).optional(),
        role: vine.enum(Object.values(UserRole)).optional(),
        isActive: vine.boolean().optional(),
        sortBy: vine.enum(['createdAt', 'lastname', 'firstname', 'email', 'role']).optional(),
        sortOrder: vine.enum(['asc', 'desc']).optional(),
    })
)