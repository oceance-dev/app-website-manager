import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  View,
  Text,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FolderOpen, Users, BarChart3, FileText, Calendar, MapPin, Clock, Bell, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react-native';
import { initialDocuments, initialUtilisateurs } from '../data/mockData';
import { isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET, isLargeScreen } from '../utils/responsive';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { Header, StatCard, Card, Badge } from '../components/cadep';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Données mock pour les formations
  const upcomingTrainings = [
    {
      id: 1,
      title: 'Formation Initiale Cadets',
      startDate: '2026-02-16',
      endDate: '2026-02-27',
      period: 'Vacances d\'hiver',
      location: 'Centre de formation - Amiens',
      participants: 12,
      maxParticipants: 15,
      status: 'Inscriptions ouvertes',
      mandatory: true,
    },
    {
      id: 2,
      title: 'Stage de Perfectionnement',
      startDate: '2026-04-13',
      endDate: '2026-04-24',
      period: 'Vacances de printemps',
      location: 'Base nautique - Péronne',
      participants: 8,
      maxParticipants: 12,
      status: 'Inscriptions ouvertes',
      mandatory: true,
    },
    {
      id: 3,
      title: 'Préparation Brevet Navigation',
      startDate: '2026-07-06',
      endDate: '2026-07-17',
      period: 'Vacances d\'été',
      location: 'Centre de formation - Amiens',
      participants: 5,
      maxParticipants: 20,
      status: 'Bientôt disponible',
      mandatory: true,
    },
  ];

  // Données mock pour les actualités
  const news = [
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

  const stats = [
    {
      label: 'Documents',
      value: initialDocuments.length.toString(),
      icon: FolderOpen,
      color: colors.navy,
      backgroundColor: colors.gray[100],
      screen: 'Documents' as keyof RootStackParamList
    },
    {
      label: 'Membres',
      value: initialUtilisateurs.length.toString(),
      icon: Users,
      color: colors.success,
      backgroundColor: colors.successLight,
      screen: 'Dashboard' as keyof RootStackParamList
    },
    {
      label: 'Actifs',
      value: initialUtilisateurs.filter(u => u.statut === 'Actif').length.toString(),
      icon: BarChart3,
      color: colors.gold,
      backgroundColor: colors.goldLight + '40',
      screen: 'Dashboard' as keyof RootStackParamList
    },
    {
      label: 'Formations',
      value: upcomingTrainings.length.toString(),
      icon: Calendar,
      color: colors.warning,
      backgroundColor: colors.warningLight,
      screen: 'Dashboard' as keyof RootStackParamList
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Formation': return colors.navy;
      case 'Événement': return colors.success;
      case 'Information': return colors.gold;
      default: return colors.gray[600];
    }
  };

  // Fonctions pour le calendrier
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Ajouter les jours vides du début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  };

  const isDateInRange = (date: Date, startDate: string, endDate: string) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(startDate);
    const end = new Date(endDate);
    return d >= start && d <= end;
  };

  const getTrainingForDate = (date: Date) => {
    return upcomingTrainings.find(training =>
      isDateInRange(date, training.startDate, training.endDate)
    );
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newDate);
  };

  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const days = getDaysInMonth(currentMonth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.welcome}>Bienvenue sur CadetApp</Text>
        <Text style={styles.subtitle}>Association des Cadets de la Somme</Text>
      </View>

      {/* Calendrier des Formations Obligatoires */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Calendar color={colors.navy} size={24} />
          <Text style={styles.sectionTitle}>Calendrier des Formations</Text>
        </View>

        {/* Alerte formations obligatoires */}
        <View style={styles.mandatoryAlert}>
          <AlertCircle color={colors.error} size={20} />
          <Text style={styles.mandatoryText}>
            Les formations sont obligatoires pour tous les cadets
          </Text>
        </View>

        {/* Navigation du calendrier */}
        <View style={styles.calendarNav}>
          <TouchableOpacity onPress={() => changeMonth('prev')} style={styles.navButton}>
            <ChevronLeft color={colors.navy} size={24} />
          </TouchableOpacity>
          <Text style={styles.calendarMonth}>
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => changeMonth('next')} style={styles.navButton}>
            <ChevronRight color={colors.navy} size={24} />
          </TouchableOpacity>
        </View>

        {/* Jours de la semaine */}
        <View style={styles.calendarHeader}>
          {dayNames.map((day) => (
            <View key={day} style={styles.calendarHeaderDay}>
              <Text style={styles.calendarHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Grille du calendrier */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            const training = day ? getTrainingForDate(day) : null;
            const isToday = day &&
              day.getDate() === new Date().getDate() &&
              day.getMonth() === new Date().getMonth() &&
              day.getFullYear() === new Date().getFullYear();

            return (
              <View key={index} style={styles.calendarDay}>
                <TouchableOpacity
                  style={[
                    { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' },
                    isToday && styles.calendarDayToday,
                    training && !isToday && styles.calendarDayWithTraining,
                  ]}
                  disabled={!day || !training}
                >
                  {day && (
                    <>
                      <Text style={[
                        styles.calendarDayText,
                        isToday && styles.calendarDayTextToday,
                        training && !isToday && styles.calendarDayTextWithTraining,
                      ]}>
                        {day.getDate()}
                      </Text>
                      {training && (
                        <View style={styles.trainingDot} />
                      )}
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Légende */}
        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDot} />
            <Text style={styles.legendText}>Formation en cours</Text>
          </View>
        </View>

        {/* Liste des formations à venir */}
        <View style={styles.upcomingTrainings}>
          <Text style={styles.upcomingTitle}>Prochaines formations</Text>
          {upcomingTrainings.map((training) => (
            <TouchableOpacity key={training.id}>
              <View style={styles.upcomingCard}>
                <View style={styles.upcomingHeader}>
                  <Text style={styles.upcomingPeriod}>{training.period}</Text>
                  <Text style={styles.upcomingDates}>
                    {new Date(training.startDate).getDate()} - {new Date(training.endDate).getDate()} {monthNames[new Date(training.startDate).getMonth()]}
                  </Text>
                </View>
                <Text style={styles.upcomingTrainingTitle}>{training.title}</Text>
                <View style={styles.upcomingDetail}>
                  <MapPin color={colors.gray[600]} size={14} />
                  <Text style={styles.upcomingDetailText}>{training.location}</Text>
                </View>
                <View style={styles.upcomingDetail}>
                  <Users color={colors.gray[600]} size={14} />
                  <Text style={styles.upcomingDetailText}>
                    {training.participants}/{training.maxParticipants} inscrits
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Actualités */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Bell color={colors.navy} size={24} />
          <Text style={styles.sectionTitle}>Actualités</Text>
        </View>
        {news.map((item) => (
          <Card key={item.id} style={styles.newsCard}>
            <TouchableOpacity>
              <View style={styles.newsHeader}>
                <Badge
                  text={item.category}
                  variant={item.category === 'Formation' ? 'active' : item.category === 'Événement' ? 'success' : 'warning'}
                />
                {item.pinned && (
                  <View style={styles.pinnedBadge}>
                    <Text style={styles.pinnedText}>📌 Épinglé</Text>
                  </View>
                )}
              </View>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsContent} numberOfLines={2}>
                {item.content}
              </Text>
              <View style={styles.newsFooter}>
                <Text style={styles.newsAuthor}>Par {item.author}</Text>
                <Text style={styles.newsDate}>{formatDate(item.date)}</Text>
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </View>
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
  },
  header: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: getResponsivePadding(),
    marginBottom: spacing[4],
    ...shadows.md,
  },
  welcome: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[4],
    marginHorizontal: -spacing[1.5],
  },
  statCardItem: {
    width: isMobile ? '50%' : '25%',
    paddingHorizontal: spacing[1.5],
    marginBottom: spacing[3],
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: getResponsivePadding(),
    marginBottom: spacing[4],
    ...shadows.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.navy,
  },
  // Mandatory Alert
  mandatoryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[2],
    gap: spacing[2],
    borderLeftWidth: 2,
    borderLeftColor: colors.error,
  },
  mandatoryText: {
    fontSize: getFontSize(12),
    color: colors.error,
    fontWeight: '600',
    flex: 1,
  },
  // Calendar Navigation
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[1],
  },
  navButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.navyLight + '20',
  },
  calendarMonth: {
    ...textStyles.h4,
    color: colors.navy,
  },
  // Calendar Header
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: spacing[2],
  },
  calendarHeaderDay: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: spacing[1],
  },
  calendarHeaderText: {
    ...textStyles.label,
    color: colors.gray[600],
  },
  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing[3],
    gap: 0,
    height: 204,
  },
  calendarDay: {
    width: '14.28%',
    height: '16.66%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[1],
    position: 'relative',
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDayToday: {
    backgroundColor: colors.navyLight + '20',
    borderRadius: borderRadius.full,
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayWithTraining: {
    backgroundColor: colors.gold + '20',
    borderRadius: 0,
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: getFontSize(14),
    color: colors.navy,
    fontWeight: '500',
  },
  calendarDayTextToday: {
    color: colors.navy,
    fontWeight: 'bold',
  },
  calendarDayTextWithTraining: {
    color: colors.gold,
    fontWeight: 'bold',
  },
  trainingDot: {
    position: 'absolute',
    bottom: spacing[1],
    width: spacing[1],
    height: spacing[1],
    borderRadius: borderRadius.full,
    backgroundColor: colors.error,
  },
  // Calendar Legend
  calendarLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gold + '20',
  },
  legendText: {
    ...textStyles.caption,
    color: colors.gray[600],
  },
  // Upcoming Trainings List
  upcomingTrainings: {
    marginTop: spacing[3],
  },
  upcomingTitle: {
    ...textStyles.h3,
    color: colors.navy,
    marginBottom: spacing[2],
  },
  upcomingCard: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    marginBottom: spacing[3],
    borderLeftWidth: 2,
    borderLeftColor: colors.navy,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  upcomingPeriod: {
    ...textStyles.label,
    color: colors.navy,
    backgroundColor: colors.navyLight + '20',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  upcomingDates: {
    ...textStyles.label,
    color: colors.gray[600],
  },
  upcomingTrainingTitle: {
    ...textStyles.h4,
    color: colors.navy,
    marginBottom: spacing[2],
  },
  upcomingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  upcomingDetailText: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  // News Card Styles
  newsCard: {
    marginBottom: spacing[3],
    noPadding: false,
  },
  newsHeader: {
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
  },
  newsTitle: {
    ...textStyles.h4,
    color: colors.navy,
    marginBottom: spacing[2],
  },
  newsContent: {
    ...textStyles.body,
    color: colors.gray[600],
    lineHeight: 20,
    marginBottom: spacing[3],
  },
  newsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsAuthor: {
    ...textStyles.caption,
    color: colors.gray[600],
  },
  newsDate: {
    ...textStyles.caption,
    color: colors.gray[500],
  },
  // Action Button Styles
  actionButton: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: isMobile ? MIN_TOUCH_TARGET + 8 : 'auto',
  },
  actionText: {
    ...textStyles.h4,
    color: colors.navy,
    marginLeft: spacing[3],
  },
});