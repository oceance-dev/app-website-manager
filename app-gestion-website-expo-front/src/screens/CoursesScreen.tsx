import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Document, User } from '../types';
import { FileText, Download, Lock } from 'lucide-react-native';
import { courseDocuments } from '../data/mockData';

type CoursesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Courses'>;

interface Props {
  navigation: CoursesScreenNavigationProp;
  route: {
    params?: {
      currentUser?: User;
    };
  };
}

export default function CoursesScreen({ navigation, route }: Props) {
  const currentUser = route.params?.currentUser;

  // Filtrer les documents selon les permissions de l'utilisateur
  const accessibleDocuments = currentUser
    ? courseDocuments.filter(doc => {
        // Les formateurs et admins voient tous les documents
        if (currentUser.role === 'Admin' || currentUser.role === 'Encadrant') {
          return true;
        }
        // Les autres utilisateurs ne voient que les documents auxquels ils ont accès
        return doc.permissions?.some(p => p.userId === currentUser.id && p.canAccess);
      })
    : [];

  const lockedDocuments = currentUser && (currentUser.role === 'Cadet' || currentUser.role === 'Cadet Breveté')
    ? courseDocuments.filter(doc => {
        return !doc.permissions?.some(p => p.userId === currentUser.id && p.canAccess);
      })
    : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents de Cours</Text>
        <Text style={styles.subtitle}>
          {currentUser?.role === 'Admin' || currentUser?.role === 'Encadrant'
            ? 'Tous les documents de cours'
            : 'Documents accessibles'}
        </Text>
      </View>

      {accessibleDocuments.length > 0 ? (
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documents disponibles</Text>
          {accessibleDocuments.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentCard}
              onPress={() => {
                // TODO: Open document
                console.log('Open document:', doc.id);
              }}
            >
              <View style={styles.documentIcon}>
                <FileText color="#3b82f6" size={24} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.nameDoc}</Text>
                <Text style={styles.documentMeta}>
                  {doc.length} • Ajouté le {doc.date}
                </Text>
              </View>
              <TouchableOpacity style={styles.downloadButton}>
                <Download color="#64748b" size={20} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <FileText color="#94a3b8" size={48} />
          <Text style={styles.emptyTitle}>Aucun document disponible</Text>
          <Text style={styles.emptyText}>
            Contactez votre formateur pour débloquer l'accès aux documents de cours
          </Text>
        </View>
      )}

      {lockedDocuments.length > 0 && (
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documents verrouillés</Text>
          {lockedDocuments.map((doc) => (
            <View key={doc.id} style={[styles.documentCard, styles.lockedCard]}>
              <View style={[styles.documentIcon, styles.lockedIcon]}>
                <Lock color="#94a3b8" size={24} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={[styles.documentName, styles.lockedText]}>{doc.nameDoc}</Text>
                <Text style={styles.documentMeta}>
                  {doc.length} • Accès non autorisé
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(currentUser?.role === 'Admin' || currentUser?.role === 'Encadrant') && (
        <View style={styles.infoBox}>
          <FileText color="#2563eb" size={24} />
          <Text style={styles.infoBoxText}>
            En tant que formateur, vous pouvez gérer les permissions d'accès aux documents depuis l'onglet Documents.
          </Text>
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
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  documentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lockedCard: {
    opacity: 0.6,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lockedIcon: {
    backgroundColor: '#f1f5f9',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  lockedText: {
    color: '#64748b',
  },
  documentMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  downloadButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
});
