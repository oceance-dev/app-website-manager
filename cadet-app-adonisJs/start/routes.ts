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
import RolesController from '#controllers/roles_controller'
import DocumentsController from '#controllers/documents_controller'
import FoldersController from '#controllers/folders_controller'


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
   * USERS - Gestion des utilisateurs (Super Admin)
   */
  /*router.group(() => {
    router.get('/', [UsersController, 'index'])
    router.get('/pending', [UsersController, 'pending'])
    router.post('/:id/approve', [UsersController, 'approve'])
    router.post('/:id/reject', [UsersController, 'reject'])
  })
    .prefix('/admin/users')
    .use(middleware.auth())
    .use(middleware.superAdmin())
  */
  router.group(() => {
    router.get('/', [AssociationsController, 'allAssociations'])
    router.get('/:id/occupied-roles', [AssociationsController, 'getOccupiedRoles'])
  }).prefix('/associations')
    .use(throttle)

  /**
   * ========================================
   * ROUTES ASSOCIATIONs
   * ========================================
   */

  router.group(() => {

    // Route super admin
    router.group(() => {
      router.group(() => {
        router.get('/', [AssociationsController, 'allAssociations']);
        router.get('/:id', [AssociationsController, 'show']);
        // Modifier une association
        router.put('/:id', [AssociationsController, 'update']);
        // Approuver une association
        router.post('/:id/approve', [AssociationsController, 'approve']);
        // Rejete une association
        router.post('/:id/reject', [AssociationsController, 'reject']);
        // Suspendre une association
        router.post('/:id/suspend', [AssociationsController, 'suspend']);
        // Réactiver une association
        router.post('/:id/reactived', [AssociationsController, 'reactivate']);
      }).prefix('/association')

    }).prefix('/staffApp')
      .use(middleware.auth())
      .use(middleware.superAdmin())

    // Route admin
    router.group(() => {
      router.group(() => {
        router.get('/:id', [AssociationsController, 'myAssociation']);
        router.put('/:id/update', [AssociationsController, 'update']);
        router.post('/:id/extend-subscription', [AssociationsController, 'extendSubscription']);
      }).prefix('/association')

      router.group(() => {
        router.get('/', [AssociationsController, 'allMembers'])
        router.post('/:id/approve', [AssociationsController, 'approveMember'])
        router.post('/:id/reject', [AssociationsController, 'rejectMember'])
        router.post('/:id/suspend', [AssociationsController, 'suspendMember'])
        router.post('/:id/delete', [AssociationsController, 'deleteMembers'])
      }).prefix('/members')

      // Gestion des cadets
      router.group(() => {

      }).prefix('/cadets')

      // Gestion des candidatures
      router.group(() => {

      }).prefix('/candidatures')

    }).prefix('/admin')
      .use(middleware.auth())
      .use(middleware.admin())

  }).prefix('/association')
    .use(throttle)

  /**
   * ========================================
   * ROUTES UTILISATEURS
   * ========================================
   */
  router.group(() => {
    // Mon profil
    router.get('/me', [UsersController, 'me'])
    router.put('/me', [UsersController, 'updateMe'])
    router.put('/me/change-password', [UsersController, 'resetPassword'])

    // CRUD utilisateurs
    router.get('/', [UsersController, 'index'])
    router.post('/', [UsersController, 'store'])
    router.get('/:id', [UsersController, 'show'])
    router.put('/:id', [UsersController, 'update'])
    router.delete('/:id', [UsersController, 'destroy'])

    // Actions sur utilisateurs
    router.post('/:id/toggle-active', [UsersController, 'toggleActive'])
    router.post('/:id/reset-password', [UsersController, 'resetPassword'])
    router.put('/:id/change-role', [UsersController, 'changeRole'])

  })
  .prefix('/users')
  .use(middleware.auth())

  /**
   * ========================================
   * ROUTES RÔLES & PERMISSIONS (publiques pour users authentifiés)
   * ========================================
   */
  router.group(() => {
    // Liste des rôles (filtrée selon niveau de l'utilisateur)
    router.get('/roles', [RolesController, 'index'])

    // Rôles assignables par l'utilisateur courant (AVANT /roles/:id)
    router.get('/roles/assignable', [RolesController, 'assignable'])

    // Détails d'un rôle
    router.get('/roles/:id', [RolesController, 'show'])

    // Liste des permissions (groupées)
    router.get('/permissions', [RolesController, 'permissions'])

    // Mes permissions (pour le front)
    router.get('/me/permissions', [RolesController, 'myPermissions'])

  })
  .use(middleware.auth())
  

  /**
   * ========================================
   * ROUTES ADMIN RÔLES (Super Admin uniquement)
   * ========================================
   */
  router.group(() => {
    // CRUD rôles personnalisés
    router.post('/roles', [RolesController, 'store'])
    router.put('/roles/:id/update', [RolesController, 'update'])
    router.delete('/roles/:id/delete', [RolesController, 'destroy'])

    // Permissions d'un rôle
    router.put('/roles/:id/permissions/update', [RolesController, 'updatePermissions'])

    // Utilisateurs ayant un rôle
    router.get('/roles/:id/user', [RolesController, 'users'])

  })
  .prefix('/staffApp')
  .use([middleware.auth(), middleware.superAdmin()])

  /**
   * ========================================
   * ROUTES DOCUMENTS
   * ========================================
   */
  router.group(() => {

    router.group(() => {
      router.get('/getAllDocument', [DocumentsController, 'index'])
      router.get('/view/:id', [DocumentsController, 'show'])
      router.post('/upload-document', [DocumentsController, 'store'])
      router.get('/download/:id', [DocumentsController, 'downloadDocument'])
    }).prefix('/users')

    router.group(() => {

    }).prefix('/cadet')

    router.group(() => {

    }).prefix('/candidat')

  }).prefix('/documents')
    .use(middleware.auth())

  /**
   * ========================================
   * ROUTES FOLDER
   * ========================================
   */
  router.group(() => {
    // Mon dossier privé
    router.get('/my', [FoldersController, 'myFolder'])

    // Déplacer un document
    router.post('/move-document', [FoldersController, 'moveDocument'])

    // CRUD dossiers
    router.get('/getAllFolder', [FoldersController, 'index'])
    router.post('/create-folder', [FoldersController, 'store'])
    router.get('/:id', [FoldersController, 'show'])
    router.put('/update/:id', [FoldersController, 'update'])
    router.delete('/delete/:id', [FoldersController, 'destroy'])

    // Gestion des membres
    router.get('/:id/members', [FoldersController, 'members'])
    router.post('/:id/members', [FoldersController, 'addMember'])
    router.put('/:id/members/:userId', [FoldersController, 'updateMember'])
    router.delete('/:id/members/:userId', [FoldersController, 'removeMember'])
  }).prefix('/folders')
    .use(middleware.auth())
})
.prefix('/api/v1')
.use(throttle)