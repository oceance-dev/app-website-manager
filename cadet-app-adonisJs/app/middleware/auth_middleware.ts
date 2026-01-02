import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  /**
   * Le guard à utiliser pour l'authentification
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    // Vérifier si le token est passé dans l'URL (pour les iframes/images)
    const tokenFromUrl = ctx.request.input('token')
    if (tokenFromUrl) {
      // Injecter le token dans le header Authorization
      ctx.request.request.headers['authorization'] = `Bearer ${tokenFromUrl}`
    }

    await ctx.auth.authenticateUsing(options.guards)

    const user = ctx.auth.user!

    // Vérifier que le compte est actif
    if (!user.isActive) {
      return ctx.response.forbidden({
        success: false,
        message: 'Votre compte est désactivé. Contactez un administrateur.',
      })
    }

    // Vérifier que le compte n'est pas verrouillé
    if (user.isLocked) {
      return ctx.response.forbidden({
        success: false,
        message: 'Votre compte est temporairement verrouillé suite à trop de tentatives de connexion.',
      })
    }

    // Charger le rôle avec les permissions
    await user.load('role', (query) => {
      query.preload('permissions')
    })

    return next()
  }
}