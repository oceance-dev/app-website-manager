import { useCallback, useEffect, useState } from "react";
import { NewsItem } from "../types";

// TODO: Remplacer par un appel API réel
const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    title: 'Nouvelle session de formation annoncée',
    content: 'Les inscriptions pour la formation initiale des cadets de février sont ouvertes. Places limitées !',
    author: 'Marie Dupont',
    date: '2026-01-08',
    category: 'Formation',
    pinned: true,
  },
  {
    id: 2,
    title: 'Résultats du dernier exercice',
    content: 'Félicitations à tous les participants pour leur excellent travail lors de l\'exercice de navigation du 15 décembre.',
    author: 'Pierre Martin',
    date: '2026-01-05',
    category: 'Événement',
    pinned: false,
  },
  {
    id: 3,
    title: 'Mise à jour des documents obligatoires',
    content: 'N\'oubliez pas de mettre à jour vos certificats médicaux avant la prochaine session de formation.',
    author: 'Jean Leroy',
    date: '2026-01-03',
    category: 'Information',
    pinned: false,
  },
];

export const useNews = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Remplacer par un appel API réel
      // const response = await NewsApi.getAll();
      // if (response.success && response.data) {
      //   setNews(response.data.news);
      // }

      // Simulation d'un délai réseau
      await new Promise(resolve => setTimeout(resolve, 300));
      setNews(MOCK_NEWS);
    } catch (err: any) {
      console.error("Error fetching news:", err);
      setError(err?.message || "Erreur lors du chargement des actualités");
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return {
    news,
    loading,
    error,
    refetch: fetchNews,
  };
};
