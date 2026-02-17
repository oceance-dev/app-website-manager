import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows, textStyles } from '../../../theme';
import { isLargeScreen, getResponsivePadding } from '../../../utils/responsive';
import { CalendarGrid } from './CalendarGrid';
import { TrainingList } from './TrainingList';
import { useCalendar } from './useCalendar';
import { TrainingCalendarProps } from './types';

export const TrainingCalendar = memo(({
  trainings,
  onTrainingPress,
}: TrainingCalendarProps) => {
  const {
    monthLabel,
    dayNames,
    days,
    goToPreviousMonth,
    goToNextMonth,
    isToday,
    hasTrainingOnDate,
  } = useCalendar(trainings);

  const isWideLayout = isLargeScreen;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Calendar color={colors.gold} size={24} />
        <Text style={styles.headerTitle}>Calendrier des formations</Text>
      </View>

      {/* Content */}
      <View style={[
        styles.content,
        isWideLayout && styles.contentWide,
      ]}>
        <View style={[
          styles.calendarSection,
          isWideLayout && styles.calendarSectionWide,
        ]}>
          <CalendarGrid
            monthLabel={monthLabel}
            dayNames={dayNames}
            days={days}
            isToday={isToday}
            hasTrainingOnDate={hasTrainingOnDate}
            onPreviousMonth={goToPreviousMonth}
            onNextMonth={goToNextMonth}
          />
        </View>

        {isWideLayout && <View style={styles.divider} />}

        <View style={[
          styles.listSection,
          isWideLayout && styles.listSectionWide,
        ]}>
          <TrainingList
            trainings={trainings}
            onTrainingPress={onTrainingPress}
          />
        </View>
      </View>
    </View>
  );
});

TrainingCalendar.displayName = 'TrainingCalendar';

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
    gap: spacing[2],
    marginBottom: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.gray[800],
    fontWeight: '600',
  },
  content: {
    flexDirection: 'column',
    gap: spacing[4],
  },
  contentWide: {
    flexDirection: 'row',
  },
  calendarSection: {
    flex: 1,
  },
  calendarSectionWide: {
    flex: 1,
    paddingRight: spacing[4],
  },
  divider: {
    width: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing[2],
  },
  listSection: {
    flex: 1,
  },
  listSectionWide: {
    flex: 1,
    paddingLeft: spacing[4],
  },
});

export default TrainingCalendar;
