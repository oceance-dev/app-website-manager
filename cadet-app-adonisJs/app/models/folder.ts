import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Association from './association.js'
import Document from './document.js'

/**
 * Type de dossier
 */
export type FolderType = 'system' | 'shared' | 'private'

/**
 * Visibilité du dossier
 */
export type FolderVisibility = 'private' | 'restricted' | 'staff' | 'members' | 'public'

/**
 * Labels pour les types
 */
export const FolderTypeLabels: Record<FolderType, string> = {
  system: 'Système',
  shared: 'Partagé',
  private: 'Privé',
}

/**
 * Labels pour la visibilité
 */
export const FolderVisibilityLabels: Record<FolderVisibility, string> = {
  private: 'Privé',
  restricted: 'Membres sélectionnés',
  staff: 'Staff uniquement',
  members: 'Tous les membres',
  public: 'Public',
}

export default class Folder extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare associationId: number

  @column()
  declare parentId: number | null

  @column()
  declare ownerId: number | null

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare color: string | null

  @column()
  declare icon: string | null

  @column()
  declare type: FolderType

  @column()
  declare visibility: FolderVisibility

  @column()
  declare allowUpload: boolean

  @column()
  declare allowDownload: boolean

  @column()
  declare allowDelete: boolean

  @column()
  declare sortOrder: number

  @column()
  declare isActive: boolean

  @column()
  declare isPinned: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null

  /**
   * ========================================
   * RELATIONS
   * ========================================
   */

  @belongsTo(() => Association)
  declare association: BelongsTo<typeof Association>

  @belongsTo(() => User, { foreignKey: 'ownerId' })
  declare owner: BelongsTo<typeof User>

  @belongsTo(() => Folder, { foreignKey: 'parentId' })
  declare parent: BelongsTo<typeof Folder>

  @hasMany(() => Folder, { foreignKey: 'parentId' })
  declare children: HasMany<typeof Folder>

  @hasMany(() => Document, { foreignKey: 'folderId' })
  declare documents: HasMany<typeof Document>

  @manyToMany(() => User, {
    pivotTable: 'folder_members',
    pivotColumns: ['can_view', 'can_upload', 'can_download', 'can_delete', 'can_manage'],
    pivotTimestamps: true,
  })
  declare members: ManyToMany<typeof User>

  /**
   * ========================================
   * GETTERS
   * ========================================
   */

  get typeLabel(): string {
    return FolderTypeLabels[this.type] || this.type
  }

  get visibilityLabel(): string {
    return FolderVisibilityLabels[this.visibility] || this.visibility
  }

  get isSystem(): boolean {
    return this.type === 'system'
  }

  get isPrivate(): boolean {
    return this.type === 'private'
  }

  get isShared(): boolean {
    return this.type === 'shared'
  }

  get isRoot(): boolean {
    return this.parentId === null
  }

  /**
   * ========================================
   * MÉTHODES D'INSTANCE
   * ========================================
   */

  /**
   * Générer le slug depuis le nom
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, '') // Supprimer les tirets en début/fin
  }

  /**
   * Soft delete
   */
  async softDelete(): Promise<void> {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  /**
   * Vérifier si un utilisateur peut accéder au dossier
   */
  async canAccess(user: User): Promise<boolean> {
    // Super admin peut tout voir
    if (user.isSuperAdmin) return true

    // Vérifier l'association
    if (this.associationId !== user.associationId) return false

    // Propriétaire peut toujours accéder
    if (this.ownerId === user.id) return true

    // Charger le rôle si nécessaire
    if (!user.role) {
      await user.load('role')
    }
    const roleLevel = Number(user.role?.level ?? 0)

    // Vérifier selon la visibilité
    switch (this.visibility) {
      case 'public':
      case 'members':
        return true

      case 'staff':
        return roleLevel >= 50 // Staff et au-dessus

      case 'restricted':
        // Vérifier si l'utilisateur est membre du dossier
        const membership = await Folder.query()
          .where('id', this.id)
          .whereHas('members', (query) => {
            query.where('users.id', user.id).where('folder_members.can_view', true)
          })
          .first()
        return !!membership

      case 'private':
        return this.ownerId === user.id

      default:
        return false
    }
  }

  /**
   * Vérifier les permissions d'un utilisateur sur le dossier
   */
  async getPermissions(user: User): Promise<{
    canView: boolean
    canUpload: boolean
    canDownload: boolean
    canDelete: boolean
    canManage: boolean
  }> {
    // Super admin a toutes les permissions
    if (user.isSuperAdmin) {
      return { canView: true, canUpload: true, canDownload: true, canDelete: true, canManage: true }
    }

    // Propriétaire a toutes les permissions
    if (this.ownerId === user.id) {
      return { canView: true, canUpload: true, canDownload: true, canDelete: true, canManage: true }
    }

    // Admin de l'association a toutes les permissions
    if (user.hasPermission('folders.manage')) {
      return { canView: true, canUpload: true, canDownload: true, canDelete: true, canManage: true }
    }

    // Vérifier l'accès de base
    const canAccess = await this.canAccess(user)
    if (!canAccess) {
      return { canView: false, canUpload: false, canDownload: false, canDelete: false, canManage: false }
    }

    // Pour les dossiers restreints, récupérer les permissions spécifiques
    if (this.visibility === 'restricted') {
      const member = await Folder.query()
        .where('id', this.id)
        .preload('members', (query) => {
          query.where('users.id', user.id)
        })
        .first()

      if (member && member.members.length > 0) {
        const pivot = member.members[0].$extras.pivot
        return {
          canView: pivot.can_view,
          canUpload: pivot.can_upload,
          canDownload: pivot.can_download,
          canDelete: pivot.can_delete,
          canManage: pivot.can_manage,
        }
      }
    }

    // Permissions par défaut du dossier
    return {
      canView: true,
      canUpload: this.allowUpload,
      canDownload: this.allowDownload,
      canDelete: this.allowDelete,
      canManage: false,
    }
  }

  /**
   * Ajouter un membre au dossier
   */
  async addMember(
    userId: number,
    permissions: {
      canView?: boolean
      canUpload?: boolean
      canDownload?: boolean
      canDelete?: boolean
      canManage?: boolean
    } = {},
    addedById?: number
  ): Promise<void> {
    const db = (await import('@adonisjs/lucid/services/db')).default
    
    await db.table('folder_members').insert({
      folder_id: this.id,
      user_id: userId,
      can_view: permissions.canView ?? true,
      can_upload: permissions.canUpload ?? false,
      can_download: permissions.canDownload ?? true,
      can_delete: permissions.canDelete ?? false,
      can_manage: permissions.canManage ?? false,
      added_by: addedById || null,
      created_at: new Date(),
      updated_at: new Date(),
    })
  }

  /**
   * Retirer un membre du dossier
   */
  async removeMember(userId: number): Promise<void> {
    const db = (await import('@adonisjs/lucid/services/db')).default
    
    await db.from('folder_members')
      .where('folder_id', this.id)
      .where('user_id', userId)
      .delete()
  }

  /**
   * Mettre à jour les permissions d'un membre
   */
  async updateMemberPermissions(
    userId: number,
    permissions: {
      canView?: boolean
      canUpload?: boolean
      canDownload?: boolean
      canDelete?: boolean
      canManage?: boolean
    }
  ): Promise<void> {
    const db = (await import('@adonisjs/lucid/services/db')).default
    
    const updateData: Record<string, unknown> = { updated_at: new Date() }
    if (permissions.canView !== undefined) updateData.can_view = permissions.canView
    if (permissions.canUpload !== undefined) updateData.can_upload = permissions.canUpload
    if (permissions.canDownload !== undefined) updateData.can_download = permissions.canDownload
    if (permissions.canDelete !== undefined) updateData.can_delete = permissions.canDelete
    if (permissions.canManage !== undefined) updateData.can_manage = permissions.canManage

    await db.from('folder_members')
      .where('folder_id', this.id)
      .where('user_id', userId)
      .update(updateData)
  }

  /**
   * ========================================
   * MÉTHODES STATIQUES
   * ========================================
   */

  /**
   * Créer les dossiers système pour une association
   */
  static async createSystemFolders(associationId: number): Promise<void> {
    const systemFolders = [
      {
        name: 'Documents partagés',
        slug: 'documents-partages',
        description: 'Documents accessibles à tous les membres',
        type: 'system' as FolderType,
        visibility: 'members' as FolderVisibility,
        icon: 'folder-shared',
        color: '#3B82F6',
        allowUpload: false,
        allowDownload: true,
        sortOrder: 1,
      },
      {
        name: 'Formations',
        slug: 'formations',
        description: 'Supports et documents de formation',
        type: 'system' as FolderType,
        visibility: 'members' as FolderVisibility,
        icon: 'graduation-cap',
        color: '#10B981',
        allowUpload: false,
        allowDownload: true,
        sortOrder: 2,
      },
      {
        name: 'Administration',
        slug: 'administration',
        description: 'Documents administratifs (staff uniquement)',
        type: 'system' as FolderType,
        visibility: 'staff' as FolderVisibility,
        icon: 'briefcase',
        color: '#F59E0B',
        allowUpload: false,
        allowDownload: true,
        sortOrder: 3,
      },
    ]

    for (const folder of systemFolders) {
      const existing = await this.query()
        .where('associationId', associationId)
        .where('slug', folder.slug)
        .whereNull('parentId')
        .first()

      if (!existing) {
        await this.create({
          ...folder,
          associationId,
          parentId: null,
          ownerId: null,
          isActive: true,
          isPinned: true,
        })
      }
    }
  }

  /**
   * Créer le dossier privé d'un utilisateur
   */
  static async createPrivateFolder(user: User): Promise<Folder> {
    const existing = await this.query()
      .where('associationId', user.associationId!)
      .where('ownerId', user.id)
      .where('type', 'private')
      .whereNull('parentId')
      .first()

    if (existing) return existing

    return this.create({
      associationId: user.associationId!,
      parentId: null,
      ownerId: user.id,
      name: 'Mes documents',
      slug: `private-${user.id}`,
      description: 'Votre espace personnel de documents',
      type: 'private',
      visibility: 'private',
      icon: 'folder-user',
      color: '#8B5CF6',
      allowUpload: true,
      allowDownload: true,
      allowDelete: true,
      sortOrder: 0,
      isActive: true,
      isPinned: false,
    })
  }

  /**
   * Récupérer les dossiers racine accessibles par un utilisateur
   */
  static async getRootFoldersForUser(user: User): Promise<Folder[]> {
    const query = this.query()
      .where('associationId', user.associationId!)
      .whereNull('parentId')
      .whereNull('deletedAt')
      .where('isActive', true)
      .orderBy('isPinned', 'desc')
      .orderBy('sortOrder', 'asc')
      .orderBy('name', 'asc')

    // Super admin voit tout
    if (user.isSuperAdmin) {
      return query
    }

    // Charger le rôle si nécessaire
    if (!user.role) {
      await user.load('role')
    }
    const roleLevel = Number(user.role?.level ?? 0)

    // Filtrer selon la visibilité
    return query.where((q) => {
      q.where('visibility', 'public')
        .orWhere('visibility', 'members')
        .orWhere('ownerId', user.id)

      // Staff voit les dossiers staff
      if (roleLevel >= 50) {
        q.orWhere('visibility', 'staff')
      }

      // Dossiers restreints où l'utilisateur est membre
      q.orWhereHas('members', (memberQ) => {
        memberQ.where('users.id', user.id).where('folder_members.can_view', true)
      })
    })
  }

  /**
   * Récupérer l'arborescence complète d'un dossier
   */
  async getPath(): Promise<Folder[]> {
    const path: Folder[] = [this]
    let current: Folder | null = this

    while (current?.parentId) {
      current = await Folder.find(current.parentId)
      if (current) {
        path.unshift(current)
      }
    }

    return path
  }

  /**
   * Compter les documents dans le dossier (récursif)
   */
  async countDocuments(recursive: boolean = false): Promise<number> {
    let count = await Document.query()
      .where('folderId', this.id)
      .whereNull('deletedAt')
      .count('* as total')
      .first()

    let total = Number(count?.$extras.total) || 0

    if (recursive) {
      const children = await Folder.query()
        .where('parentId', this.id)
        .whereNull('deletedAt')

      for (const child of children) {
        total += await child.countDocuments(true)
      }
    }

    return total
  }

  /**
   * ========================================
   * SÉRIALISATION
   * ========================================
   */

  toJSON() {
    return {
      id: this.id,
      associationId: this.associationId,
      parentId: this.parentId,
      ownerId: this.ownerId,
      name: this.name,
      slug: this.slug,
      description: this.description,
      color: this.color,
      icon: this.icon,
      type: this.type,
      typeLabel: this.typeLabel,
      visibility: this.visibility,
      visibilityLabel: this.visibilityLabel,
      allowUpload: this.allowUpload,
      allowDownload: this.allowDownload,
      allowDelete: this.allowDelete,
      sortOrder: this.sortOrder,
      isActive: this.isActive,
      isPinned: this.isPinned,
      isSystem: this.isSystem,
      isPrivate: this.isPrivate,
      isRoot: this.isRoot,
      createdAt: this.createdAt?.toISO(),
      updatedAt: this.updatedAt?.toISO(),
      // Relations
      owner: this.owner ? { id: this.owner.id, firstname: this.owner.firstname, lastname: this.owner.lastname } : null,
      parent: this.parent?.serializeBasic(),
      children: this.children?.map((c) => c.serializeBasic()),
    }
  }

  serializeBasic() {
    return {
      id: this.id,
      name: this.name,
      slug: this.slug,
      color: this.color,
      icon: this.icon,
      type: this.type,
      visibility: this.visibility,
      isSystem: this.isSystem,
      isPinned: this.isPinned,
    }
  }
}