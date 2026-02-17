import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, textStyles } from '../../../theme';
import { getFontSize } from '../../../utils/responsive';
import { Training, TrainingType } from './types';

const MONTH_NAMES_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'
];

const TYPE_CONFIG: Record<TrainingType, { label: string; color: string; backgroundColor: string }> = {
  formation: {
    label: 'Formation',
    color: colors.gold,
    backgroundColor: colors.goldLight || '#FEF3C7',
  },
  examen: {
    label: 'Examen',
    color: colors.info || '#3B82F6',
    backgroundColor: colors.infoLight || '#DBEAFE',
  },
};

interface TrainingItemProps {
  training: Training;
  onPress?: (training: Training) => void;
}

const formatDateRange = (startDate: string, endDate?: string): string => {
  const start = new Date(startDate);
  const startDay = start.getDate();
  const startMonth = MONTH_NAMES_SHORT[start.getMonth()];
  const startYear = start.getFullYear();

  if (!endDate) {
    return `${startDay} ${startMonth} ${startYear}`;
  }

  const end = new Date(endDate);
  const endDay = end.getDate();
  const endMonth = MONTH_NAMES_SHORT[end.getMonth()];
  const endYear = end.getFullYear();

  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  }

  return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
};

const TrainingItem = memo(({ training, onPress }: TrainingItemProps) => {
  const typeConfig = TYPE_CONFIG[training.type];
  const dateRange = useMemo(
    () => formatDateRange(training.startDate, training.endDate),
    [training.startDate, training.endDate]
  );

  const handlePress = () => {
    onPress?.(training);
  };

  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{training.title}</Text>
        <Text style={styles.itemDate}>{dateRange}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: typeConfig.backgroundColor }]}>
        <Text style={[styles.badgeText, { color: typeConfig.color }]}>
          {typeConfig.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

TrainingItem.displayName = 'TrainingItem';

interface TrainingListProps {
  trainings: Training[];
  onTrainingPress?: (training: Training) => void;
}

export const TrainingList = memo(({ trainings, onTrainingPress }: TrainingListProps) => {
  const sortedTrainings = useMemo(() => {
    return [...trainings].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [trainings]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prochaines formations</Text>
      <View style={styles.list}>
        {sortedTrainings.map((training) => (
          <TrainingItem
            key={training.id}
            training={training}
            onPress={onTrainingPress}
          />
        ))}
      </View>
    </View>
  );
});

TrainingList.displayName = 'TrainingList';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 280,
  },
  title: {
    ...textStyles.h4,
    color: colors.gray[700],
    fontWeight: '600',
    marginBottom: spacing[3],
  },
  list: {
    gap: spacing[3],
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  itemContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  itemTitle: {
    ...textStyles.body,
    color: colors.gray[800],
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  itemDate: {
    fontSize: getFontSize(13),
    color: colors.gray[500],
  },
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5] || spacing[2],
    borderRadius: borderRadius.full,
  },
  badgeText: {
    fontSize: getFontSize(12),
    fontWeight: '500',
  },
});
