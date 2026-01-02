import vine from '@vinejs/vine'

/**
 * Validation création d'un utilisateur
 */
export const createUserValidator = vine.compile(
  vine.object({
    // Association (optionnel, utilisé par super_admin)
    associationId: vine
      .number()
      .positive()
      .exists(async (db, value) => {
        const association = await db
          .from('associations')
          .where('id', value)
          .first()
        return !!association
      })
      .optional(),

    // Rôle (obligatoire, doit exister en BDD)
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
      }),

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
  })
)

/**
 * Validation mise à jour d'un utilisateur
 */
export const updateUserValidator = vine.compile(
  vine.object({
    // Rôle (optionnel lors de la mise à jour)
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
      .optional(),

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

    isActive: vine.boolean().optional(),
  })
)

/**
 * Validation changement de mot de passe (par admin)
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
    roleId: vine.number().positive().optional(),
    roleName: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
    sortBy: vine.enum(['createdAt', 'lastname', 'firstname', 'email']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)

/**
 * Vérifie que le mot de passe ne contient pas le nom ou prénom
 * À appeler après la validation VineJS
 */
export function validatePasswordNoPersonalInfo(
  password: string,
  firstname: string,
  lastname: string
): { valid: boolean; errors: string[] } {
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