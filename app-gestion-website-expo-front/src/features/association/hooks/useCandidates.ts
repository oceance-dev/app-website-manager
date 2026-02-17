import { CandidatsApi, DocumentRequirementsApi, DocumentsApi } from "@/src/api";
import { useToast } from "@/src/contexts/ToastContext";
import { useCallback, useEffect, useState } from "react";

interface RegistrationDocument {
  id: number;
  name: string;
  type: string;
  size: string;
  url?: string;
}

interface CandidatDocument {
  id: string;
  name: string;
  uploaded: boolean;
  uploadDate?: string;
  category: "required" | "form";
}
interface AppointmentInfo {
  date: Date;
  time: string;
  notes?: string;
}

export interface Candidate {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
  postalCode: string;
  city: string;
  parentEmail?: string;
  requestDate: string;
  documentsRequired: number;
  documentsUploaded: number;
  status: "pending" | "appointment_scheduled" | "validated" | "rejected";
  appointment?: AppointmentInfo;
}

export const useCandidates = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();

  // Charger les candidatures
  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await CandidatsApi.getAllCandidatures();

      if (!response.success || !response.data) {
        setCandidates([]);
        return;
      }

      // Charger le nombre de documents requis
      const requirementsResponse = await DocumentRequirementsApi.getAll();
      const totalRequired =
        requirementsResponse.success && requirementsResponse.data
          ? requirementsResponse.data.requirements.filter(
              (req: any) => req.isRequired,
            ).length
          : 0;

      // Charger les documents pour chaque candidat
      const candidatesWithDocs = await Promise.all(
        response.data.candidatures.map(async (candidat: any) => {
          try {
            const docsResponse = await DocumentsApi.getAllDocumentsByCandidat(
              candidat.id,
            );
            const uploadCount =
              docsResponse.success && docsResponse.data
                ? docsResponse.data.documents.length
                : 0;

            return {
              id: candidat.id,
              firstname: candidat.firstname || "",
              lastname: candidat.lastname || "",
              email: candidat.email || "",
              phone: candidat.phone || "",
              dateOfBirth: candidat.dateOfBirth
                ? new Date(candidat.dateOfBirth).toISOString().split("T")[0]
                : "",
              postalCode: candidat.city_code || "",
              city: candidat.city || "",
              address: candidat.address || "",
              parentEmail: candidat.parentEmail || "",
              requestDate: candidat.createdAt
                ? new Date(candidat.createdAt).toLocaleDateString("fr-FR")
                : new Date().toLocaleDateString("fr-FR"),
              status: "pending" as const,
              documentsUploaded: uploadCount,
              documentsRequired: totalRequired,
            };
          } catch (error: any) {
            console.error(
              `Error loading documents for candidate ${candidat.id}`,
              error,
            );

            return {
              id: candidat.id,
              firstname: candidat.firstname || "",
              lastname: candidat.lastname || "",
              email: candidat.email || "",
              phone: candidat.phone || "",
              dateOfBirth: "",
              postalCode: candidat.city_code || "",
              city: candidat.city || "",
              address: candidat.address || "",
              parentEmail: candidat.parentEmail || "",
              requestDate: new Date().toLocaleDateString("fr-FR"),
              status: "pending" as const,
              documentsUploaded: 0,
              documentsRequired: totalRequired,
            };
          }
        }),
      );

      setCandidates(candidatesWithDocs);
    } catch (error: any) {
      console.log("Error fetching candidates:", error);
      setError(error?.message || "Erreur lors du chargement des candidatures");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Valider une candidatures
  const validateCandidate = useCallback(
    async (candidateId: number) => {
      try {
        const response = await CandidatsApi.validateCandidature(candidateId);

        if (response.success) {
          // Mettre à jour l'état local
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === candidateId ? { ...c, status: "validated" } : c,
            ),
          );
          showSuccess("Candidature validé avec succès");

          await fetchCandidates();
          return true;
        }
        return false;
      } catch (error: any) {
        console.error("Error validating candidate:", error);
        showError(error?.message || "Erreur lors de la validation");
        return false;
      }
    },
    [fetchCandidates, showSuccess, showError],
  );

  // Rejete une Candidature
  const rejectCandidate = useCallback(
    async (candidateId: number) => {
      try {
        const response = await CandidatsApi.rejectCandidature(candidateId);

        if (response.success) {
          setCandidates((prev) =>
            prev.map((c) =>
              c.id === candidateId ? { ...c, status: "rejected" } : c,
            ),
          );
          showSuccess("Candidature refusée");
          await fetchCandidates();
          return true;
        }
        return false;
      } catch (err: any) {
        console.error("Error rejecting candidate:", err);
        showError(err?.message || "Erreur lors du rejet");
        return false;
      }
    },
    [fetchCandidates, showSuccess, showError],
  );

  // Charger au montage du composant
  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  return {
    candidates,
    loading,
    error,
    validateCandidate,
    rejectCandidate,
    refetch: fetchCandidates,
  };
};
