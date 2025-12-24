import vine from '@vinejs/vine'
import { AssociationStatus } from '../../types/HelperPermAndRole.js'


/**
 * Validation liste des associations
 */
export const listAssociationValidator = vine.compile(
    vine.object({
        page: vine.number().positive().optional(),
        limit: vine.number().positive().max(100).optional(),
        search: vine.string().trim().maxLength(100).optional(),
        status: vine.enum(Object.values(AssociationStatus)).optional(),
        sortBy: vine.enum(['createdAt', 'name', 'status']).optional(),
        sortOrder: vine.enum(['asc', 'desc']).optional(),
    })
)

/**
 * Validation approbation association
 */
export const approveAssociationValidator = vine.compile(
    vine.object({
        subscriptionMonths: vine.number().positive().min(1).max(24).optional(),
    })
)

/**
 * Validation rejet association
 */
export const rejectAssociationValidator = vine.compile(
    vine.object({
        reason: vine.string().trim().minLength(10).maxLength(500),
    })
)

/**
 * Validation mise à jour association
 */
export const updateAssociationValidator = vine.compile(
    vine.object({
        name: vine.string().trim().minLength(3).maxLength(255).optional(),
        email: vine.string().email().normalizeEmail().optional(),
        phone: vine.string().trim().optional(),
        address: vine.string().trim().minLength(5).maxLength(255).optional(),
        city: vine.string().trim().minLength(2).maxLength(100).optional(),
        postalCode: vine.string().trim().regex(/^\d{5}$/).optional(),
        country: vine.string().trim().minLength(2).maxLength(100).optional()
    })
)