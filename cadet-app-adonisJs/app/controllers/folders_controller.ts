import type { HttpContext } from '@adonisjs/core/http'
import Folder, { FolderVisibility, FolderType } from '#models/folder'
import Document from '#models/document'
import User from '#models/user'
import { FolderService } from '#services/folder_service'

export default class FoldersController {
  private folderSerivce: FolderService

  constructor() {
    this.folderSerivce = new FolderService()
  }
  /**
   * ========================================
   * CRUD DOSSIERS
   * ========================================
   */

  /**
   * GET /api/v1/folders
   * Liste des dossiers racine accessibles
   */
  async index({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const parentId = request.input('parentId', null)
    const includeDocuments = request.input('includeDocuments', false)

    let query = Folder.query()
      .where('associationId', currentUser.associationId!)
      .whereNull('deletedAt')
      .where('isActive', true)
      .orderBy('isPinned', 'desc')
      .orderBy('sortOrder', 'asc')
      .orderBy('name', 'asc')

    // Filtrer par parent
    if (parentId) {
      query.where('parentId', parentId)
    } else {
      query.whereNull('parentId')
    }

    // Filtrer selon la visibilité (sauf super admin)
    if (!currentUser.isSuperAdmin) {
      query.where((q) => {
        q.where('visibility', 'public')
          .orWhere('visibility', 'members')
          .orWhere('ownerId', currentUser.id)

        const user = Number(currentUser.role?.level ?? 0)
        // Staff voit les dossiers staff
        if (user >= 50) {
          q.orWhere('visibility', 'staff')
        }

        // Dossiers restreints où l'utilisateur est membre
        q.orWhereHas('members', (memberQ) => {
          memberQ.where('users.id', currentUser.id).where('folder_members.can_view', true)
        })
      })
    }

    const folders = await query.preload('owner')

    // Ajouter le comptage des documents et sous-dossiers
    const foldersWithCounts = await Promise.all(
      folders.map(async (folder) => {
        const documentsCount = await Document.query()
          .where('folderId', folder.id)
          .whereNull('deletedAt')
          .count('* as total')
          .first()

        const childrenCount = await Folder.query()
          .where('parentId', folder.id)
          .whereNull('deletedAt')
          .count('* as total')
          .first()

        const permissions = await folder.getPermissions(currentUser)

        return {
          ...folder.toJSON(),
          documentsCount: Number(documentsCount?.$extras.total) || 0,
          childrenCount: Number(childrenCount?.$extras.total) || 0,
          permissions,
        }
      })
    )

    // Inclure les documents si demandé
    let documents: Document[] = []
    if (includeDocuments) {
      const docQuery = Document.query()
        .where('associationId', currentUser.associationId!)
        .whereNull('deletedAt')
        .preload('user')
        .orderBy('name', 'asc')

      if (parentId) {
        docQuery.where('folderId', parentId)
      } else {
        docQuery.whereNull('folderId')
      }

      documents = await docQuery
    }

    return response.ok({
      success: true,
      data: {
        folders: foldersWithCounts,
        documents: includeDocuments ? documents.map((d) => d.toJSON()) : undefined,
        parentId,
      },
    })
  }

  /**
   * POST /api/v1/folders
   * Créer un dossier
   */
  async store({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const body = request.only([
      'name',
      'slug',
      'description',
      'parentId',
      'visibility',
      'color',
      'icon',
      'allowUpload',
      'allowDownload',
      'allowDelete',
    ])

    // Vérifier les permissions
    const canCreate =
      currentUser.isSuperAdmin ||
      currentUser.hasPermission('folders.create') ||
      body.visibility === 'private'

    if (!canCreate) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de créer des dossiers',
      })
    }

    // Si dossier privé, forcer la visibilité
    const isPrivate = body.visibility === 'private'
    const type: FolderType = isPrivate ? 'private' : 'shared'
    const visibility: FolderVisibility = body.visibility || 'private'

    // Vérifier le dossier parent si spécifié
    if (body.parentId) {
      const parent = await Folder.query()
        .where('id', body.parentId)
        .where('associationId', currentUser.associationId!)
        .whereNull('deletedAt')
        .first()

      if (!parent) {
        return response.notFound({
          success: false,
          message: 'Dossier parent non trouvé',
        })
      }

      // Vérifier l'accès au parent
      const canAccessParent = await parent.canAccess(currentUser)
      if (!canAccessParent) {
        return response.forbidden({
          success: false,
          message: 'Accès au dossier parent non autorisé',
        })
      }
    }

    // Utiliser le slug fourni par le frontend (qui inclut userId et associationId)
    // ou générer un slug simple si non fourni (compatibilité descendante)
    const slug = body.slug || Folder.generateSlug(body.name)

