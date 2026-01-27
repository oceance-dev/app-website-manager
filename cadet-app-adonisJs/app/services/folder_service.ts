import Document from "#models/document"
import Folder, { FolderType } from "#models/folder"
import { mkdir, rmdir, rename, access, readdir } from "node:fs/promises"
import { constants } from "node:fs"
import { join } from "node:path"
import env from '#start/env'

  // Create interface for folder creation
interface CreateFolderParams {
  name: string
  slug: string
  description?: string
  type: FolderType
  parentId?: number | null
  associationId: number
  //userId?: number | null
  candidatId?: number | null
  ownerId?: number | null
  visibility?: 'private' | 'restricted' | 'staff' | 'members' | 'public'
  sortOrder?: number
  allowUploads?: boolean
  allowDownloads?: boolean
  allowDelete?: boolean
  isPinned?: boolean
}

interface StorageConfig {
  driver: 'local' | 's3' | 'gcs'
  basePath: string
}


export class FolderService {
  // Your code here
 private config: StorageConfig

  constructor() {
    this.config = {
      driver: (env.get('STORAGE_DRIVER', 'local') as 'local' | 's3'),
      basePath: env.get('STORAGE_LOCAL_PATH', 'storage/uploads'),
    }
  }

  /**
   * ========================================
   * CHEMINS
   * ========================================
   */

  /**
   * Générer le chemin physique d'un dossier
   */
  async getFolderPath(folder: Folder): Promise<string> {
    const pathParts: string[] = []

    // Récupérer le chemin complet (arborescence)
    const ancestors = await folder.getPath()

    for (const ancestor of ancestors) {
      pathParts.push(ancestor.slug)
    }

    return join(
      this.config.basePath,
      'associations',
      String(folder.associationId),
      'folders',
      ...pathParts
    )
  }

  /**
   * Générer le chemin de base pour une association
   */
  getAssociationBasePath(associationId: number): string {
    return join(this.config.basePath, 'associations', String(associationId), 'folders')
  }

 /**
   * ========================================
   * CRÉATION
   * ========================================
   */

  async createFolder(createFolderParams: {
     associationId: number
    parentId?: number | null
    ownerId?: number | null
    name: string
    description?: string | null
    type?: 'system' | 'shared' | 'private'
    visibility?: 'private' | 'restricted' | 'staff' | 'members' | 'public'
    allowUpload?: boolean
    allowDownload?: boolean
    allowDelete?: boolean
    sortOrder?: number
    isPinned?: boolean
  }): Promise<{ success: boolean; folder?: Folder; error?: string }> {
    const slug = Folder.generateSlug(createFolderParams.name)

    const existing = await Folder.query()
      .where('associationId', createFolderParams.associationId)
      .where('slug', slug)
      .where((q) => {
        if (createFolderParams.parentId) {
          q.where('parentId', createFolderParams.parentId)
        }
        else {
          q.whereNull('parentId')
        }})
        .whereNull('deletedAt')
      .first()

    if (existing) {
      return { success: false, error: 'Un dossier avec ce nom existe déjà.' }
    }

    const createFolder = await Folder.create({
      name: createFolderParams.name,
      slug,
      description: createFolderParams.description || null,
      type: createFolderParams.type,
      parentId: createFolderParams.parentId || null,
      associationId: createFolderParams.associationId,
      //userId: createFolderParams.userId || null,
      //candidatId: createFolderParams.candidatId || null,
      ownerId: createFolderParams.ownerId || null,
      visibility: createFolderParams.visibility || 'private',
      sortOrder: createFolderParams.sortOrder || 0,
      allowUpload: createFolderParams.allowUpload ?? true,
      allowDownload: createFolderParams.allowDownload ?? true,
      allowDelete: createFolderParams.allowDelete ?? true,
      isPinned: createFolderParams.isPinned ?? false,
      isActive: true,
    })

    // Créer le dossier physique dans le système de fichiers
    if (this.config.driver === 'local') {
      const physicalPath = await this.getFolderPath(createFolder)
      await this.createPhysicalFolder(physicalPath)
    }

    // Mettre en place une fois le serveur de stockage pris
    return { success: true, folder: createFolder }

  }

