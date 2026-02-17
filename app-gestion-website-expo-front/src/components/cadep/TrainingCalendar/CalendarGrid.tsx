import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors, spacing, borderRadius, textStyles } from '../../../theme';
import { getFontSize } from '../../../utils/responsive';

interface CalendarGridProps {
  monthLabel: string;
  dayNames: string[];
  days: (Date | null)[];
  isToday: (date: Date | null) => boolean;
  hasTrainingOnDate: (date: Date | null) => boolean;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const CalendarDay = memo(({
  date,
  isToday,
  hasTraining
}: {
  date: Date | null;
  isToday: boolean;
  hasTraining: boolean;
}) => {
  if (!date) {
    return <View style={styles.dayCell} />;
  }

  return (
    <View style={styles.dayCell}>
      <View style={[
        styles.dayContent,
        isToday && styles.todayContent,
      ]}>
        <Text style={[
          styles.dayText,
          isToday && styles.todayText,
          !isToday && hasTraining && styles.trainingDayText,
        ]}>
          {date.getDate()}
        </Text>
      </View>
    </View>
  );
});

CalendarDay.displayName = 'CalendarDay';

export const CalendarGrid = memo(({
  monthLabel,
  dayNames,
  days,
  isToday,
  hasTrainingOnDate,
  onPreviousMonth,
  onNextMonth,
}: CalendarGridProps) => {
  return (
    <View style={styles.container}>
      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={onPreviousMonth}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft color={colors.gray[400]} size={20} />
        </TouchableOpacity>

        <Text style={styles.monthLabel}>{monthLabel}</Text>

        <TouchableOpacity
          onPress={onNextMonth}
          style={styles.navButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronRight color={colors.gray[400]} size={20} />
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={styles.weekDays}>
        {dayNames.map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={styles.weekDayText}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Grille des jours */}
      <View style={styles.daysGrid}>
        {days.map((date, index) => (
          <CalendarDay
            key={index}
            date={date}
            isToday={isToday(date)}
            hasTraining={hasTrainingOnDate(date)}
          />
        ))}
      </View>
    </View>
  );
});

CalendarGrid.displayName = 'CalendarGrid';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 280,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
    paddingHorizontal: spacing[2],
  },
  navButton: {
    padding: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  monthLabel: {
    ...textStyles.body,
    color: colors.gray[700],
    fontWeight: '500',
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  weekDayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  weekDayText: {
    fontSize: getFontSize(12),
    color: colors.gray[400],
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  dayContent: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
  },
  todayContent: {
    backgroundColor: colors.navy,
  },
  dayText: {
    fontSize: getFontSize(14),
    color: colors.gray[700],
    fontWeight: '400',
  },
  todayText: {
    color: colors.white,
    fontWeight: '600',
  },
  trainingDayText: {
    color: colors.gold,
    fontWeight: '600',
  },
});
