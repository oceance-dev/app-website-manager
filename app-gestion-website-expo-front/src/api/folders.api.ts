import { ApiResponse } from "./config";
import { api } from "./apiRequest";
import { API_ROUTES } from "./url.api";

// Types pour les dossiers
export interface Folder {
  id: number;
  name: string;
  parentId: number | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface FolderMember {
  id: number;
  folderId: number;
  userId: number;
  role: "viewer" | "editor" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface FolderWithMembers extends Folder {
  members?: FolderMember[];
}

export interface CreateFolderData {
  name: string;
  slug?: string;
  parentId?: number | null;
  visibility?: "private" | "members" | "staff" | "public";
  description?: string;
  color?: string;
  icon?: string;
  allowUpload?: boolean;
  allowDownload?: boolean;
  allowDelete?: boolean;
}

export interface UpdateFolderData {
  name?: string;
  parentId?: number | null;
}

export interface AddFolderMemberData {
  userId: number;
  role: "viewer" | "editor" | "admin";
}

export interface UpdateFolderMemberData {
  role: "viewer" | "editor" | "admin";
}

export interface MoveDocumentData {
  documentId: number;
  targetFolderId: number | null;
}

export interface MoveFolderData {
  targetParentId: number | null;
}

export const FoldersApi = {
  /**
   * Récupérer tous les dossiers
   */
  async getAll(): Promise<ApiResponse<{ folders: Folder[] }>> {
    const data = await api.get<{ folders: Folder[] }>(API_ROUTES.folders.list);
    return { success: true, data };
  },

  /**
   * Récupérer mon dossier personnel
   */
  async getMyFolder(): Promise<ApiResponse<{ folder: Folder }>> {
    const data = await api.get<{ folder: Folder }>(API_ROUTES.folders.my);
    return { success: true, data };
  },

  /**
   * Récupérer un dossier par ID
   */
  async getById(
    id: number,
  ): Promise<ApiResponse<{ folder: FolderWithMembers }>> {
    const data = await api.get<{ folder: FolderWithMembers }>(
      API_ROUTES.folders.get(id),
    );
    return { success: true, data };
  },

  /**
   * Créer un nouveau dossier
   */
  async create(
    folderData: CreateFolderData,
  ): Promise<ApiResponse<{ folder: Folder }>> {
    const data = await api.post<{ folder: Folder }>(
      API_ROUTES.folders.create,
      folderData,
    );
    return { success: true, data };
  },

  /**
   * Mettre à jour un dossier
   */
  async update(
    id: number,
    folderData: UpdateFolderData,
  ): Promise<ApiResponse<{ folder: Folder }>> {
    const data = await api.put<{ folder: Folder }>(
      API_ROUTES.folders.update(id),
      folderData as unknown as Record<string, unknown>,
    );
    return { success: true, data };
  },

  /**
   * Supprimer un dossier
   * @param id - ID du dossier
   * @param force - Forcer la suppression même si le dossier contient des documents/sous-dossiers
   */
  async delete(id: number, force: boolean = false): Promise<ApiResponse<void>> {
    const url = force
      ? `${API_ROUTES.folders.delete(id)}?force=true`
      : API_ROUTES.folders.delete(id);
    await api.delete(url);
    return { success: true, data: undefined };
  },

  /**
   * Déplacer un document
   */
  async moveDocument(data: MoveDocumentData): Promise<ApiResponse<void>> {
    await api.post(API_ROUTES.folders.moveDocument, data);
    return { success: true, data: undefined };
  },

  /**
   * Récupérer les membres d'un dossier
   */
  async getMembers(
    folderId: number,
  ): Promise<ApiResponse<{ members: FolderMember[] }>> {
    const data = await api.get<{ members: FolderMember[] }>(
      API_ROUTES.folders.members.list(folderId),
    );
    return { success: true, data };
  },

  /**
   * Ajouter un membre à un dossier
   */
  async addMember(
    folderId: number,
    memberData: AddFolderMemberData,
  ): Promise<ApiResponse<{ member: FolderMember }>> {
    const data = await api.post<{ member: FolderMember }>(
      API_ROUTES.folders.members.add(folderId),
      memberData,
    );
    return { success: true, data };
  },

  /**
   * Mettre à jour le rôle d'un membre
   */
  async updateMember(
    folderId: number,
    userId: number,
    memberData: UpdateFolderMemberData,
  ): Promise<ApiResponse<{ member: FolderMember }>> {
    const data = await api.put<{ member: FolderMember }>(
      API_ROUTES.folders.members.update(folderId, userId),
      memberData as unknown as Record<string, unknown>,
    );
    return { success: true, data };
  },

  /**
   * Retirer un membre d'un dossier
   */
  async removeMember(
    folderId: number,
    userId: number,
  ): Promise<ApiResponse<void>> {
    await api.delete(API_ROUTES.folders.members.delete(folderId, userId));
    return { success: true, data: undefined };
  },

  /**
   * Synchroniser les dossiers
   * Synchronise la structure des dossiers avec le backend
   */
  async syncFolders(): Promise<ApiResponse<{ folders: Folder[] }>> {
    const data = await api.post<{ folders: Folder[] }>(API_ROUTES.folders.sync);
    return { success: true, data };
  },

  /**
   * Déplacer un dossier vers un autre parent
   * @param folderId - ID du dossier à déplacer
   * @param targetParentId - ID du nouveau parent (null pour la racine)
   */
  async moveFolder(
    folderId: number,
    targetParentId: number | null,
  ): Promise<ApiResponse<{ folder: Folder }>> {
    const data = await api.put<{ folder: Folder }>(
      API_ROUTES.folders.move(folderId),
      { targetParentId },
    );
    return { success: true, data };
  },
};
