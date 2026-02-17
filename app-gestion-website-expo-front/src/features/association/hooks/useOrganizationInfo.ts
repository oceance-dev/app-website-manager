import { useCallback, useEffect, useState } from "react";
import { AuthApi, AssociationsApi } from "../../../api";
import {
  getDepartmentFromPostalCode,
  Department,
  isValidPostalCode,
} from "../../../utils/department";
import { useToast } from "../../../contexts/ToastContext";

export interface OrganizationInfo {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
  siret?: string;
  president?: string;
}

interface UseOrganizationInfoResult {
  orgInfo: OrganizationInfo;
  editedInfo: OrganizationInfo;
  setEditedInfo: (info: OrganizationInfo) => void;
  departmentInfo: Department | null;
  loading: boolean;
  isEditing: boolean;
  startEditing: () => void;
  cancelEditing: () => void;
  saveEditing: () => Promise<void>;
  refresh: () => Promise<void>;
  handlePostalCodeChange: (value: string) => void;
}

export const useOrganizationInfo = (): UseOrganizationInfoResult => {
  const [orgInfo, setOrgInfo] = useState<OrganizationInfo>({
    name: "",
    address: "",
    postalCode: "",
    city: "",
    email: "",
    phone: "",
  });
  const [editedInfo, setEditedInfo] = useState<OrganizationInfo>(orgInfo);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { showSuccess, showError } = useToast();

  const fetchOrganizationInfo = useCallback(async () => {
    try {
      setLoading(true);

      // Ton AuthApi actuel ne prend pas de token en param, on l’utilise tel quel [file:1]
      const meResponse = await AuthApi.getMe();

      if (!meResponse.success || !meResponse.data) return;

      const { user, association } = meResponse.data;

      if (!association) return;

      const newOrgInfo: OrganizationInfo = {
        name: association.name || "",
        address: association.address || "",
        postalCode: association.postalCode || "",
        city: association.city || "",
        email: user.email || "",
        phone: user.phone || "",
        siret: association.siret,
        president:
          `${user.firstName || user.firstname || ""} ${user.lastName || user.lastname || ""}`.trim(),
      };

      setOrgInfo(newOrgInfo);
      setEditedInfo(newOrgInfo);

      if (association.postalCode) {
        const dept = getDepartmentFromPostalCode(association.postalCode);
        setDepartmentInfo(dept);
      } else {
        setDepartmentInfo(null);
      }
    } catch (error) {
      console.error("Error loading organization info:", error);
      showError("Erreur lors du chargement des informations de l’association");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const updateOrganizationInfo = useCallback(
    async (edited: OrganizationInfo) => {
      try {
        // On récupère l’association pour avoir son id comme dans ton ancien code [file:1]
        const meResponse = await AuthApi.getMe();
        if (!meResponse.success || !meResponse.data) return;

        const association = meResponse.data.association;
        if (!association) return;

        const response = await AssociationsApi.update(association.id, {
          name: edited.name,
          address: edited.address,
          postalCode: edited.postalCode,
          city: edited.city,
          email: edited.email,
          phone: edited.phone,
        });

        if (response.success) {
          setOrgInfo(edited);
          setEditedInfo(edited);
          showSuccess("Informations mises à jour avec succès");
        } else {
          showError("Erreur lors de la mise à jour");
        }
      } catch (error) {
        console.error("Error updating organization:", error);
        showError("Erreur lors de la mise à jour");
      }
    },
    [showError, showSuccess],
  );

  const handlePostalCodeChange = (value: string) => {
    const next = { ...editedInfo, postalCode: value };
    setEditedInfo(next);

    if (isValidPostalCode(value)) {
      const dept = getDepartmentFromPostalCode(value);
      setDepartmentInfo(dept);
    } else {
      setDepartmentInfo(null);
    }
  };

  const startEditing = () => {
    setEditedInfo(orgInfo);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditedInfo(orgInfo);
    setIsEditing(false);
  };

  const saveEditing = async () => {
    await updateOrganizationInfo(editedInfo);
    setIsEditing(false);
  };

  const refresh = async () => {
    await fetchOrganizationInfo();
  };

  useEffect(() => {
    fetchOrganizationInfo();
  }, [fetchOrganizationInfo]);

  return {
    orgInfo,
    editedInfo,
    setEditedInfo,
    departmentInfo,
    loading,
    isEditing,
    startEditing,
    cancelEditing,
    saveEditing,
    refresh,
    handlePostalCodeChange,
  };
};
