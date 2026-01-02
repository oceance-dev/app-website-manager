import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour vérifier qu'un utilisateur a une permission spécifique 
 * Usage: .use(middleware.permission('user.create'))
 */
export default class PermissionMiddleware {
  async handle(
    { auth, response }: HttpContext,
    next: NextFn,
    options: { permissions: string[] }
  ) {
    const user = auth.user!

    // Charger le rôle avec les permissions si pas déjà fait
    if (!user.role || !user.role.permissions) {
      await user.load('role', (query) => {
        query.preload('permissions')
      })
    }

    // Super admin a toutes les permissions
    if (user.isSuperAdmin) {
      return next()
    }

    // Vérifier si l'utilisateur a au moins une des permissions requises
    const hasPermission = options.permissions.some((permission) =>
      user.hasPermission(permission)
    )

    if (!hasPermission) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission d\'effectuer cette action',
        required: options.permissions,
      })
    }

    return next()
  }
}

/**
 * Factory pour créer le middleware avec les permissions requises
 */
export function permission(...permissions: string[]) {
  return {
    name: 'permission',
    args: { permissions },
  }
}