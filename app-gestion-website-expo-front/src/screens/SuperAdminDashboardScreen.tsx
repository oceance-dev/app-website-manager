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
import { Users, Building2, CheckCircle, Clock, XCircle, TrendingUp, ThumbsUp, ThumbsDown, Pause, Play, Shield } from 'lucide-react-native';
import { isWeb, isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET } from '../utils/responsive';
import { AssociationsApi, AssociationWithStats, ApiError, UsersApi, UserResponse } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/ui/button';
import RoleManagement from '../components/RoleManagement';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { StatCard, Card, Badge } from '../components/cadep';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'associations' | 'users' | 'roles'>('overview');
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
    loadData();
  }, []);

  const loadData = async () => {
    await loadAssociations();
    await loadUsers();
  };

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAssociations();
    await loadUsers();
  };

  const handleApprove = async (id: number) => {
    try {
      await AssociationsApi.approve(id);

      if (isWeb) {
        alert('Association approuvée avec succès');
      } else {
        Alert.alert('Succès', 'Association approuvée');
      }

      await loadAssociations();
      await loadUsers();
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

      await loadAssociations();
      await loadUsers();
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

      await loadAssociations();
      await loadUsers();
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

      await loadAssociations();
      await loadUsers();
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
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'rejected':
        return colors.error;
      case 'suspended':
        return colors.warning;
      default:
        return colors.gray[600];
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
      case 'suspended':
        return 'Suspendue';
      default:
        return status;
    }
  };

  const paddingTop = isWeb ? 0 : Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 0) + 20;

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', paddingTop }]}>
        <ActivityIndicator size="large" color={colors.navy} />
        <Text style={{ marginTop: spacing[4], color: colors.gray[600] }}>Chargement...</Text>
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
          <TrendingUp size={20} color={activeTab === 'overview' ? colors.navy : colors.gray[600]} />
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>Vue d'ensemble</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'associations' && styles.tabActive]}
          onPress={() => setActiveTab('associations')}
        >
          <Building2 size={20} color={activeTab === 'associations' ? colors.navy : colors.gray[600]} />
          <Text style={[styles.tabText, activeTab === 'associations' && styles.tabTextActive]}>Associations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.tabActive]}
          onPress={() => setActiveTab('users')}
        >
          <Users size={20} color={activeTab === 'users' ? colors.navy : colors.gray[600]} />
          <Text style={[styles.tabText, activeTab === 'users' && styles.tabTextActive]}>Utilisateurs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'roles' && styles.tabActive]}
          onPress={() => setActiveTab('roles')}
        >
          <Shield size={20} color={activeTab === 'roles' ? colors.navy : colors.gray[600]} />
          <Text style={[styles.tabText, activeTab === 'roles' && styles.tabTextActive]}>Rôles</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'overview' && (
        <View style={styles.content}>
          {/* Section Associations */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Building2 size={20} color={colors.navy} />
              <Text style={styles.sectionTitle}>Associations</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total"
                value={stats.totalAssociations.toString()}
                icon={Building2}
                iconColor={colors.navy}
                iconBackground={colors.navyLight + '20'}
                style={styles.statCardItem}
              />
              <StatCard
                title="Actives"
                value={stats.activeAssociations.toString()}
                icon={CheckCircle}
                iconColor={colors.success}
                iconBackground={colors.successLight}
                style={styles.statCardItem}
              />
              <StatCard
                title="En attente"
                value={stats.pendingAssociations.toString()}
                icon={Clock}
                iconColor={colors.warning}
                iconBackground={colors.warningLight}
                style={styles.statCardItem}
              />
              <StatCard
                title="Rejetées/Suspendues"
                value={stats.rejectedAssociations.toString()}
                icon={XCircle}
                iconColor={colors.error}
                iconBackground={colors.errorLight}
                style={styles.statCardItem}
              />
            </View>
          </View>

          {/* Section Utilisateurs */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color={colors.navy} />
              <Text style={styles.sectionTitle}>Utilisateurs</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total"
                value={stats.totalUsers.toString()}
                icon={Users}
                iconColor={colors.navy}
                iconBackground={colors.navyLight + '20'}
                style={styles.statCardItem}
              />
              <StatCard
                title="Actifs"
                value={stats.activeUsers.toString()}
                icon={CheckCircle}
                iconColor={colors.success}
                iconBackground={colors.successLight}
                style={styles.statCardItem}
              />
              <StatCard
                title="Inactifs"
                value={(stats.totalUsers - stats.activeUsers).toString()}
                icon={Users}
                iconColor={colors.gray[600]}
                iconBackground={colors.gray[100]}
                style={styles.statCardItem}
              />
              <StatCard
                title="En attente"
                value={users.filter(u => !u.isActive).length.toString()}
                icon={Clock}
                iconColor={colors.warning}
                iconBackground={colors.warningLight}
                style={styles.statCardItem}
              />
            </View>
          </View>

          {/* Recent Activity */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité récente</Text>
            <Card>
              <Text style={styles.emptyText}>Aucune activité récente</Text>
            </Card>
          </View>
        </View>
      )}

      {activeTab === 'associations' && (
        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Toutes les associations ({associations.length})</Text>
            {associations.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>Aucune association</Text>
              </Card>
            ) : (
              associations.map((association) => (
                <Card key={association.id} style={styles.cardItem}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Building2 size={20} color={colors.navy} />
                      <Text style={styles.cardTitle}>{association.name}</Text>
                    </View>
                    <Badge
                      text={getStatusText(association.status)}
                      variant={
                        association.status === 'active' ? 'active' :
                        association.status === 'pending' ? 'pending' :
                        'inactive'
                      }
                    />
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
                          style={[styles.actionButton, { backgroundColor: colors.successLight }]}
                          onPress={() => handleApprove(association.id)}
                        >
                          <ThumbsUp size={16} color={colors.success} />
                          <Text style={[styles.actionButtonText, { color: colors.success }]}>Approuver</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, { backgroundColor: colors.errorLight }]}
                          onPress={() => handleReject(association.id)}
                        >
                          <ThumbsDown size={16} color={colors.error} />
                          <Text style={[styles.actionButtonText, { color: colors.error }]}>Rejeter</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {association.status === 'active' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.warningLight }]}
                        onPress={() => handleSuspend(association.id)}
                      >
                        <Pause size={16} color={colors.warning} />
                        <Text style={[styles.actionButtonText, { color: colors.warning }]}>Suspendre</Text>
                      </TouchableOpacity>
                    )}
                    {association.status === 'suspended' && (
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: colors.successLight }]}
                        onPress={() => handleReactivate(association.id)}
                      >
                        <Play size={16} color={colors.success} />
                        <Text style={[styles.actionButtonText, { color: colors.success }]}>Réactiver</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </Card>
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
              <Card key={user.id} style={styles.cardItem}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Users size={20} color={colors.navy} />
                    <Text style={styles.cardTitle}>{user.firstname} {user.lastname}</Text>
                  </View>
                  <Badge
                    text={user.isActive ? 'Actif' : 'Inactif'}
                    variant={user.isActive ? 'active' : 'inactive'}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardDetail}>✉️ {user.email}</Text>
                  <Text style={styles.cardDetail}>👤 {user.role}</Text>
                  <Text style={styles.cardDetail}>🏢 {user.associationName}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'roles' && (
        <RoleManagement />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: getResponsivePadding(),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: isMobile ? spacing[2] : spacing[5],
    flexWrap: isMobile ? 'wrap' : 'nowrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isMobile ? spacing[3] : spacing[4],
    paddingHorizontal: isMobile ? spacing[3] : spacing[4],
    marginRight: isMobile ? spacing[1] : spacing[2],
    gap: spacing[2],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  tabActive: {
    borderBottomColor: colors.navy,
  },
  tabText: {
    ...textStyles.body,
    color: colors.gray[600],
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.navy,
    fontWeight: '600',
  },
  content: {
    padding: getResponsivePadding(),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  statCardItem: {
    flex: 1,
    minWidth: isWeb ? 150 : '45%',
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.navy,
  },
  cardItem: {
    marginBottom: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },
  cardTitle: {
    ...textStyles.h4,
    color: colors.navy,
  },
  cardContent: {
    gap: spacing[2],
  },
  cardDetail: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  emptyText: {
    textAlign: 'center',
    color: colors.gray[600],
    padding: spacing[5],
  },
  actionButtons: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: spacing[2],
    marginTop: spacing[3],
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: isMobile ? spacing[3] : spacing[2],
    borderRadius: borderRadius.md,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  actionButtonText: {
    ...textStyles.label,
    fontWeight: '600',
  },
});