    console.log('🏷️ Backend - Using slug:', slug)
    console.log('📝 Backend - Folder name:', body.name)
    console.log('👤 Backend - User ID:', currentUser.id)
    console.log('🏢 Backend - Association ID:', currentUser.associationId)

    // Vérifier l'unicité du slug dans toute l'association
    // (le slug inclut déjà userId et associationId donc il est unique globalement)
    const existing = await Folder.query()
      .where('associationId', currentUser.associationId!)
      .where('slug', slug)
      .first()

    if (existing) {
      console.log('⚠️ Backend - Duplicate slug found:', existing.toJSON())
      return response.badRequest({
        success: false,
        message: 'Un dossier avec ce nom existe déjà à cet emplacement',
      })
    }

    console.log('✅ Backend - No duplicate slug found, proceeding with creation')

    const resultCreateFolder = await this.folderSerivce.createFolder({
      associationId: currentUser.associationId!,
      parentId: body.parentId || null,
      ownerId: currentUser.id,
      name: body.name,
      description: body.description || null,
      type,
      visibility,
      allowUpload: body.allowUpload ?? false,
      allowDownload: body.allowDownload ?? true,
      allowDelete: body.allowDelete ?? false,
      sortOrder: 0,
      isPinned: false,
    })

    if (!resultCreateFolder.success) { 
      return response.badRequest({
        success: false,
        message: resultCreateFolder.error,
      })
    }

    const physicalPath = await this.folderSerivce.getFolderPath(resultCreateFolder.folder!)

