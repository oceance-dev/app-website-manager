import React from 'react';
import { View, Text, StyleSheet, TextStyle } from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors, textStyles, spacing, shadows, borderRadius } from '@/src/theme';
import { getResponsivePadding } from '@/src/utils/responsive';
import { NewsItem } from '../types';
import { NewsCard } from './NewsCard';
import { LoadingSpinner } from '@/src/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/src/components/ui/ErrorMessage';

interface NewsListProps {
  news: NewsItem[];
  loading?: boolean;
  error?: string | null;
  onNewsPress?: (item: NewsItem) => void;
  onRetry?: () => void;
}

export const NewsList = ({
  news,
  loading,
  error,
  onNewsPress,
  onRetry
}: NewsListProps) => {
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Bell color={colors.navy} size={24} />
          <Text style={styles.title}>Actualités</Text>
        </View>
        <LoadingSpinner />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Bell color={colors.navy} size={24} />
          <Text style={styles.title}>Actualités</Text>
        </View>
        <ErrorMessage message={error} onRetry={onRetry} />
      </View>
    );
  }

  if (news.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Bell color={colors.navy} size={24} />
          <Text style={styles.title}>Actualités</Text>
        </View>
        <Text style={styles.emptyText}>Aucune actualité disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bell color={colors.navy} size={24} />
        <Text style={styles.title}>Actualités</Text>
      </View>
      {news.map((item) => (
        <NewsCard key={item.id} item={item} onPress={onNewsPress} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: getResponsivePadding(),
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  title: {
    ...textStyles.h3,
    color: colors.navy,
  } as TextStyle,
  emptyText: {
    ...textStyles.body,
    color: colors.gray[500],
    textAlign: 'center',
    paddingVertical: spacing[4],
  } as TextStyle,
});
