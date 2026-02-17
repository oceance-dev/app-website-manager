import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { DocumentsApi } from '@/src/api';
import { Document } from '@/src/types';
import { getFileType, formatFileSize } from '../utils/fileUtils';

const isWeb = Platform.OS === 'web';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await DocumentsApi.getAll();

      if (response.success && response.data) {
        const mappedDocuments: Document[] = response.data.documents.map((doc: any) => ({
          id: doc.id,
          nameDoc: doc.name,
          folderId: doc.folderId || null,
          type: getFileType(doc.fileName),
          length: formatFileSize(doc.fileSize),
          date: new Date(doc.createdAt).toISOString().split('T')[0],
          uploadedBy: doc.userId,
          uri: doc.filePath,
          mimeType: doc.mimeType,
        }));
        setDocuments(mappedDocuments);
      }
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err?.message || 'Erreur lors du chargement des documents');
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadDocument = useCallback(async (
    newDoc: {
      nameDoc: string;
      folderId: number | null;
      uri?: string;
      mimeType?: string;
      visibility?: 'association' | 'personal';
    }
  ): Promise<boolean> => {
    try {
      setUploading(true);

      if (!newDoc.uri) {
        throw new Error('Aucun fichier sélectionné');
      }

      const response = await fetch(newDoc.uri);
      const blob = await response.blob();
      const file = new File([blob], newDoc.nameDoc, {
        type: newDoc.mimeType || blob.type
      });

      const backendVisibility = newDoc.visibility === 'personal' ? 'private' : 'members';

      const uploadResponse = await DocumentsApi.upload({
        name: newDoc.nameDoc,
        file: file,
        folderId: newDoc.folderId ?? undefined,
        visibility: backendVisibility,
        category: 'other',
      });

      if (uploadResponse.success) {
        await fetchDocuments();
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error uploading document:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [fetchDocuments]);

  const deleteDocument = useCallback(async (documentId: number): Promise<boolean> => {
    try {
      setDeleting(true);
      const response = await DocumentsApi.deleteDocument(documentId);

      if (response.success) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error deleting document:', err);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, []);

  const downloadDocument = useCallback(async (id: number, name: string) => {
    try {
      const downloadUrl = DocumentsApi.downloadDocument(id);

      if (isWeb) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = name;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Alert.alert('Info', 'Téléchargement en cours...');
      }
    } catch (err: any) {
      console.error('Error downloading document:', err);
      throw err;
    }
  }, []);

  const getDocumentsByFolder = useCallback((folderId: number | null): Document[] => {
    return documents.filter(doc => doc.folderId === folderId);
  }, [documents]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    uploading,
    deleting,
    fetchDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    getDocumentsByFolder,
  };
};
