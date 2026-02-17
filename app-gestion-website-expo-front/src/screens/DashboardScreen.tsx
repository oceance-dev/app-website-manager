import React, { useCallback } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { getResponsivePadding } from '../utils/responsive';
import { colors, spacing } from '../theme';
import { TrainingCalendar, Training } from '../components/cadep';
import {
  DashboardHeader,
  NewsList,
  useNews,
  useTrainings,
  NewsItem,
} from '../features/dashboard';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const { news, loading: newsLoading, error: newsError, refetch: refetchNews } = useNews();
  const { trainings, loading: trainingsLoading, error: trainingsError } = useTrainings();

  const handleTrainingPress = useCallback((training: Training) => {
    console.log('Training pressed:', training);
    // TODO: Navigation vers le détail de la formation
  }, []);

  const handleNewsPress = useCallback((item: NewsItem) => {
    console.log('News pressed:', item);
    // TODO: Navigation vers le détail de l'actualité
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <DashboardHeader
        title="Bienvenue sur CadetApp"
        subtitle="Association des Cadets de la Somme"
      />

      <TrainingCalendar
        trainings={trainings}
        onTrainingPress={handleTrainingPress}
      />

      <NewsList
        news={news}
        loading={newsLoading}
        error={newsError}
        onNewsPress={handleNewsPress}
        onRetry={refetchNews}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: getResponsivePadding(),
    gap: spacing[4],
  },
});
