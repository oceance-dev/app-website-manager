import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextStyle } from 'react-native';
import { Card, Badge } from '@/src/components/cadep';
import { colors, textStyles, spacing, borderRadius } from '@/src/theme';
import { NewsItem, getCategoryVariant } from '../types';
import { formatDateFr } from '../utils/dateUtils';

interface NewsCardProps {
  item: NewsItem;
  onPress?: (item: NewsItem) => void;
}

export const NewsCard = ({ item, onPress }: NewsCardProps) => {
  return (
    <Card style={styles.card}>
      <TouchableOpacity onPress={() => onPress?.(item)}>
        <View style={styles.header}>
          <Badge variant={getCategoryVariant(item.category)}>
            {item.category}
          </Badge>
          {item.pinned && (
            <View style={styles.pinnedBadge}>
              <Text style={styles.pinnedText}>📌 Épinglé</Text>
            </View>
          )}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.content} numberOfLines={2}>
          {item.content}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.author}>Par {item.author}</Text>
          <Text style={styles.date}>{formatDateFr(item.date)}</Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  pinnedBadge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.md,
  },
  pinnedText: {
    ...textStyles.caption,
    color: colors.warning,
    fontWeight: '600',
  } as TextStyle,
  title: {
    ...textStyles.h4,
    color: colors.navy,
    marginBottom: spacing[2],
  } as TextStyle,
  content: {
    ...textStyles.body,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing[3],
  } as TextStyle,
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    ...textStyles.caption,
    color: colors.gray[600],
  } as TextStyle,
  date: {
    ...textStyles.caption,
    color: colors.gray[500],
  } as TextStyle,
});
