import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { UsersApi, UserResponse } from '../api/users.api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Check, X, Clock, Mail, Phone, MapPin } from 'lucide-react-native';
import { isMobile, getFontSize, getSpacing, getResponsivePadding, MIN_TOUCH_TARGET } from '../utils/responsive';

export default function PendingMembersScreen() {
  const [pendingUsers, setPendingUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingUsers = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('No access token found');
        return;
      }

      const response = await UsersApi.getPending(accessToken);
      if (response.success && response.data) {
        setPendingUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error loading pending users:', error);
      Alert.alert('Erreur', 'Impossible de charger les demandes en attente');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingUsers();
  };

  const handleApprove = async (userId: number, userName: string) => {
    Alert.alert(
      'Approuver le membre',
      `Voulez-vous approuver ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            try {
              const accessToken = await AsyncStorage.getItem('accessToken');
              if (!accessToken) return;

              const response = await UsersApi.approve(userId, accessToken);
              if (response.success) {
                Alert.alert('Succès', 'Membre approuvé avec succès');
                loadPendingUsers(); // Recharger la liste
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible d\'approuver le membre');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (userId: number, userName: string) => {
    Alert.prompt(
      'Rejeter le membre',
      `Pourquoi refusez-vous ${userName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              const accessToken = await AsyncStorage.getItem('accessToken');
              if (!accessToken) return;

              const response = await UsersApi.reject(
                userId,
                reason || 'Demande refusée',
                accessToken
              );
              if (response.success) {
                Alert.alert('Succès', 'Membre rejeté');
                loadPendingUsers(); // Recharger la liste
              }
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de rejeter le membre');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Demandes en attente</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingUsers.length}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Clock color="#94a3b8" size={48} />
            <Text style={styles.emptyText}>Aucune demande en attente</Text>
            <Text style={styles.emptySubtext}>
              Les nouvelles demandes d'inscription apparaîtront ici
            </Text>
          </View>
        ) : (
          pendingUsers.map((user) => (
            <View key={user.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.userName}>
                    {user.firstName} {user.lastName}
                  </Text>
                  <Text style={styles.userRole}>{user.role}</Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Clock color="#f59e0b" size={16} />
                  <Text style={styles.pendingText}>En attente</Text>
                </View>
              </View>

              <View style={styles.userInfo}>
                <View style={styles.infoRow}>
                  <Mail color="#64748b" size={16} />
                  <Text style={styles.infoText}>{user.email}</Text>
                </View>
                {user.phone && (
                  <View style={styles.infoRow}>
                    <Phone color="#64748b" size={16} />
                    <Text style={styles.infoText}>{user.phone}</Text>
                  </View>
                )}
                {user.city_code && (
                  <View style={styles.infoRow}>
                    <MapPin color="#64748b" size={16} />
                    <Text style={styles.infoText}>Code postal: {user.city_code}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date d'inscription:</Text>
                  <Text style={styles.infoText}>
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(user.id, `${user.firstName} ${user.lastName}`)}
                >
                  <X color="#fff" size={20} />
                  <Text style={styles.rejectButtonText}>Rejeter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(user.id, `${user.firstName} ${user.lastName}`)}
                >
                  <Check color="#fff" size={20} />
                  <Text style={styles.approveButtonText}>Approuver</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getResponsivePadding(),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: getFontSize(isMobile ? 20 : 24),
    fontWeight: 'bold',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: getFontSize(16),
    color: '#64748b',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(40),
    marginTop: 100,
  },
  emptyText: {
    fontSize: getFontSize(18),
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: getFontSize(14),
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    margin: getResponsivePadding(),
    marginBottom: 0,
    borderRadius: 12,
    padding: getSpacing(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userName: {
    fontSize: getFontSize(18),
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userRole: {
    fontSize: getFontSize(14),
    color: '#64748b',
    marginTop: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  userInfo: {
    gap: 12,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: getFontSize(14),
    color: '#64748b',
    fontWeight: '500',
  },
  infoText: {
    fontSize: getFontSize(14),
    color: '#475569',
  },
  actions: {
    flexDirection: isMobile ? 'column' : 'row',
    gap: 12,
    marginTop: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: isMobile ? 14 : 12,
    borderRadius: 8,
    gap: 8,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  rejectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: getFontSize(16),
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: isMobile ? 14 : 12,
    borderRadius: 8,
    gap: 8,
    minHeight: isMobile ? MIN_TOUCH_TARGET : 'auto',
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: getFontSize(16),
  },
});
