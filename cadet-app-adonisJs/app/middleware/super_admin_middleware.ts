import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SuperAdminMiddleware {
  async handle({ auth, response }: HttpContext, next: NextFn) {
    const user = auth.user!

    // Charger le rôle si pas déjà fait
    if (!user.role) {
      await user.load('role')
    }

    // Vérifier que c'est un super admin
    if (user.role?.name !== 'super_admin') {
      return response.forbidden({
        success: false,
        message: 'Accès réservé aux super administrateurs',
      })
    }

    return next()
  }
}