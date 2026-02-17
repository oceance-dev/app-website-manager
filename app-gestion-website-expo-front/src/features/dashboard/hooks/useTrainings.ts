import { useCallback, useEffect, useState } from "react";
import { Training } from "@/src/components/cadep";

// TODO: Remplacer par un appel API réel
const MOCK_TRAININGS: Training[] = [
  {
    id: '1',
    title: 'Formation initiale',
    startDate: '2026-02-02',
    endDate: '2026-02-06',
    type: 'formation',
  },
  {
    id: '2',
    title: 'Préparation au brevet',
    startDate: '2026-02-15',
    endDate: '2026-02-18',
    type: 'formation',
  },
  {
    id: '3',
    title: 'Examen théorique',
    startDate: '2026-02-25',
    type: 'examen',
  },
];

export const useTrainings = () => {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Remplacer par un appel API réel
      // const response = await TrainingsApi.getUpcoming();
      // if (response.success && response.data) {
      //   setTrainings(response.data.trainings);
      // }

      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      setTrainings(MOCK_TRAININGS);
    } catch (err: any) {
      console.error("Error fetching trainings:", err);
      setError(err?.message || "Erreur lors du chargement des formations");
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  return {
    trainings,
    loading,
    error,
    refetch: fetchTrainings,
  };
};
