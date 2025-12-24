/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import AuthController from '#controllers/auth_controller'
import router from '@adonisjs/core/services/router'
import { authTrottle, throttle } from './limiter.js'
import { middleware } from './kernel.js'
import AssociationsController from '#controllers/associations_controller'
import UsersController from '#controllers/users_controller'


/**
 * Health check
 */
router.get('/', async () => ({
  success: true,
  message: 'CADEAPP API V1',
  timestamp: new Date().toISOString(),
}))

router.get('/health', async () => ({
  success: true,
  status: 'healthy',
}))


/**
 * API V1
 */

router.group(() => {
  /**
   * AUTH - Routes publiques
   */
  router.group(() => {
    // Inscription association (public)
    router
      .post('/registerAssociation', [AuthController, 'register'])
      .use(authTrottle)
    // Inscription d'un membre d'une association
    router 
      .post('/registerMemberAssociation', [AuthController, 'registerMemberAssociation'])
      .use(authTrottle)

    // Connexion (public)
    router
      .post('/login', [AuthController, 'login']).use(authTrottle)

    router
      .post('/refresh', [AuthController, 'refresh'])

    //router.post('/refresh', [AuthController, 'refresh'])
  }).prefix('/auth')
  
  /**
   * AUTH - Route authentifiées 
   */
  router.group(() => {
    router.get('/me', [AuthController, 'me'])
    router.post('/logout', [AuthController, 'logout'])
  })
  .prefix('/auth')
  .use(middleware.auth())

  /**
   * ADMIN APP - Super admin uniquement
   */
  router.group(() => {

      // Gestion des associations
      router.group(() => {
        // Liste des associations
        router.get('/', [AssociationsController, 'index'])

        // Associations en attente
        router.get('/pending', [AssociationsController, 'pending'])

        // Détails d'une association
        router.get('/:id', [AssociationsController, 'show'])

        // Modifier une association
        router.put('/:id', [AssociationsController, 'update'])

        // Approuver une association
        router.post('/:id/approve', [AssociationsController, 'approve'])

        // Rejete une association
        router.post('/:id/reject', [AssociationsController, 'reject'])

        // Suspendre une association
        router.post('/:id/suspend', [AssociationsController, 'suspend'])

        // Réactiver une association
        router.post('/:id/reactivate', [AssociationsController, 'reactivate'])

        // Prolonger l'abonnement
        router.post('/:id/extend-subscription', [AssociationsController, 'extendSubscription'])
      }).prefix('/associations')
  })
    .prefix('/admin')
    .use(middleware.auth())
    .use(middleware.superAdmin())

  /**
   * USERS - Gestion des utilisateurs
   */
  router.group(() => {
    router.get('/', [UsersController, 'index'])
  })
    .prefix('/users')
    .use(middleware.auth())
    .use(middleware.superAdmin())

  router.group(() => {
    router.get('/', [AssociationsController, 'index'])
  }).prefix('/associations')
    .use(throttle)
})
.prefix('/api/v1')
.use(throttle)