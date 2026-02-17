import { CandidatsApi, DocumentsApi, tokenStorage } from "@/src/api";
import { API_ROUTES } from "@/src/api/url.api";
import { isWeb } from "@/src/utils/responsive";
import { useState, useCallback } from "react";
import { useToast } from "@/src/contexts/ToastContext";

export interface CandidateDocument {
  id: number;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  requirementId?: number;
}

export const useCandidateDocuments = (candidateId: number | null) => {
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { showSuccess, showError } = useToast();

  const fetchDocuments = useCallback(async () => {
    if (!candidateId) return;

    try {
      setLoading(true);
      const response =
        await DocumentsApi.getAllDocumentsByCandidat(candidateId);

      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Error loading candidate documents:", error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  // Visualiser un document
  const viewDocument = useCallback(
    async (document: CandidateDocument) => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) {
          showError("Session expirée. Veuillez vous reconnecter");
          return null;
        }

        const downloadPath = API_ROUTES.candidats.documents.download(
          document.id,
        );

        const fileResponse = await fetch(downloadPath, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!fileResponse.ok) {
          if (fileResponse.status === 401) {
            showError("Session expirée. Veuillez vous reconnecter.");
            return null;
          }
          throw new Error(`Erreur HTTP: ${fileResponse.status}`);
        }

        const contentType =
          fileResponse.headers.get("content-type") || document.mimeType;
        const arrayBuffer = await fileResponse.arrayBuffer();
        const blob = new Blob([arrayBuffer], { type: contentType });
        const blobUrl = URL.createObjectURL(blob);

        return {
          url: blobUrl,
          name: document.originalName || document.name,
          mimeType: contentType,
        };
      } catch (error: any) {
        console.error("Error viewing document:", error);
        showError(error?.message || "Impossible d'ouvrir le document");
        return null;
      }
    },
    [showError],
  );

  // Télécharger un document
  const downloadDocument = useCallback(
    async (document: CandidateDocument) => {
      try {
        const token = await tokenStorage.getAccessToken();
        if (!token) {
          showError("Session expirée. Veuillez vous reconnecter.");
          return;
        }

        const downloadPath = API_ROUTES.candidats.documents.download(
          document.id,
        );
        const fileResponse = await fetch(downloadPath, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!fileResponse.ok) {
          throw new Error(`Erreur HTTP: ${fileResponse.status}`);
        }

        const blob = await fileResponse.blob();
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        link.download = document.originalName || document.name || "document";
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showSuccess("Document téléchargé avec succès");
      } catch (error: any) {
        console.error("Error downloading document:", error);
        showError(error?.message || "Erreur lors du téléchargement");
      }
    },
    [showSuccess, showError],
  );

  // Supprimer un document
  const deleteDocument = useCallback(
    async (documentId: number) => {
      try {
        const response = await CandidatsApi.deleteDocument(documentId);

        if (response.success) {
          showSuccess("Document supprimé avec succès");
          await fetchDocuments();
          return true;
        }
        return false;
      } catch (error: any) {
        console.error("Error deleting document:", error);
        showError(error?.message || "Erreur lors de la suppression");
        return false;
      }
    },
    [fetchDocuments, showSuccess, showError],
  );

  // Uploader un document personnalisé
  /*const uploadCustomDocument = useCallback(async () => {
    if (!candidateId) return false;

    try {
      setUploading(true);

      const result = await DocumentsApi.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return false;

      const file = result.assets[0];
      const formData = new FormData();

      if (isWeb) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append("file", blob, file.name);
      } else {
        formData.append("file", {
          uri: file.uri,
          type: file.mimeType || "application/octet-stream",
          name: file.name,
        } as any);
      }

      formData.append("category", "other");
      formData.append("name", file.name);

      const uploadResponse = await CandidatsApi.uploadDocument(formData);

      if (uploadResponse.success) {
        showSuccess(`Document "${file.name}" ajouté avec succès`);
        await fetchDocuments();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error uploading document:", error);
      showError("Erreur lors de l'ajout du document");
      return false;
    } finally {
      setUploading(false);
    }
  }, [candidateId, fetchDocuments, showSuccess, showError]);*/

  return {
    documents,
    loading,
    uploading,
    fetchDocuments,
    viewDocument,
    downloadDocument,
    deleteDocument,
    //uploadCustomDocument,
  };
};
