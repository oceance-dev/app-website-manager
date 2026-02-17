import { useCallback, useEffect, useState } from "react";
import { AssociationsApi } from "../../../api";
import type { AssociationStats } from "../../../api/features/associations.api";

interface UseOrganizationStatsResult {
  stats: AssociationStats;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultStats: AssociationStats = {
  activeUsers: 0,
  inactiveUsers: 0,
  documentsCount: 0,
  foldersCount: 0,
  usersByRole: [],
};

export const useOrganizationStats = (): UseOrganizationStatsResult => {
  const [stats, setStats] = useState<AssociationStats>(defaultStats);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await AssociationsApi.getMyStats();

      if (response.success && response.data?.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error loading organization stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refresh: fetchStats,
  };
};
