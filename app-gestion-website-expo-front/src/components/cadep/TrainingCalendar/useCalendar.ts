import { useState, useMemo, useCallback } from 'react';
import { Training } from './types';

const MONTH_NAMES = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

const DAY_NAMES = ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'];

export const useCalendar = (trainings: Training[]) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthLabel = useMemo(() => {
    const month = MONTH_NAMES[currentDate.getMonth()];
    const year = currentDate.getFullYear();
    return `${month} ${year}`;
  }, [currentDate]);

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Ajuster pour commencer par lundi (0 = lundi, 6 = dimanche)
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    const result: (Date | null)[] = [];

    // Jours vides du début
    for (let i = 0; i < startingDay; i++) {
      result.push(null);
    }

    // Jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      result.push(new Date(year, month, day));
    }

    return result;
  }, [currentDate]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const isToday = useCallback((date: Date | null): boolean => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }, []);

  const isDateInTrainingRange = useCallback((date: Date | null, training: Training): boolean => {
    if (!date) return false;
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(training.startDate);
    const end = training.endDate ? new Date(training.endDate) : start;
    return d >= start && d <= end;
  }, []);

  const hasTrainingOnDate = useCallback((date: Date | null): boolean => {
    if (!date) return false;
    return trainings.some(training => isDateInTrainingRange(date, training));
  }, [trainings, isDateInTrainingRange]);

  return {
    monthLabel,
    dayNames: DAY_NAMES,
    days,
    goToPreviousMonth,
    goToNextMonth,
    isToday,
    hasTrainingOnDate,
  };
};
