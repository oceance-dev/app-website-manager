import { useCallback, useEffect, useState } from 'react';
import { FoldersApi } from '@/src/api';
import { Folder } from '@/src/types';
import { initialFolders } from '@/src/data/mockData';
import { generateFolderSlug } from '@/src/utils/slug';

export const useFolders = (currentUserId: number, associationId: number | null) => {
  const [folders, setFolders] = useState<Folder[]>(initialFolders);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await FoldersApi.getAll();

      if (response.success && response.data) {
        const mappedFolders: Folder[] = response.data.folders.map((folder: any) => ({
          id: folder.id,
          name: folder.name,
          slug: folder.slug,
          parentId: folder.parentId,
          createdBy: folder.ownerId || folder.createdBy,
          createdAt: folder.createdAt,
          permissions: folder.permissions || [],
          visibility: folder.visibility,
          description: folder.description,
          icon: folder.icon,
          color: folder.color,
          allowUpload: folder.allowUpload,
          allowDownload: folder.allowDownload,
          allowDelete: folder.allowDelete,
        }));
        setFolders(mappedFolders);
      }
    } catch (err: any) {
      console.error('Error loading folders:', err);
      setError(err?.message || 'Erreur lors du chargement des dossiers');
      setFolders(initialFolders);
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (
    newFolder: Omit<Folder, 'id' | 'createdAt'>
  ): Promise<boolean> => {
    try {
      const slug = generateFolderSlug(
        newFolder.name,
        currentUserId,
        associationId
      );

      const folderData = {
        name: newFolder.name,
        slug,
        parentId: newFolder.parentId,
        visibility: newFolder.visibility || 'members',
        description: newFolder.description,
        icon: newFolder.icon,
        color: newFolder.color,
        allowUpload: true,
        allowDownload: true,
        allowDelete: false,
      };

      const response = await FoldersApi.create(folderData);

      if (response.success) {
        await fetchFolders();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error creating folder:', err);
      throw err;
    }
  }, [currentUserId, associationId, fetchFolders]);

  const deleteFolder = useCallback(async (
    folderId: number,
    hasContent: boolean
  ): Promise<boolean> => {
    try {
      setDeleting(true);
      const response = await FoldersApi.delete(folderId, hasContent);

      if (response.success) {
        await fetchFolders();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error deleting folder:', err);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [fetchFolders]);

  const getFoldersByParent = useCallback((parentId: number | null): Folder[] => {
    return folders.filter(f => f.parentId === parentId);
  }, [folders]);

  const getFolderById = useCallback((id: number | null): Folder | undefined => {
    if (id === null) return undefined;
    return folders.find(f => f.id === id);
  }, [folders]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
    folders,
    loading,
    error,
    deleting,
    fetchFolders,
    createFolder,
    deleteFolder,
    getFoldersByParent,
    getFolderById,
  };
};
