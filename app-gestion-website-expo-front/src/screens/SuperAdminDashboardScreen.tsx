import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Users, Building2, CheckCircle, Clock, XCircle, TrendingUp, ThumbsUp, ThumbsDown, Pause, Play } from 'lucide-react-native';
import { isWeb, isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET } from '../utils/responsive';
import { AssociationsApi, AssociationWithStats, ApiError, UsersApi, UserResponse } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/ui/button';

interface Stats {
  totalAssociations: number;
  activeAssociations: number;
  pendingAssociations: number;
  rejectedAssociations: number;
  totalUsers: number;
  activeUsers: number;
}

interface Association {
  id: number;
  name: string;
  city: string;
  status: 'active' | 'pending' | 'rejected';
  createdAt: string;
  usersCount: number;
}

interface UserDisplay {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  associationName: string;
  isActive: boolean;
}

export default function SuperAdminDashboardScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'associations' | 'users'>('overview');
  const [associations, setAssociations] = useState<AssociationWithStats[]>([]);
  const [users, setUsers] = useState<UserDisplay[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalAssociations: 0,
    activeAssociations: 0,
    pendingAssociations: 0,
    rejectedAssociations: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAssociations();
    loadUsers();
  }, []);

  const loadAssociations = async () => {
    try {
      const response = await AssociationsApi.getAll();

      if (response.success && response.data) {
        setAssociations(response.data.associations);

        // Calculer les statistiques des associations
        const totalAssociations = response.data.total;
        const activeAssociations = response.data.associations.filter(a => a.status === 'active').length;
        const pendingAssociations = response.data.associations.filter(a => a.status === 'pending').length;
        const rejectedAssociations = response.data.associations.filter(a => a.status === 'rejected').length;
        const suspendedAssociations = response.data.associations.filter(a => a.status === 'suspended').length;

        setStats(prevStats => ({
          ...prevStats,
          totalAssociations,
          activeAssociations,
          pendingAssociations,
          rejectedAssociations: rejectedAssociations + suspendedAssociations,
        }));
      }
    } catch (error) {
      console.error('Error loading associations:', error);
      if (isWeb) {
        alert('Erreur lors du chargement des associations');
      } else {
        Alert.alert('Erreur', 'Impossible de charger les associations');
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await UsersApi.getAll();

      if (response.success && response.data) {
        // Mapper les utilisateurs avec les noms d'association
        const usersWithAssociation: UserDisplay[] = response.data.users.map((user) => {
          const association = associations.find(a => a.id === user.associationId);
          return {
            id: user.id,
            firstname: user.firstName,
            lastname: user.lastName,
            email: user.email,
            role: user.role?.displayName || user.role?.name || 'N/A',
            associationName: association?.name || 'N/A',
            isActive: user.isActive,
          };
        });

        setUsers(usersWithAssociation);

        // Mettre à jour les statistiques des utilisateurs
        const totalUsers = response.data.total || response.data.users.length;
        const activeUsers = response.data.users.filter(u => u.isActive).length;

        setStats(prevStats => ({
          ...prevStats,
          totalUsers,
          activeUsers,
        }));
      }
    } catch (error) {
      console.error('Error loading users:', error);
      if (isWeb) {
        alert('Erreur lors du chargement des utilisateurs');
      } else {
        Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAssociations();
    loadUsers();
  };

  const handleApprove = async (id: number) => {
    try {
      await AssociationsApi.approve(id);

      if (isWeb) {
        alert('Association approuvée avec succès');
      } else {
        Alert.alert('Succès', 'Association approuvée');
      }

      loadAssociations();
    } catch (error) {
      console.error('Error approving association:', error);
      const message = error instanceof ApiError ? error.message : 'Erreur lors de l\'approbation';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  const handleReject = async (id: number) => {
    try {
      await AssociationsApi.reject(id, 'Demande rejetée par l\'administrateur');

      if (isWeb) {
        alert('Association rejetée');
      } else {
        Alert.alert('Succès', 'Association rejetée');
      }

      loadAssociations();
    } catch (error) {
      console.error('Error rejecting association:', error);
      const message = error instanceof ApiError ? error.message : 'Erreur lors du rejet';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  const handleSuspend = async (id: number) => {
    try {
      await AssociationsApi.suspend(id, 'Association suspendue');

      if (isWeb) {
        alert('Association suspendue');
      } else {
        Alert.alert('Succès', 'Association suspendue');
      }

      loadAssociations();
    } catch (error) {
      console.error('Error suspending association:', error);
      const message = error instanceof ApiError ? error.message : 'Erreur lors de la suspension';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await AssociationsApi.reactivate(id);

      if (isWeb) {
        alert('Association réactivée');
      } else {
        Alert.alert('Succès', 'Association réactivée');
      }

      loadAssociations();
    } catch (error) {
      console.error('Error reactivating association:', error);
      const message = error instanceof ApiError ? error.message : 'Erreur lors de la réactivation';
      if (isWeb) {
        alert(message);
      } else {
        Alert.alert('Erreur', message);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'rejected':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  const paddingTop = isWeb ? 0 : Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 20;

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingTop }]}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 16, color: '#64748b' }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard Super Admin</Text>
        <Text style={styles.subtitle}>Vue d'ensemble de la plateforme</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
          onPress={() => setActiveTab('overview')}
        >
          <TrendingUp size={20} color={activeTab === 'overview' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Vue d'ensemble</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'associations' && styles.tabActive]}
          onPress={() => setActiveTab('associations')}
        >
          <Building2 size={20} color={activeTab === 'associations' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'associations' && styles.tabTextActive]}>Associations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Users size={20} color={activeTab === 'users' ? '#2563eb' : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Utilisateurs</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'overview' && (
        <View style={styles.content}>
          {/* Section Associations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Building2 size={20} color="#2563eb" />
              <Text style={styles.sectionTitle}>Associations</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Building2 size={24} color="#2563eb" />
                </View>
                <Text style={styles.statValue}>{stats.totalAssociations}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <CheckCircle size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{stats.activeAssociations}</Text>
                <Text style={styles.statLabel}>Actives</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Clock size={24} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>{stats.pendingAssociations}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#fee2e2' }]}>
                  <XCircle size={24} color="#ef4444" />
                </View>
                <Text style={styles.statValue}>{stats.rejectedAssociations}</Text>
                <Text style={styles.statLabel}>Rejetées/Suspendues</Text>
              </View>
            </View>
          </View>

          {/* Section Utilisateurs */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#2563eb" />
              <Text style={styles.sectionTitle}>Utilisateurs</Text>
            </View>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dbeafe' }]}>
                  <Users size={24} color="#2563eb" />
                </View>
                <Text style={styles.statValue}>{stats.totalUsers}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#dcfce7' }]}>
                  <CheckCircle size={24} color="#10b981" />
                </View>
                <Text style={styles.statValue}>{stats.activeUsers}</Text>
                <Text style={styles.statLabel}>Actifs</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#e0e7ff' }]}>
                  <Users size={24} color="#6366f1" />
                </View>
                <Text style={styles.statValue}>{stats.totalUsers - stats.activeUsers}</Text>
                <Text style={styles.statLabel}>Inactifs</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#fef3c7' }]}>
                  <Clock size={24} color="#f59e0b" />
                </View>
                <Text style={styles.statValue}>{users.filter(u => !u.isActive).length}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <View style={styles.card}>
              <Text style={styles.emptyText}>Aucune activité récente</Text>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'associations' && (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Toutes les associations ({associations.length})</Text>
            {associations.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Aucune association</Text>
              </View>
            ) : (
              associations.map((association) => (
                <View key={association.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Building2 size={20} color="#2563eb" />
                      <Text style={styles.cardTitle}>{association.name}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusColor(association.status) + '20' }]}>
                      <Text style={[styles.badgeText, { color: getStatusColor(association.status) }]}>
                        {getStatusText(association.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardDetail}>📍 {association.city} ({association.postalCode})</Text>
                    {association.siret && <Text style={styles.cardDetail}>🏢 SIRET: {association.siret}</Text>}
                    {association.rna && <Text style={styles.cardDetail}>📋 RNA: {association.rna}</Text>}
                    <Text style={styles.cardDetail}>👥 {association.usersCount || 0} utilisateurs</Text>
                    <Text style={styles.cardDetail}>📅 Créée le {new Date(association.createdAt).toLocaleDateString('fr-FR')}</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtons}>
                    {association.status === 'pending' && (
                      <>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#dcfce7' }]}
                          onPress={() => handleApprove(association.id)}
                        >
                          <ThumbsUp size={16} color="#10b981" />
                          <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Approuver</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
                          onPress={() => handleReject(association.id)}
                        >
                          <ThumbsDown size={16} color="#ef4444" />
                          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Rejeter</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {association.status === 'active' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#fef3c7' }]}
                        onPress={() => handleSuspend(association.id)}
                      >
                        <Pause size={16} color="#f59e0b" />
                        <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Suspendre</Text>
                      </TouchableOpacity>
                    )}
                    {association.status === 'suspended' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#dcfce7' }]}
                        onPress={() => handleReactivate(association.id)}
                      >
                        <Play size={16} color="#10b981" />
                        <Text style={[styles.actionButtonText, { color: '#10b981' }]}>Réactiver</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {activeTab === 'users' && (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tous les utilisateurs ({users.length})</Text>
            {users.map((user) => (
              <View key={user.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Users size={20} color="#2563eb" />
                    <Text style={styles.cardTitle}>{user.firstname} {user.lastname}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: user.isActive ? '#dcfce7' : '#fee2e2' }]}>
                    <Text style={[styles.badgeText, { color: user.isActive ? '#10b981' : '#ef4444' }]}>
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardDetail}>✉️ {user.email}</Text>
                  <Text style={styles.cardDetail}>👤 {user.role}</Text>
                  <Text style={styles.cardDetail}>🏢 {user.associationName}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: getResponsivePadding(),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: getFontSize(isMobile ? 20 : 24),
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: getFontSize(isMobile ? 12 : 14),
    color: '#64748b',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: isMobile ? 8 : 20,
    flexWrap: isMobile ? 'wrap' : 'nowrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isMobile ? 12 : 16,
    paddingHorizontal: isMobile ? 12 : 16,
    marginRight: isMobile ? 4 : 8,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: getFontSize(isMobile ? 12 : 14),
    color: '#64748b',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  content: {
    padding: getResponsivePadding(),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: getSpacing(16),
    flex: 1,
    minWidth: isWeb ? 150 : '45%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: isMobile ? 120 : 'auto',
  },
  statIcon: {
    width: isMobile ? 40 : 48,
    height: isMobile ? 40 : 48,
    borderRadius: isMobile ? 20 : 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: getFontSize(isMobile ? 24 : 32),
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: getFontSize(12),
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: getFontSize(isMobile ? 16 : 18),
    fontWeight: '600',
    color: '#1e293b',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: getSpacing(16),
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    color: '#1e293b',
  },
  cardContent: {
    gap: 8,
  },
  cardDetail: {
    fontSize: getFontSize(14),
    color: '#64748b',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    padding: 20,
  },
  actionButtons: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: getSpacing(12),
    paddingVertical: isMobile ? 12 : 8,
    borderRadius: 8,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  actionButtonText: {
    fontSize: getFontSize(isMobile ? 14 : 12),
    fontWeight: '600',
  },
});