  /**
   * Créer le dossier physique sur le disque
   */
  private async createPhysicalFolder(path: string): Promise<void> {
    try {
      await mkdir(path, { recursive: true })
      console.log(`📁 Dossier créé: ${path}`)
    } catch (error) {
      console.error(`Erreur création dossier physique: ${path}`, error)
      throw error
    }
  }

  /**
   * ========================================
   * RENOMMAGE / DÉPLACEMENT
   * ========================================
   */

  /**
   * Renommer un dossier
   */
  async rename(
    folder: Folder,
    newName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const oldSlug = folder.slug
      const newSlug = Folder.generateSlug(newName)

      // Vérifier l'unicité
      const existing = await Folder.query()
        .where('associationId', folder.associationId)
        .where('slug', newSlug)
        .where('id', '!=', folder.id)
        .where((q) => {
          if (folder.parentId) {
            q.where('parentId', folder.parentId)
          } else {
            q.whereNull('parentId')
          }
        })
        .whereNull('deletedAt')
        .first()

      if (existing) {
        return { success: false, error: 'Un dossier avec ce nom existe déjà' }
      }

      // Renommer physiquement si local
      if (this.config.driver === 'local' && oldSlug !== newSlug) {
        const oldPath = await this.getFolderPath(folder)
        
        // Mettre à jour le slug temporairement pour obtenir le nouveau chemin
        folder.slug = newSlug
        const newPath = await this.getFolderPath(folder)
        folder.slug = oldSlug // Restaurer pour l'instant

        await this.renamePhysicalFolder(oldPath, newPath)
      }

      // Mettre à jour en BDD
      folder.name = newName
      folder.slug = newSlug
      await folder.save()

      return { success: true }
    } catch (error) {
      console.error('Erreur renommage dossier:', error)
      return { success: false, error: 'Erreur lors du renommage du dossier' }
    }
  }

  /**
   * Renommer le dossier physique
   */
  private async renamePhysicalFolder(oldPath: string, newPath: string): Promise<void> {
    try {
      // Vérifier que l'ancien dossier existe
      await access(oldPath, constants.F_OK)
      
      // Renommer
      await rename(oldPath, newPath)
      console.log(`📁 Dossier renommé: ${oldPath} -> ${newPath}`)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // L'ancien dossier n'existe pas, créer le nouveau
        await this.createPhysicalFolder(newPath)
      } else {
        throw error
      }
    }
  }

  /**
   * Déplacer un dossier vers un nouveau parent
   */
  async move(
    folder: Folder,
    newParentId: number | null
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Vérifier qu'on ne déplace pas vers soi-même ou un enfant
      if (newParentId) {
        if (newParentId === folder.id) {
          return { success: false, error: 'Impossible de déplacer un dossier dans lui-même' }
        }

        // Vérifier que le nouveau parent n'est pas un enfant du dossier
        const descendants = await this.getAllDescendants(folder.id)
        if (descendants.includes(newParentId)) {
          return { success: false, error: 'Impossible de déplacer un dossier dans un de ses sous-dossiers' }
        }
      }

      // Vérifier l'unicité du slug dans le nouveau parent
      const existing = await Folder.query()
        .where('associationId', folder.associationId)
        .where('slug', folder.slug)
        .where('id', '!=', folder.id)
        .where((q) => {
          if (newParentId) {
            q.where('parentId', newParentId)
          } else {
            q.whereNull('parentId')
          }
        })
        .whereNull('deletedAt')
        .first()

      if (existing) {
        return { success: false, error: 'Un dossier avec ce nom existe déjà à cet emplacement' }
      }

      // Déplacer physiquement si local
      if (this.config.driver === 'local') {
        const oldPath = await this.getFolderPath(folder)

        // Obtenir le nouveau chemin
        folder.parentId = newParentId
        const newPath = await this.getFolderPath(folder)

        await this.movePhysicalFolder(oldPath, newPath)
      }

      // Mettre à jour en BDD
      folder.parentId = newParentId
      await folder.save()

      return { success: true }
    } catch (error) {
      console.error('Erreur déplacement dossier:', error)
      return { success: false, error: 'Erreur lors du déplacement du dossier' }
    }
  }

  /**
   * Déplacer le dossier physique
   */
  private async movePhysicalFolder(oldPath: string, newPath: string): Promise<void> {
    try {
      await access(oldPath, constants.F_OK)
      
      // Créer le dossier parent de destination
      const parentPath = join(newPath, '..')
      await mkdir(parentPath, { recursive: true })
      
      // Déplacer
      await rename(oldPath, newPath)
      console.log(`📁 Dossier déplacé: ${oldPath} -> ${newPath}`)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await this.createPhysicalFolder(newPath)
      } else {
        throw error
      }
    }
  }

  /**
   * Récupérer tous les descendants d'un dossier
   */
  private async getAllDescendants(folderId: number): Promise<number[]> {
    const descendants: number[] = []
    const children = await Folder.query().where('parentId', folderId).whereNull('deletedAt')

    for (const child of children) {
      descendants.push(child.id)
      const childDescendants = await this.getAllDescendants(child.id)
      descendants.push(...childDescendants)
    }

    return descendants
  }

   /**
   * ========================================
   * SUPPRESSION
   * ========================================
   */

  /**
   * Supprimer un dossier (soft delete BDD + optionnel physique)
   */
  async delete(
    folder: Folder,
    options: { 
      hardDelete?: boolean
      deletePhysical?: boolean 
      moveDocumentsToRoot?: boolean
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { hardDelete = false, deletePhysical = false, moveDocumentsToRoot = true } = options

      // Vérifier s'il y a des documents
      const documentsCount = await Document.query()
        .where('folderId', folder.id)
        .whereNull('deletedAt')
        .count('* as total')
        .first()

      const hasDocuments = (Number(documentsCount?.$extras.total) || 0) > 0

      // Vérifier s'il y a des sous-dossiers
      const childrenCount = await Folder.query()
        .where('parentId', folder.id)
        .whereNull('deletedAt')
        .count('* as total')
        .first()

      const hasChildren = (Number(childrenCount?.$extras.total) || 0) > 0

      // Gérer les documents
      if (hasDocuments) {
        if (moveDocumentsToRoot) {
          await Document.query()
            .where('folderId', folder.id)
            .update({ folderId: null })
        } else if (!hardDelete) {
          return { 
            success: false, 
            error: 'Le dossier contient des documents. Utilisez moveDocumentsToRoot=true ou hardDelete=true' 
          }
        }
      }

      // Gérer les sous-dossiers récursivement
      if (hasChildren) {
        const children = await Folder.query()
          .where('parentId', folder.id)
          .whereNull('deletedAt')

        for (const child of children) {
          await this.delete(child, options)
        }
      }

      // Supprimer physiquement si demandé
      if (this.config.driver === 'local' && deletePhysical) {
        const physicalPath = await this.getFolderPath(folder)
        await this.deletePhysicalFolder(physicalPath)
      }

      // Supprimer en BDD
      if (hardDelete) {
        await folder.delete()
      } else {
        await folder.softDelete()
      }

      return { success: true }
    } catch (error) {
      console.error('Erreur suppression dossier:', error)
      return { success: false, error: 'Erreur lors de la suppression du dossier' }
    }
  }

  /**
   * Supprimer le dossier physique
   */
  private async deletePhysicalFolder(path: string): Promise<void> {
    try {
      // Vérifier si le dossier existe et est vide
      const files = await readdir(path)
      
      if (files.length > 0) {
        console.warn(`⚠️ Dossier non vide, suppression ignorée: ${path}`)
        return
      }

      await rmdir(path)
      console.log(`🗑️ Dossier supprimé: ${path}`)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error(`Erreur suppression dossier physique: ${path}`, error)
      }
    }
  }

  /**
   * ========================================
   * INITIALISATION
   * ========================================
   */

  /**
   * Créer les dossiers système pour une association
   */
  async createSystemFolders(associationId: number): Promise<void> {
    const systemFolders = [
      {
        name: 'Documents partagés',
        description: 'Documents accessibles à tous les membres',
        type: 'system' as const,
        visibility: 'members' as const,
        icon: 'folder-shared',
        color: '#3B82F6',
        allowUpload: false,
        allowDownload: true,
        sortOrder: 1,
        isPinned: true,
      },
      {
        name: 'Formations',
        description: 'Supports et documents de formation',
        type: 'system' as const,
        visibility: 'members' as const,
        icon: 'graduation-cap',
        color: '#10B981',
        allowUpload: false,
        allowDownload: true,
        sortOrder: 2,
        isPinned: true,
      },
      {
        name: 'Administration',
        description: 'Documents administratifs (staff uniquement)',
        type: 'system' as const,
        visibility: 'staff' as const,
        icon: 'briefcase',
        color: '#F59E0B',
        allowUpload: false,
        allowDownload: true,
        sortOrder: 3,
        isPinned: true,
      },
      {
        name: 'Candidats',
        description: 'Documents administratifs des candidats (staff uniquement)',
        type: 'system' as const,
        visibility: 'staff' as const,
        icon: 'briefcase',
        color: '#F59E0B',
        allowUpload: false,
        allowDownload: true,
        sortOrder: 3,
        isPinned: true,
      },
    ]

    for (const folderData of systemFolders) {
      const existing = await Folder.query()
        .where('associationId', associationId)
        .where('slug', Folder.generateSlug(folderData.name))
        .whereNull('parentId')
        .first()

      if (!existing) {
        await this.createFolder({
          ...folderData,
          associationId,
          parentId: null,
          ownerId: null,
        })
      }
    }
  }

  /**
   * Créer le dossier privé d'un utilisateur
   */
  async createPrivateFolder(
    associationId: number,
    userId: number
  ): Promise<Folder> {
    const existing = await Folder.query()
      .where('associationId', associationId)
      .where('ownerId', userId)
      .where('type', 'private')
      .whereNull('parentId')
      .first()

    if (existing) return existing

    const result = await this.createFolder({
      associationId,
      parentId: null,
      ownerId: userId,
      name: `Mes documents privés ${userId}`,
      description: 'Votre espace personnel de documents',
      type: 'private',
      visibility: 'private',
      allowUpload: true,
      allowDownload: true,
      allowDelete: true,
      sortOrder: 0,
    })

    return result.folder!
  }

  /**
   * Créer un dossier candidat 
   */
  async createCandidatFolder(
    associationId: number,
    candidatId: number
  ): Promise<Folder> {
    const existing = await Folder.query()
      .where('associationId', associationId)
      .where('ownerId', candidatId)
      .where('slug', `candidat-${candidatId}`)
      .where('type', 'private')
      .whereNull('parentId')
      .first()

    if (existing) return existing

    const resultFolderCandidat = await this.createFolder({
      associationId,
      parentId: null,
      ownerId: candidatId,
      name: `candidat-${candidatId}`,
      description: `Espace documents du candidat ${candidatId}`,
      type: 'system',
      visibility: 'private',
      allowUpload: true,
      allowDownload: true,
      allowDelete: true,
      sortOrder: 0,
    })

    return resultFolderCandidat.folder!
  }

  /**
   * ========================================
   * SYNCHRONISATION
   * ========================================
   */

  /**
   * Synchroniser la structure physique avec la BDD
   * (Créer les dossiers physiques manquants)
   */
  async syncPhysicalFolders(associationId: number): Promise<{
    created: number
    errors: string[]
  }> {
    const result = { created: 0, errors: [] as string[] }

    if (this.config.driver !== 'local') {
      return result
    }

    const folders = await Folder.query()
      .where('associationId', associationId)
      .whereNull('deletedAt')
      .orderBy('parentId', 'asc')

    for (const folder of folders) {
      try {
        const path = await this.getFolderPath(folder)
        
        try {
          await access(path, constants.F_OK)
        } catch {
          // Le dossier n'existe pas, le créer
          await this.createPhysicalFolder(path)
          result.created++
        }
      } catch (error: any) {
        result.errors.push(`Erreur pour ${folder.name}: ${error.message}`)
      }
    }

    return result
  }

  /**
   * Récupérer le chemin physique d'un document dans un dossier
   */
  async getDocumentPath(document: Document): Promise<string> {
    if (!document.folderId) {
      // Document sans dossier -> chemin par défaut
      return join(
        this.config.basePath,
        'associations',
        String(document.associationId),
        'documents',
        document.filePath
      )
    }

    const folder = await Folder.find(document.folderId)
    if (!folder) {
      return join(
        this.config.basePath,
        'associations',
        String(document.associationId),
        'documents',
        document.filePath
      )
    }

    const folderPath = await this.getFolderPath(folder)
    return join(folderPath, document.filePath)
  }


}