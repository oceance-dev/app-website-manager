import User from '#models/user'
import { listUsersValidator } from '#validators/user'
import type { HttpContext } from '@adonisjs/core/http'
import { UserRole } from '../../types/HelperPermAndRole.js'

export default class UsersController {

    /**
     * GET /api/v1/users
     * Lister les utilisateurs
     * - Admin association : voit uniquement les utilisateurs de son association
     * - Super admin CADETAPP : voit tous les utilisateurs
     */
    async index({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!
        const filters = await request.validateUsing(listUsersValidator)

        const page = filters.page || 1
        const limit = filters.limit || 20

        const query = User.query().whereNull('deletedAt')

        if (currentUser.role !== UserRole.SUPER_ADMIN) {
            query.where('associationId', currentUser.associationId!)
        }

        if (filters.search) {
            query.where((q) => {
                q.whereILike('firstname', `%${filters.search}%`)
                    .orWhereILike('lastname', `%${filters.search}%`)
                    .orWhereILike('email', `%${filters.search}%`)
            })
        }

        if (filters.role) {
            query.where('role', filters.role)
        }

        if (filters.isActive !== undefined) {
            query.where('isActive', filters.isActive)
        }

        // Tri
        const sortBy = filters.sortBy || 'createdAt'
        const sortOrder = filters.sortOrder || 'desc'
        query.orderBy(sortBy, sortOrder)

        // Pagination
        const users = await query.paginate(page, limit)

        return response.ok({
            success: true,
            data: {
                users: users.all().map((u) => u.serialize()),
                meta: {
                    total: users.total,
                    perPage: users.perPage,
                    currentPage: users.currentPage,
                    lastPage: users.lastPage,
                },
            },
        })
    }

    /**
     * POST /api/v1/users
     * Créer un utilisateur 
     */
    /*async store({ auth, request, response }: HttpContext) {
        const currentUser = auth.user!
        const payload = await request.validateUsing()
    } */
}