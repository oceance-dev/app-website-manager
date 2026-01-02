import { ApiResponse } from './config';
import { api } from './apiRequest';
import { UrlApi } from './url.api';

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
  role: 'viewer' | 'editor' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface FolderWithMembers extends Folder {
  members?: FolderMember[];
}

export interface CreateFolderData {
  name: string;
  parentId?: number | null;
  visibility?: 'private' | 'members' | 'staff' | 'public';
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
  role: 'viewer' | 'editor' | 'admin';
}

export interface UpdateFolderMemberData {
  role: 'viewer' | 'editor' | 'admin';
}

export interface MoveDocumentData {
  documentId: number;
  targetFolderId: number | null;
}

export const FoldersApi = {
  /**
   * Récupérer tous les dossiers
   */
  async getAll(): Promise<ApiResponse<{ folders: Folder[] }>> {
    const data = await api.get<{ folders: Folder[] }>(UrlApi.foldersApi.getAll);
    return { success: true, data };
  },

  /**
   * Récupérer mon dossier personnel
   */
  async getMyFolder(): Promise<ApiResponse<{ folder: Folder }>> {
    const data = await api.get<{ folder: Folder }>(UrlApi.foldersApi.myFolder);
    return { success: true, data };
  },

  /**
   * Récupérer un dossier par ID
   */
  async getById(id: number): Promise<ApiResponse<{ folder: FolderWithMembers }>> {
    const data = await api.get<{ folder: FolderWithMembers }>(UrlApi.foldersApi.get(id));
    return { success: true, data };
  },

  /**
   * Créer un nouveau dossier
   */
  async create(folderData: CreateFolderData): Promise<ApiResponse<{ folder: Folder }>> {
    const data = await api.post<{ folder: Folder }>(
      UrlApi.foldersApi.create,
      folderData
    );
    return { success: true, data };
  },

  /**
   * Mettre à jour un dossier
   */
  async update(id: number, folderData: UpdateFolderData): Promise<ApiResponse<{ folder: Folder }>> {
    const data = await api.put<{ folder: Folder }>(
      UrlApi.foldersApi.update(id),
      folderData
    );
    return { success: true, data };
  },

  /**
   * Supprimer un dossier
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    await api.delete(UrlApi.foldersApi.delete(id));
    return { success: true, data: undefined };
  },

  /**
   * Déplacer un document
   */
  async moveDocument(data: MoveDocumentData): Promise<ApiResponse<void>> {
    await api.post(UrlApi.foldersApi.moveDocument, data);
    return { success: true, data: undefined };
  },

  /**
   * Récupérer les membres d'un dossier
   */
  async getMembers(folderId: number): Promise<ApiResponse<{ members: FolderMember[] }>> {
    const data = await api.get<{ members: FolderMember[] }>(
      UrlApi.foldersApi.getFolderMembers(folderId)
    );
    return { success: true, data };
  },

  /**
   * Ajouter un membre à un dossier
   */
  async addMember(folderId: number, memberData: AddFolderMemberData): Promise<ApiResponse<{ member: FolderMember }>> {
    const data = await api.post<{ member: FolderMember }>(
      UrlApi.foldersApi.addFolderMember(folderId),
      memberData
    );
    return { success: true, data };
  },

  /**
   * Mettre à jour le rôle d'un membre
   */
  async updateMember(
    folderId: number,
    userId: number,
    memberData: UpdateFolderMemberData
  ): Promise<ApiResponse<{ member: FolderMember }>> {
    const data = await api.put<{ member: FolderMember }>(
      UrlApi.foldersApi.updateFolderMember(folderId, userId),
      memberData
    );
    return { success: true, data };
  },

  /**
   * Retirer un membre d'un dossier
   */
  async removeMember(folderId: number, userId: number): Promise<ApiResponse<void>> {
    await api.delete(UrlApi.foldersApi.deleteFolderMember(folderId, userId));
    return { success: true, data: undefined };
  },
};
