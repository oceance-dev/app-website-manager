import { DocumentRequirementsApi, DocumentsApi } from "@/src/api";
import { useToast } from "@/src/contexts/ToastContext";
import { isWeb } from "@/src/utils/responsive";
import { useCallback, useEffect, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { Alert } from "react-native";

export interface DocumentRequirement {
  id: number;
  documentTypeId: number;
  customName?: string;
  customInstructions?: string;
  isRequired: boolean;
  isEnabled: boolean;
  requiredFor: "all" | "cadets" | "candidates" | "staff";
  requiredAt: "registration" | "approval" | "anytime";
  customValidityDays?: number | null;
  templateDocumentId?: number | null;
  documentType?: {
    id: number;
    name: string;
    displayName?: string;
    description?: string;
    category?: string;
  };
}

export interface DocumentType {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  category?: string;
}

export interface TemplateDocument {
  id: number;
  name: string;
  description?: string;
}

interface UseDocumentRequirementsResult {
  requirements: DocumentRequirement[];
  loadingRequirements: boolean;

  availableDocumentTypes: DocumentType[];
  loadingTypes: boolean;

  availableDocuments: TemplateDocument[];
  loadingTemplates: boolean;

  fetchAll: () => Promise<void>;

  createRequirement: (data: {
    documentTypeId: number;
    customName?: string;
    customInstructions?: string;
    isRequired: boolean;
    requiredFor: DocumentRequirement["requiredFor"];
    requiredAt: DocumentRequirement["requiredAt"];
    templateDocumentId?: number | null;
    customValidityDays?: number | null;
  }) => Promise<boolean>;

  updateRequirement: (
    id: number,
    data: {
      documentTypeId: number;
      customName?: string;
      customInstructions?: string;
      isRequired: boolean;
      requiredFor: DocumentRequirement["requiredFor"];
      requiredAt: DocumentRequirement["requiredAt"];
      templateDocumentId?: number | null;
      customValidityDays?: number | null;
    },
  ) => Promise<boolean>;

  deleteRequirement: (id: number) => Promise<boolean>;

  createCustomType: (data: {
    name: string;
    description?: string;
    category: string;
    isRequired: boolean;
    requiresValidation: boolean;
    hasExpiration: boolean;
    validityDays?: number | null;
    requiredFor: DocumentRequirement["requiredFor"];
  }) => Promise<boolean>;

  uploadTemplateDocument: () => Promise<number | null>;
}

export const useDocumentRequirements = (): UseDocumentRequirementsResult => {
  const [requirements, setRequirements] = useState<DocumentRequirement[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);

  const [availableDocumentTypes, setAvailableDocumentTypes] = useState<
    DocumentType[]
  >([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  const [availableDocuments, setAvailableDocuments] = useState<
    TemplateDocument[]
  >([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchRequirements = useCallback(async () => {
    try {
      setLoadingRequirements(true);
      const response = await DocumentRequirementsApi.getAll();

      if (response.success && response.data) {
        setRequirements(response.data.requirements || []);
      } else {
        setRequirements([]);
      }
    } catch (error: any) {
      console.error("Error loading requirements: ", error);
      if (isWeb) {
        alert("Erreur lors du chargement des exigences documentaires");
      } else {
        Alert.alert(
          "Erreur",
          "Impossible de charger les exigences documentaires",
        );
      }
    } finally {
      setLoadingRequirements(false);
    }
  }, []);

  const fetchAvailableTypes = useCallback(async () => {
    try {
      setLoadingTypes(true);
      const response = await DocumentRequirementsApi.getAvailableTypes();

      if (response.success && response.data) {
        setAvailableDocumentTypes(response.data.types || []);
      } else {
        setAvailableDocumentTypes([]);
      }
    } catch (error: any) {
      console.error("Error loading document types:", error);
      showError("Erreur lors du chargement des types");
    } finally {
      setLoadingTypes(false);
    }
  }, [showError]);

  const fetchAvailableDocuments = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const response = await DocumentsApi.getAll();

      if (response.success && response.data) {
        setAvailableDocuments(response.data?.documents || []);
      } else {
        setAvailableDocuments([]);
      }
    } catch (error: any) {
      console.error("Error loading documents:", error);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    await Promise.all([
      fetchRequirements(),
      fetchAvailableTypes(),
      fetchAvailableDocuments(),
    ]);
  }, [fetchRequirements, fetchAvailableTypes, fetchAvailableDocuments]);

  const createRequirement: UseDocumentRequirementsResult["createRequirement"] =
    useCallback(
      async (data) => {
        try {
          const response = await DocumentRequirementsApi.create(data);

          if (response.success) {
            showSuccess("Document requis ajouté");
            await fetchRequirements();
            return true;
          }
          showError("Erreur lors de la sauvegarde");
          return false;
        } catch (error: any) {
          console.error("Error saving requirements: ", error);
          showError("Erreur lors de la sauvegarde");
          return false;
        }
      },
      [fetchRequirements, showSuccess, showError],
    );

  const updateRequirement: UseDocumentRequirementsResult["updateRequirement"] =
    useCallback(
      async (id, data) => {
        try {
          const response = await DocumentRequirementsApi.update(id, data);
          if (response.success) {
            showSuccess("Document requis modifié");
            await fetchRequirements();
            return true;
          }
          showError("Erreur lors de la sauvegarde");
          return false;
        } catch (error: any) {
          console.error("Error saving requirement:", error);
          showError("Erreur lors de la sauvegarde");
          return false;
        }
      },
      [fetchRequirements, showSuccess, showError],
    );

  const deleteRequirement: UseDocumentRequirementsResult["deleteRequirement"] =
    useCallback(
      async (id) => {
        try {
          const response = await DocumentRequirementsApi.delete(id);

          if (response.success) {
            showSuccess("Documents requis supprimer");
            await fetchRequirements();
            return true;
          }
          showError("Erreur lors de la suppression");
          return false;
        } catch (error: any) {
          console.error("Error deleting requirement: ", error);
          showError("Erreur lors de la suppression");
          return false;
        }
      },
      [fetchRequirements, showSuccess, showError],
    );

  const createCustomType: UseDocumentRequirementsResult["createCustomType"] =
    useCallback(
      async (data) => {
        try {
          const response = await DocumentsApi.createType(data);

          if (response.success) {
            showSuccess("Type de document créé");
            await fetchAvailableTypes();
            return true;
          }
          showError("Erreur lors de la création du type");
          return false;
        } catch (error: any) {
          console.error("Error creating custom type:", error);
          showError("Erreur lors de la création du type de document");
          return false;
        }
      },
      [fetchAvailableTypes, showSuccess, showError],
    );

  //NOTE: uploadTemplateDocument est un wrapper autour du code q
  //
  const uploadTemplateDocument: UseDocumentRequirementsResult["uploadTemplateDocument"] =
    useCallback(async () => {
      try {
        setLoadingTemplates(true);

        const result = await DocumentPicker.getDocumentAsync({
          type: ["application/pdf", "image/*"],
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return null;
        }

        const file = result.assets[0];
        const blob = await fetch(file.uri).then((r) => r.blob());

        const uploadData = {
          name: file.name,
          file: blob,
          visibility: "staff" as const,
          category: "administrative" as const,
          description: "Document modèle pour les candidats",
          isTemplate: true,
        };

        const uploadResponse = await DocumentsApi.upload(uploadData);

        if (uploadResponse.success && uploadResponse.data) {
          showSuccess("Document modèle uploadé avec succès");
          await fetchAvailableDocuments();
          return uploadResponse.data.document.id;
        }

        return null;
      } catch (error: any) {
        console.error("Error uploading template:", error);
        showError(
          error?.message || "Erreur lors de l'upload du document modèle",
        );
        return null;
      } finally {
        setLoadingTemplates(false);
      }
    }, [fetchAvailableDocuments, showSuccess, showError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    requirements,
    loadingRequirements,
    availableDocumentTypes,
    loadingTypes,
    availableDocuments,
    loadingTemplates,
    fetchAll,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    createCustomType,
    uploadTemplateDocument,
  };
};
