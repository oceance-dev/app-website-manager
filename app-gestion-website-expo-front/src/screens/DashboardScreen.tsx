import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { FolderOpen, Users, BarChart3, FileText } from 'lucide-react-native';
import { initialDocuments, initialUtilisateurs } from '../data/mockData';
import { isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET, isLargeScreen } from '../utils/responsive';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardScreenNavigationProp;
}

export default function DashboardScreen({ navigation }: Props) {
  const stats = [
    { 
      label: 'Documents', 
      value: initialDocuments.length.toString(), 
      icon: FolderOpen, 
      color: '#3b82f6', 
      screen: 'Documents' as keyof RootStackParamList 
    },
    {
      label: 'Utilisateurs',
      value: initialUtilisateurs.length.toString(),
      icon: Users,
      color: '#10b981',
      screen: 'Dashboard' as keyof RootStackParamList
    },
    {
      label: 'Actifs',
      value: initialUtilisateurs.filter(u => u.statut === 'Actif').length.toString(),
      icon: BarChart3,
      color: '#8b5cf6',
      screen: 'Dashboard' as keyof RootStackParamList
    },
    { 
      label: 'Stockage', 
      value: '8.7 GB', 
      icon: FileText, 
      color: '#f59e0b', 
      screen: 'Documents' as keyof RootStackParamList 
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.content}>
          <Text style={styles.welcome}>Bienvenue sur MonApp</Text>
          <Text style={styles.subtitle}>Votre espace de gestion</Text>

        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.statCard, { borderLeftColor: stat.color }]}
              onPress={() => navigation.navigate(stat.screen)}
            >
              <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                <stat.icon color={stat.color} size={24} />
              </View>
              <View style={styles.statInfo}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Documents')}
          >
            <FolderOpen color="#2563eb" size={20} />
            <Text style={styles.actionText}>Gérer les documents</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Users color="#2563eb" size={20} />
            <Text style={styles.actionText}>Gérer les paramètres</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <FileText color="#3b82f6" size={16} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Nouveau document ajouté</Text>
              <Text style={styles.activityTime}>Il y a 2 heures</Text>
            </View>
          </View>
          <View style={styles.activityCard}>
            <View style={styles.activityIcon}>
              <Users color="#10b981" size={16} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>Nouvel utilisateur inscrit</Text>
              <Text style={styles.activityTime}>Il y a 5 heures</Text>
            </View>
          </View>
        </View>
      </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: getResponsivePadding(),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  content: {
    padding: getResponsivePadding(),
  },
  welcome: {
    fontSize: getFontSize(isMobile ? 24 : 28),
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: getFontSize(isMobile ? 14 : 16),
    color: '#64748b',
    marginBottom: 24,
  },
  statsGrid: {
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: getSpacing(16),
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: isMobile ? MIN_TOUCH_TARGET + 20 : 'auto',
  },
  iconContainer: {
    width: isMobile ? 44 : 48,
    height: isMobile ? 44 : 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: getSpacing(16),
  },
  statInfo: {
    flex: 1,
  },
  statLabel: {
    fontSize: getFontSize(14),
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: getFontSize(isMobile ? 20 : 24),
    fontWeight: 'bold',
    color: '#1e293b',
  },
  quickActions: {
    marginTop: 8,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: getFontSize(isMobile ? 18 : 20),
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: getSpacing(16),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: isMobile ? MIN_TOUCH_TARGET + 8 : 'auto',
  },
  actionText: {
    fontSize: getFontSize(16),
    color: '#1e293b',
    marginLeft: 12,
    fontWeight: '600',
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: getSpacing(16),
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: getFontSize(14),
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: getFontSize(12),
    color: '#64748b',
  },
});