    return response.created({
      success: true,
      message: 'Dossier créé avec succès',
      data: {
        folder: {
          ...resultCreateFolder.folder!.toJSON(),
          physicalPath
        }
      }
    })
  }

  /**
   * GET /api/v1/folders/:id
   * Voir un dossier
   */
  async show({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('owner')
      .preload('parent')
      .preload('children', (q) => q.whereNull('deletedAt').where('isActive', true))
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier l'accès
    const canAccess = await folder.canAccess(currentUser)
    if (!canAccess) {
      return response.forbidden({
        success: false,
        message: 'Accès non autorisé',
      })
    }

    // Récupérer les permissions
    const permissions = await folder.getPermissions(currentUser)

    // Récupérer le chemin (arborescence)
    const path = await folder.getPath()

    // Récupérer les documents si demandé
    const includeDocuments = request.input('includeDocuments', true)
    let documents: Document[] = []

    if (includeDocuments) {
      documents = await Document.query()
        .where('folderId', folder.id)
        .whereNull('deletedAt')
        .preload('user')
        .orderBy('name', 'asc')
    }

    // Compter les éléments
    const documentsCount = await folder.countDocuments()
    const childrenCount = folder.children?.length || 0

    return response.ok({
      success: true,
      data: {
        folder: {
          ...folder.toJSON(),
          documentsCount,
          childrenCount,
          permissions,
        },
        path: path.map((p) => p.serializeBasic()),
        documents: documents.map((d) => d.toJSON()),
      },
    })
  }

  /**
   * PUT /api/v1/folders/:id
   * Modifier un dossier
   */
  async update({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier les permissions
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de modifier ce dossier',
      })
    }

    // Les dossiers système ne peuvent pas être modifiés (sauf par super admin)
    if (folder.isSystem && !currentUser.isSuperAdmin) {
      return response.forbidden({
        success: false,
        message: 'Les dossiers système ne peuvent pas être modifiés',
      })
    }

    const body = request.only([
      'name',
      'description',
      'visibility',
      'color',
      'icon',
      'allowUpload',
      'allowDownload',
      'allowDelete',
      'isPinned',
    ])

    // Mettre à jour le slug si le nom change
    if (body.name && body.name !== folder.name) {
      const slug = Folder.generateSlug(body.name)
      const renameResultFolder = await this.folderSerivce.rename(folder, body.name)

      if (!renameResultFolder.success) {
        return response.badRequest({
          success: false,
          message: renameResultFolder.error,
        })
      }

      // Vérifier l'unicité
      const existing = await Folder.query()
        .where('associationId', folder.associationId)
        .where('slug', slug)
        .where('id', '!=', folder.id)
        .where((q) => {
          if (folder.parentId) {
            q.where('parentId', folder.parentId)
          } else {
            q.whereNull('parentId')
          }
        })
        .first()

      if (existing) {
        return response.badRequest({
          success: false,
          message: 'Un dossier avec ce nom existe déjà à cet emplacement',
        })
      }

      //folder.name = body.name
      //folder.slug = slug
    }

    if (body.description !== undefined) folder.description = body.description
    if (body.visibility && !folder.isPrivate) folder.visibility = body.visibility
    if (body.color !== undefined) folder.color = body.color
    if (body.icon !== undefined) folder.icon = body.icon
    if (body.allowUpload !== undefined) folder.allowUpload = body.allowUpload
    if (body.allowDownload !== undefined) folder.allowDownload = body.allowDownload
    if (body.allowDelete !== undefined) folder.allowDelete = body.allowDelete
    if (body.isPinned !== undefined && currentUser.hasPermission('folders.manage')) {
      folder.isPinned = body.isPinned
    }

    await folder.save()

    const physicalPath = await this.folderSerivce.getFolderPath(folder)

    return response.ok({
      success: true,
      message: 'Dossier mis à jour',
      data: {
        folder: folder.toJSON(),
        physicalPath,
      },
    })
  }

  /**
   * DELETE /api/v1/folders/:id
   * Supprimer un dossier
   */
  async destroy({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier les permissions
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de supprimer ce dossier',
      })
    }

    // Les dossiers système ne peuvent pas être supprimés
    if (folder.isSystem) {
      return response.forbidden({
        success: false,
        message: 'Les dossiers système ne peuvent pas être supprimés',
      })
    }

    // Vérifier si le dossier contient des éléments
    const documentsCount = await folder.countDocuments()
    const childrenCount = await Folder.query()
      .where('parentId', folder.id)
      .whereNull('deletedAt')
      .count('* as total')
      .first()

    const hasChildren = (Number(childrenCount?.$extras.total) || 0) > 0

    if (documentsCount > 0 || hasChildren) {
      const force = request.input('force', false)

      if (!force) {
        return response.badRequest({
          success: false,
          message: `Ce dossier contient ${documentsCount} document(s) et ${childrenCount?.$extras.total || 0} sous-dossier(s). Utilisez force=true pour supprimer.`,
          data: {
            documentsCount,
            childrenCount: Number(childrenCount?.$extras.total) || 0,
          },
        })
      }
    }

     // Options de suppression
    const hardDelete = request.input('hardDelete', false)
    const deletePhysical = request.input('deletePhysical', false)
    const moveDocumentsToRoot = request.input('moveDocumentsToRoot', true)

    // Supprimer via le service (BDD + physique)
    const result = await this.folderSerivce.delete(folder, {
      hardDelete,
      deletePhysical,
      moveDocumentsToRoot,
    })

    if (!result.success) {
      return response.badRequest({
        success: false,
        message: result.error,
      })
    }

    return response.ok({
      success: true,
      message: 'Dossier supprimé',
    })
  }

  /**
   * POST /api/v1/folders/:id/move
   * Déplacer un dossier vers un nouveau parent
   */
  async move({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.load('role')
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier les permissions
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de déplacer ce dossier',
      })
    }

    // Les dossiers système ne peuvent pas être déplacés
    if (folder.isSystem) {
      return response.forbidden({
        success: false,
        message: 'Les dossiers système ne peuvent pas être déplacés',
      })
    }

    const { newParentId } = request.only(['newParentId'])

    // Vérifier le nouveau parent si spécifié
    if (newParentId) {
      const newParent = await Folder.query()
        .where('id', newParentId)
        .where('associationId', currentUser.associationId!)
        .whereNull('deletedAt')
        .first()

      if (!newParent) {
        return response.notFound({
          success: false,
          message: 'Dossier de destination non trouvé',
        })
      }
    }

    // Déplacer via le service
    const result = await this.folderSerivce.move(folder, newParentId || null)

    if (!result.success) {
      return response.badRequest({
        success: false,
        message: result.error,
      })
    }

    const physicalPath = await this.folderSerivce.getFolderPath(folder)

    return response.ok({
      success: true,
      message: 'Dossier déplacé',
      data: {
        folder: {
          ...folder.toJSON(),
          physicalPath,
        },
      },
    })
  }

  /**
   * POST /api/v1/folders/sync
   * Synchroniser les dossiers physiques avec la BDD
   */
  async sync({ auth, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.load('role')
    }

    // Seuls les admins peuvent synchroniser
    if (!currentUser.hasPermission('folders.manage') && !currentUser.isSuperAdmin) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de synchroniser les dossiers',
      })
    }

    const result = await this.folderSerivce.syncPhysicalFolders(currentUser.associationId!)

    return response.ok({
      success: true,
      message: `Synchronisation terminée: ${result.created} dossier(s) créé(s)`,
      data: result,
    })
  }

  /**
   * ========================================
   * GESTION DES MEMBRES
   * ========================================
   */

  /**
   * GET /api/v1/folders/:id/members
   * Liste des membres d'un dossier
   */
  async members({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .preload('members')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier les permissions
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de voir les membres',
      })
    }

    const members = folder.members.map((member) => ({
      ...member.toJSON(),
      permissions: {
        canView: member.$extras.pivot_can_view,
        canUpload: member.$extras.pivot_can_upload,
        canDownload: member.$extras.pivot_can_download,
        canDelete: member.$extras.pivot_can_delete,
        canManage: member.$extras.pivot_can_manage,
      },
    }))

    return response.ok({
      success: true,
      data: { members },
    })
  }

  /**
   * POST /api/v1/folders/:id/members
   * Ajouter un membre
   */
  async addMember({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier les permissions
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de gérer les membres',
      })
    }

    const body = request.only(['userId', 'canView', 'canUpload', 'canDownload', 'canDelete', 'canManage'])

    // Vérifier que l'utilisateur existe et est de la même association
    const user = await User.query()
      .where('id', body.userId)
      .where('associationId', folder.associationId)
      .whereNull('deletedAt')
      .first()

    if (!user) {
      return response.notFound({
        success: false,
        message: 'Utilisateur non trouvé',
      })
    }

    await folder.addMember(
      body.userId,
      {
        canView: body.canView ?? true,
        canUpload: body.canUpload ?? false,
        canDownload: body.canDownload ?? true,
        canDelete: body.canDelete ?? false,
        canManage: body.canManage ?? false,
      },
      currentUser.id
    )

    return response.created({
      success: true,
      message: 'Membre ajouté',
    })
  }

  /**
   * PUT /api/v1/folders/:id/members/:userId
   * Modifier les permissions d'un membre
   */
  async updateMember({ auth, params, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier les permissions
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de gérer les membres',
      })
    }

    const body = request.only(['canView', 'canUpload', 'canDownload', 'canDelete', 'canManage'])

    await folder.updateMemberPermissions(Number(params.userId), body)

    return response.ok({
      success: true,
      message: 'Permissions mises à jour',
    })
  }

  /**
   * DELETE /api/v1/folders/:id/members/:userId
   * Retirer un membre
   */
  async removeMember({ auth, params, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const folder = await Folder.query()
      .where('id', params.id)
      .whereNull('deletedAt')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier non trouvé',
      })
    }

    // Vérifier les permissions
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous n\'avez pas la permission de gérer les membres',
      })
    }

    await folder.removeMember(Number(params.userId))

    return response.ok({
      success: true,
      message: 'Membre retiré',
    })
  }

  /**
   * ========================================
   * DOSSIERS SPÉCIAUX
   * ========================================
   */

  /**
   * GET /api/v1/folders/my
   * Mon dossier privé
   */
  async myFolder({ auth, response }: HttpContext) {
    const currentUser = auth.user!

    // Créer le dossier privé s'il n'existe pas
    const folder = await this.folderSerivce.createPrivateFolder(currentUser.associationId!, currentUser.id)

    const physicalPath = await this.folderSerivce.getFolderPath(folder)

    // Charger les documents
    const documents = await Document.query()
      .where('folderId', folder.id)
      .whereNull('deletedAt')
      .orderBy('createdAt', 'desc')

    return response.ok({
      success: true,
      data: {
        folder: folder.toJSON(),
        documents: documents.map((d) => d.toJSON()),
        physicalPath,
      },
    })
  }

  /**
   * POST /api/v1/folders/move-document
   * Déplacer un document vers un dossier
   */
  async moveDocument({ auth, request, response }: HttpContext) {
    const currentUser = auth.user!

    if (!currentUser.role) {
      await currentUser.loadRoleWithPermissions()
    }

    const { documentId, folderId } = request.only(['documentId', 'folderId'])

    // Récupérer le document
    const document = await Document.query()
      .where('id', documentId)
      .where('associationId', currentUser.associationId!)
      .whereNull('deletedAt')
      .first()

    if (!document) {
      return response.notFound({
        success: false,
        message: 'Document non trouvé',
      })
    }

    // Vérifier que l'utilisateur peut modifier le document
    const canModify =
      currentUser.isSuperAdmin ||
      document.userId === currentUser.id ||
      currentUser.hasPermission('documents.update')

    if (!canModify) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas déplacer ce document',
      })
    }

    // Si folderId est null, déplacer vers la racine
    if (folderId === null) {
      document.folderId = null
      await document.save()

      return response.ok({
        success: true,
        message: 'Document déplacé vers la racine',
        data: { document: document.toJSON() },
      })
    }

    // Vérifier le dossier de destination
    const folder = await Folder.query()
      .where('id', folderId)
      .where('associationId', currentUser.associationId!)
      .whereNull('deletedAt')
      .first()

    if (!folder) {
      return response.notFound({
        success: false,
        message: 'Dossier de destination non trouvé',
      })
    }

    // Vérifier l'accès au dossier
    const permissions = await folder.getPermissions(currentUser)
    if (!permissions.canUpload && !permissions.canManage) {
      return response.forbidden({
        success: false,
        message: 'Vous ne pouvez pas ajouter de documents dans ce dossier',
      })
    }

    document.folderId = folder.id
    await document.save()

    return response.ok({
      success: true,
      message: `Document déplacé vers "${folder.name}"`,
      data: { document: document.toJSON() },
    })
  }
}