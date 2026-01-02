import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware d'authentification qui accepte le token depuis l'URL
 * Utilisé pour les endpoints de documents qui doivent être accessibles via iframe
 */
export default class AuthWithTokenMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Récupérer le token depuis l'URL
    const tokenFromUrl = ctx.request.input('token')

    // Si un token est présent dans l'URL, l'injecter dans le header
    if (tokenFromUrl) {
      // Créer ou modifier le header Authorization
      if (!ctx.request.header('authorization')) {
        ctx.request.request.headers['authorization'] = `Bearer ${tokenFromUrl}`
      }
    }

    try {
      // Utiliser le système d'authentification standard d'AdonisJS
      await ctx.auth.authenticateUsing(['api'])

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
    } catch (error) {
      console.error('Auth with token error:', error)
      return ctx.response.unauthorized({
        success: false,
        message: 'Échec de l\'authentification',
      })
    }
  }
}
