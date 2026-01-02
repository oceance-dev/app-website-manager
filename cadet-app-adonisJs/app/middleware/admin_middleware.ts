import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class AdminMiddleware {
  async handle({auth, response}: HttpContext, next: NextFn) {

    const user = auth.user!
    
    if (!user.role) {
      await user.load('role')
    }

    // Vérifier que l'utilisateur 
    if (user.role?.level === 90) {
      return response.forbidden({
        success: false,
        message: 'Accès résevé à l\'administrateur'
      })
    }

    /**
     * Call next method in the pipeline and return its output
     */
    const output = await next()
    return output
  }
}