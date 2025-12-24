import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SuperAdminMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Non authentifié'
      })
    }

    if (!user.isAdmin) {
      return ctx.response.forbidden({
        success: false,
        message: 'Accès réservé aux administrateurs de l\'application',
      })
    }
    /**
     * Middleware logic goes here (before the next call)
     */
    console.log(ctx)

    /**
     * Call next method in the pipeline and return its output
     */
    return next()
  }
}