import vine from '@vinejs/vine'

/**
 * Validation de l'inscription d'une association
 */
export const registerAssociationValidator = vine.compile(
    vine.object({
        association: vine.object({
            name: vine 
                .string()
                .trim()
                .minLength(3)
                .maxLength(255),

            rna: vine
                .string()
                .trim()
                .regex(/^W\d{9}$/)
                .unique(async (db, value) => {
                    if (!value) return true
                    const exists = await db.from('associations').where('rna', value).first()
                    return !exists
                })
                .nullable()
                .optional(),

            siret: vine
                .string()
                .trim()
                .regex(/^\d{14}$/)
                .unique(async (db, value) => {
                    if (!value) return true
                    const exists = await db.from('associations').where('siret', value).first()
                    return !exists
                })
                .nullable()
                .optional(),

            email: vine
                .string()
                .email()
                .normalizeEmail()
                .optional(),
                
            phone: vine
                .string()
                .trim()
                .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/).optional(),

            address: vine.string().trim().minLength(5).maxLength(255).optional(),
            city: vine.string().trim().minLength(2).maxLength(100),
            postalCode: vine.string().trim().regex(/^\d{5}$/),
            country: vine.string().trim().minLength(2).maxLength(100)
        }),

        // Informations du responsable (admin de l'association)
        responsable: vine.object({
            firstName: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100)
                .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/),
            lastName: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100)
                .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/),
            email: vine
                .string()
                .email()
                .normalizeEmail()
                .unique(async (db, value) => {
                    const exists = await db.from('users').where('email', value).first()
                    return !exists
                }),
            password: vine
                .string()
                .minLength(12)
                .maxLength(128)
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/),

            passwordConfirmation: vine.string().sameAs('password'),

            phone: vine
                .string()
                .trim()
                .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/),

            city_code: vine
                .string()
                .trim()
                .regex(/^\d{5}$/),

            dateOfBirth: vine.date({
                formats: ['YYYY-MM-DD', 'DD/MM/YYYY'],
            }).optional(),

            sexe: vine.enum(['Homme', 'Femme']).optional(),
        })
    })
)

/**
 * Validation de l'inscription pour un membre de l'association
 */
export const registerAssociationMemberValidator = vine.compile(
    vine.object({
        associationMember: vine.object({
            firstname: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100),

            lastname: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100),

            email: vine
                .string()
                .email()
                .normalizeEmail()
                .unique(async (db, value) => {
                    const exists = await db.from('users').where('email', value).first()
                    return !exists
                }),
            password: vine
                .string()
                .minLength(12)
                .maxLength(128)
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/),

            passwordConfirmation: vine.string().sameAs('password'),

            phone: vine
                .string()
                .trim()
                .regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/),

            city_code: vine
                .string()
                .trim()
                .regex(/^\d{5}$/),

            dateOfBirth: vine.date({
                formats: ['YYYY-MM-DD', 'DD/MM/YYYY'],
            }),

            sexe: vine.enum(['Homme', 'Femme']),

            associationId: vine
                .number()
                .positive()
                .exists(async (db, value) => {
                    const association = await db
                        .from('associations')
                        .where('id', value)
                        .first()
                    return !!association
                }),

            roleId: vine
                .number()
                .positive()
                .exists(async (db, value) => {
                    const role = await db
                        .from('roles')
                        .where('id', value)
                        .where('is_active', true)
                        .first()
                    return !!role
                })
        })
    })
)

/**
 * Validation de l'inscription pour un candidat de l'association
 */
export const registerAssociationCandidatValidator = vine.compile(
    vine.object({
        candidat: vine.object({
            firstname: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100),

            lastname: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100),

            email: vine
                .string()
                .email()
                .normalizeEmail()
                .unique(async (db, value) => {
                    const exists = await db.from('users').where('email', value).first()
                    return !exists
                }),
            password: vine
                .string()
                .minLength(12)
                .maxLength(128)
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/),

            passwordConfirmation: vine.string().sameAs('password'),

            city_code: vine
                .string()
                .trim()
                .regex(/^\d{5}$/),

            dateOfBirth: vine.date({
                formats: ['YYYY-MM-DD', 'DD/MM/YYYY'],
            }),

            sexe: vine.enum(['Homme', 'Femme']),
        }), 

        parent: vine.object({
             emailParent: vine
                .string()
                .email()
                .normalizeEmail()
                .unique(async (db, value) => {
                    const exists = await db.from('candidats').where('email_parent', value).first()
                    return !exists
                }),
            phoneParent: vine
                .string()
                .trim(),
            firstNameParent: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100),
            lastNameParent: vine
                .string()
                .trim()
                .minLength(2)
                .maxLength(100),
        })
    })
)


/**
 * Validation de l'inscription pour un candidat
 */

/**
 * Validation connexion
 */
export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().email().normalizeEmail(),
        password: vine.string(),
    })
)

/**
 * Règle personnalisée: le mot de passe ne doit pas contenir le nom ou le prénom
 */

export function validatePasswordNoPersonalInfo(
    password: string,
    firstname: string,
    lastname: string
) : { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const passwordLower = password.toLowerCase()
    const firstnameLower = firstname.toLowerCase()
    const lastnameLower = lastname.toLowerCase()

    if (firstnameLower.length >= 2 && passwordLower.includes(firstnameLower)) {
        errors.push('Le mot de passe ne doit pas contenir votre prénom')
    }

    if (lastnameLower.length >= 2 && passwordLower.includes(lastnameLower)) {
        errors.push('Le mot de passe ne doit pas contenir votre nom de famille')
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

const passwordNoPersonalInfo = vine.createRule(
    async (value, options: { firstname: string; lastname: string }, field) => {
        if (typeof value !== 'string') return

        const password = value.toLowerCase()
        const firstname = options.firstname?.toLowerCase() || ''
        const lastname = options.lastname?.toLowerCase() || ''

        if (firstname && firstname.length >= 2 && password.includes(firstname)) {
            field.report('Le mot de passe ne doit pas contenir votre prénom', 'passwordNoPersonalInfo', field)
        }

        if (lastname && lastname.length >= 2 && password.includes(lastname)) {
            field.report('Le mot de passe ne doit pas contenir votre nom de famille', 'passwordNoPersonalInfo', field)
        }
    }
)

/**
 * Validation refresh token
 */

export const refreshTokenValidator = vine.compile(
    vine.object({
        refreshToken: vine.string().minLength(1),
    })
)