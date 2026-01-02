import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware pour vérifier qu'un utilisateur a un rôle minimum requis
 * Usage: .use(middleware.role('admin')) // admin ou supérieur
 */
export default class RoleMiddleware {
  // Niveaux des rôles (du plus bas au plus élevé)
  private static roleLevels: Record<string, number> = {
    cadet: 20,
    staff: 40,
    supervisor: 60,
    admin: 80,
    super_admin: 100,
  }

  async handle(
    { auth, response }: HttpContext,
    next: NextFn,
    options: { roles: string[] }
  ) {
    const user = auth.user!

    // Charger le rôle si pas déjà fait
    if (!user.role) {
      await user.load('role')
    }

    // Trouver le niveau minimum requis parmi les rôles spécifiés
    const requiredLevel: Number = Math.min(
      ...options.roles.map((r) => RoleMiddleware.roleLevels[r] || 0)
    )

    // Vérifier si le niveau de l'utilisateur est suffisant
    if (user.role.level >= requiredLevel) {
      return next()
    }

    return response.forbidden({
      success: false,
      message: 'Votre rôle ne permet pas d\'accéder à cette ressource',
      required: options.roles,
    })
  }
}

/**
 * Factory pour créer le middleware avec les rôles acceptés
 * Accepte un ou plusieurs rôles. L'utilisateur doit avoir au moins
 * le niveau du rôle le plus bas spécifié.
 */
export function role(...roles: string[]) {
  return {
    name: 'role',
    args: { roles },
  }
}