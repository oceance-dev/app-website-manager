import { useCallback, useState } from 'react';
import { DocumentsApi } from '@/src/api';
import { tokenStorage } from '@/src/api/tokenStorage';
import { DocumentViewerState } from '../types';

export const useDocumentViewer = () => {
  const [viewerState, setViewerState] = useState<DocumentViewerState>({
    visible: false,
    url: null,
    name: '',
    mimeType: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const viewDocument = useCallback(async (documentId: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const token = await tokenStorage.getAccessToken();
      if (!token) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      const response = await DocumentsApi.viewDocument(documentId);

      if (response.success && response.data?.document) {
        const doc = response.data.document;
        const downloadPath = DocumentsApi.downloadDocument(documentId);

        const fileResponse = await fetch(downloadPath, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!fileResponse.ok) {
          if (fileResponse.status === 401) {
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          }
          throw new Error(`Erreur HTTP: ${fileResponse.status}`);
        }

        const contentType = fileResponse.headers.get('content-type') || doc.mimeType || 'application/octet-stream';
        const arrayBuffer = await fileResponse.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);

        setViewerState({
          visible: true,
          url: blobUrl,
          name: doc.name || doc.fileName || 'Document',
          mimeType: contentType,
        });
      } else {
        throw new Error('Impossible de récupérer les informations du document');
      }
    } catch (err: any) {
      console.error('Error viewing document:', err);
      setError(err?.message || 'Impossible d\'ouvrir le document');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const closeViewer = useCallback(() => {
    if (viewerState.url && viewerState.url.startsWith('blob:')) {
      URL.revokeObjectURL(viewerState.url);
    }
    setViewerState({
      visible: false,
      url: null,
      name: '',
      mimeType: '',
    });
    setError(null);
  }, [viewerState.url]);

  return {
    viewerState,
    loading,
    error,
    viewDocument,
    closeViewer,
  };
};
