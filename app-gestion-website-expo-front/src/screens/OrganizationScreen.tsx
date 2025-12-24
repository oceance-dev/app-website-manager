import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Building2, MapPin, Mail, Phone, Edit2, Save, X, UserPlus, Users, GraduationCap, FileCheck, Eye, Download, Calendar, User, Clock, CalendarDays, Edit3, Trash2, CheckCircle2, Loader2, FolderDown } from 'lucide-react-native';
import { getDepartmentFromPostalCode, isValidPostalCode, Department } from '../utils/department';
import { isWeb } from '../utils/responsive';
import { initialUtilisateurs } from '../data/mockData';
import type { User as UserType } from '../types';
import { CadetsApi, CandidatsApi, ApiError, mapCadetsArrayToUsers } from '../api';

type TabType = 'administration' | 'requests' | 'trainers' | 'cadets';

interface RegistrationDocument {
  id: number;
  name: string;
  type: string;
  size: string;
  url?: string;
}

interface CandidatDocument {
  id: string;
  name: string;
  uploaded: boolean;
  uploadDate?: string;
  category: 'required' | 'form';
}

interface AppointmentInfo {
  date: Date;
  time: string;
  notes?: string;
}

interface RegistrationRequest {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  postalCode: string;
  city: string;
  parentEmail?: string;
  requestDate: string;
  documents: RegistrationDocument[];
  candidatDocuments: CandidatDocument[];
  status: 'pending' | 'appointment_scheduled' | 'validated' | 'rejected';
  appointment?: AppointmentInfo;
}

interface OrganizationInfo {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  email: string;
  phone: string;
}

export default function OrganizationScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('administration');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [errorRequests, setErrorRequests] = useState<string | null>(null);
  const [showCadetModal, setShowCadetModal] = useState(false);
  const [selectedCadet, setSelectedCadet] = useState<UserType | null>(null);
  const [cadetRole, setCadetRole] = useState<string>('Cadet');

  const [orgInfo, setOrgInfo] = useState<OrganizationInfo>({
    name: 'Cadet de la Somme',
    address: '123 rue de la République',
    postalCode: '80000',
    city: 'Amiens',
    email: 'contact@cadet-somme.fr',
    phone: '+33 3 22 00 00 00',
  });
  const [editedInfo, setEditedInfo] = useState<OrganizationInfo>(orgInfo);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(
    getDepartmentFromPostalCode('80000')
  );

  // Fonction helper pour générer les documents requis d'un candidat
  const generateCandidatDocuments = (candidatId: number): CandidatDocument[] => {
    // TODO: Ces données viendront de l'API plus tard
    // Pour le moment, on génère des données de mock
    const allDocuments = [
      { id: 'id_card', name: 'Pièce d\'identité', category: 'required' as const },
      { id: 'photo', name: 'Photo d\'identité', category: 'required' as const },
      { id: 'medical_certificate', name: 'Certificat médical', category: 'required' as const },
      { id: 'parental_authorization', name: 'Autorisation parentale', category: 'form' as const },
      { id: 'inscription_form', name: 'Formulaire d\'inscription', category: 'form' as const },
      { id: 'engagement_form', name: 'Charte d\'engagement', category: 'form' as const },
      { id: 'health_form', name: 'Fiche sanitaire', category: 'form' as const },
    ];

    // Simuler un état d'upload aléatoire pour la démo
    return allDocuments.map(doc => ({
      ...doc,
      uploaded: Math.random() > 0.5, // 50% de chance d'être uploadé
      uploadDate: Math.random() > 0.5 ? new Date().toISOString() : undefined,
    }));
  };

  // Fonction pour charger les demandes d'inscription
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);
      setErrorRequests(null);

      // Real API call
      const response = await CandidatsApi.getAllCandidats();

      if (response.success && response.data && response.data.candidats.length > 0) {
        // Map API data to RegistrationRequest format
        const requestsData: RegistrationRequest[] = response.data.candidats.map((candidat: any, index) => ({
          id: candidat.id || index + 1, // Use API id if available, otherwise use index
          firstname: candidat.firstname,
          lastname: candidat.lastname,
          email: candidat.email,
          phone: candidat.phone || '',
          dateOfBirth: candidat.dateOfbirth || '',
          address: '', // Not provided by API
          postalCode: candidat.cityCode || '',
          city: '', // Not provided by API
          parentEmail: candidat.emailParent,
          requestDate: new Date().toISOString().split('T')[0],
          documents: [], // Not provided by API yet
          candidatDocuments: generateCandidatDocuments(candidat.id || index + 1),
          status: 'pending' as const,
        }));

        setRequests(requestsData);
      } else {
        // Si l'API ne retourne rien, utiliser des données de mock pour la démo
        const mockCandidatDocuments = generateCandidatDocuments(6);
        const mockRequests: RegistrationRequest[] = [
          {
            id: 6,
            firstname: 'Lucas',
            lastname: 'Durand',
            email: 'candidat@monapp.fr',
            phone: '+33 6 12 34 56 90',
            dateOfBirth: '2010-04-18',
            address: '45 rue de la Liberté',
            postalCode: '80000',
            city: 'Amiens',
            parentEmail: 'parent.durand@exemple.fr',
            requestDate: new Date().toISOString().split('T')[0],
            documents: [],
            candidatDocuments: mockCandidatDocuments,
            status: 'pending' as const,
          },
        ];
        setRequests(mockRequests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);

      // En cas d'erreur, utiliser des données de mock pour la démo
      const mockCandidatDocuments = generateCandidatDocuments(6);
      const mockRequests: RegistrationRequest[] = [
        {
          id: 6,
          firstname: 'Lucas',
          lastname: 'Durand',
          email: 'candidat@monapp.fr',
          phone: '+33 6 12 34 56 90',
          dateOfBirth: '2010-04-18',
          address: '45 rue de la Liberté',
          postalCode: '80000',
          city: 'Amiens',
          parentEmail: 'parent.durand@exemple.fr',
          requestDate: new Date().toISOString().split('T')[0],
          documents: [],
          candidatDocuments: mockCandidatDocuments,
          status: 'pending' as const,
        },
      ];
      setRequests(mockRequests);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Charger les demandes d'inscription quand l'onglet est actif
  useEffect(() => {
    if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  // Fonction pour télécharger tous les documents d'un candidat
  const handleDownloadAllDocuments = (request: RegistrationRequest) => {
    const uploadedDocs = request.candidatDocuments.filter(d => d.uploaded);

    if (uploadedDocs.length === 0) {
      if (isWeb) {
        alert('Aucun document à télécharger');
      } else {
        Alert.alert('Information', 'Aucun document à télécharger');
      }
      return;
    }

    // TODO: Implémenter le téléchargement réel des documents
    // Pour le moment, on simule le téléchargement
    if (isWeb) {
      alert(`Téléchargement de ${uploadedDocs.length} document(s) de ${request.firstname} ${request.lastname}...\n\nCette fonctionnalité sera bientôt disponible.`);
    } else {
      Alert.alert(
        'Téléchargement',
        `Téléchargement de ${uploadedDocs.length} document(s) de ${request.firstname} ${request.lastname}...\n\nCette fonctionnalité sera bientôt disponible.`
      );
    }

    // Dans une vraie application, vous feriez quelque chose comme :
    // uploadedDocs.forEach(doc => {
    //   if (doc.fileUri) {
    //     downloadFile(doc.fileUri, doc.name);
    //   }
    // });
  };

  const tabs = [
    { id: 'administration' as TabType, label: 'Administration', icon: Building2 },
    { id: 'requests' as TabType, label: 'Demandes d\'inscription', icon: UserPlus },
    { id: 'trainers' as TabType, label: 'Formateurs', icon: GraduationCap },
    { id: 'cadets' as TabType, label: 'Cadets', icon: Users },
  ];

  const handleViewRequest = (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  const handleValidateRequest = (requestId: number) => {
    setRequests(requests.map(req =>
      req.id === requestId
        ? { ...req, status: 'validated' as const }
        : req
    ));

    if (isWeb) {
      alert(`Demande #${requestId} validée`);
    } else {
      Alert.alert('Succès', `Demande #${requestId} validée`);
    }
    setShowRequestModal(false);
  };

  const handleRejectRequest = (requestId: number) => {
    setRequests(requests.map(req =>
      req.id === requestId
        ? { ...req, status: 'rejected' as const }
        : req
    ));

    if (isWeb) {
      alert(`Demande #${requestId} refusée`);
    } else {
      Alert.alert('Succès', `Demande #${requestId} refusée`);
    }
    setShowRequestModal(false);
  };

  const handleOpenAppointment = () => {
    setShowAppointmentModal(true);
  };

  const handleConfirmAppointment = () => {
    if (!selectedDate || !selectedRequest) {
      if (isWeb) {
        alert('Veuillez sélectionner une date');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner une date');
      }
      return;
    }

    // Mettre à jour la demande avec le rendez-vous
    setRequests(requests.map(req =>
      req.id === selectedRequest.id
        ? {
            ...req,
            status: 'appointment_scheduled' as const,
            appointment: {
              date: selectedDate,
              time: selectedTime,
              notes: appointmentNotes,
            }
          }
        : req
    ));

    // Mettre à jour la demande sélectionnée pour l'affichage
    setSelectedRequest({
      ...selectedRequest,
      status: 'appointment_scheduled',
      appointment: {
        date: selectedDate,
        time: selectedTime,
        notes: appointmentNotes,
      }
    });

    const dateStr = selectedDate.toLocaleDateString('fr-FR');
    if (isWeb) {
      alert(`Rendez-vous fixé le ${dateStr} à ${selectedTime}`);
    } else {
      Alert.alert('Succès', `Rendez-vous fixé le ${dateStr} à ${selectedTime}`);
    }
    setShowAppointmentModal(false);
    setSelectedDate(null);
    setSelectedTime('14:00');
    setAppointmentNotes('');
  };

  // Générer les jours du mois
  const generateCalendar = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Jours vides avant le premier jour du mois
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Jours du mois
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return { days, currentMonth, currentYear, today: today.getDate() };
  };

  const calendar = generateCalendar();

  // État pour les cadets avec chargement et erreur
  const [cadets, setCadets] = useState<UserType[]>([]);
  const [loadingCadets, setLoadingCadets] = useState(false);
  const [errorCadets, setErrorCadets] = useState<string | null>(null);

  // Filtrer les formateurs
  const trainers = initialUtilisateurs.filter(u => u.role === 'Encadrant' || u.role === 'Président' || u.role === 'Trésorier');

  // Fonction pour charger les cadets
  const fetchCadets = async () => {
    try {
      setLoadingCadets(true);
      setErrorCadets(null);

      // Real API call
      const response = await CadetsApi.getAllCadets();

      if (response.success && response.data) {
        // Use the mapper to convert API data to User format
        const cadetsData = mapCadetsArrayToUsers(response.data.cadets);
        setCadets(cadetsData);
      } else {
        setErrorCadets('Erreur lors du chargement des cadets');
      }
    } catch (error) {
      console.error('Error fetching cadets:', error);
      if (error instanceof ApiError) {
        setErrorCadets(error.message);
      } else {
        setErrorCadets('Une erreur est survenue lors du chargement des cadets');
      }
    } finally {
      setLoadingCadets(false);
    }
  };

  // Charger les cadets quand l'onglet est actif
  useEffect(() => {
    if (activeTab === 'cadets') {
      fetchCadets();
    }
  }, [activeTab]);

  const handleViewCadet = (cadet: UserType) => {
    setSelectedCadet(cadet);
    setCadetRole(cadet.role);
    setShowCadetModal(true);
  };

  const handleSaveCadetChanges = async () => {
    if (selectedCadet) {
      try {
        // TODO: Replace with real API call when backend is ready
        // await CadetsApi.updateCadetRole(selectedCadet.id, cadetRole);

        // For now, use mock logic
        if (isWeb) {
          alert(`Modifications enregistrées pour ${selectedCadet.firstname} ${selectedCadet.lastname}\nNouveau rôle : ${cadetRole}`);
        } else {
          Alert.alert('Succès', `Modifications enregistrées pour ${selectedCadet.firstname} ${selectedCadet.lastname}\nNouveau rôle : ${cadetRole}`);
        }
        setShowCadetModal(false);
      } catch (error) {
        console.error('Error updating cadet:', error);
        if (isWeb) {
          alert('Une erreur est survenue lors de la mise à jour');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la mise à jour');
        }
      }
    }
  };

  const handleEditCadet = (cadet: UserType) => {
    if (isWeb) {
      alert(`Modifier ${cadet.firstname} ${cadet.lastname}`);
    } else {
      Alert.alert('Modifier', `Modifier ${cadet.firstname} ${cadet.lastname}`);
    }
  };

  const handleDeleteCadet = async (cadet: UserType) => {
    const performDelete = async () => {
      try {
        // TODO: Replace with real API call when backend is ready
        // await CadetsApi.deleteCadet(cadet.id);

        // For now, use mock logic
        if (isWeb) {
          alert(`${cadet.firstname} ${cadet.lastname} supprimé`);
        } else {
          Alert.alert('Succès', `${cadet.firstname} ${cadet.lastname} supprimé`);
        }

        // Reload cadets list after deletion
        fetchCadets();
      } catch (error) {
        console.error('Error deleting cadet:', error);
        if (isWeb) {
          alert('Une erreur est survenue lors de la suppression');
        } else {
          Alert.alert('Erreur', 'Une erreur est survenue lors de la suppression');
        }
      }
    };

    if (isWeb) {
      const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer ${cadet.firstname} ${cadet.lastname} ?`);
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Confirmation',
        `Êtes-vous sûr de vouloir supprimer ${cadet.firstname} ${cadet.lastname} ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleEdit = () => {
    setEditedInfo(orgInfo);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedInfo(orgInfo);
    setIsEditing(false);
  };

  const handleSave = () => {
    // TODO: Appel API pour sauvegarder
    setOrgInfo(editedInfo);
    setIsEditing(false);

    if (isWeb) {
      alert('Informations mises à jour avec succès');
    } else {
      Alert.alert('Succès', 'Informations mises à jour avec succès');
    }
  };

  const handlePostalCodeChange = (text: string) => {
    setEditedInfo({ ...editedInfo, postalCode: text });

    if (isValidPostalCode(text)) {
      const department = getDepartmentFromPostalCode(text);
      setDepartmentInfo(department);
    } else {
      setDepartmentInfo(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Gestion de l'association</Text>
              <Text style={styles.subtitle}>Gérez les informations de votre association</Text>
            </View>
            {activeTab === 'administration' && (
              <>
                {!isEditing ? (
                  <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Edit2 color="#2563eb" size={20} />
                    <Text style={styles.editButtonText}>Modifier</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                      <X color="#64748b" size={20} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                      <Save color="#fff" size={20} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                >
                  <Icon
                    color={isActive ? '#2563eb' : '#64748b'}
                    size={20}
                  />
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab Content: Administration */}
          {activeTab === 'administration' && (
            <>
              {/* Section: Informations générales */}
              <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations générales</Text>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Building2 color="#2563eb" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nom de l'association</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.name}
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, name: text })}
                    placeholder="Nom de l'association"
                  />
                ) : (
                  <Text style={styles.infoValue}>{orgInfo.name}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Mail color="#2563eb" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.email}
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, email: text })}
                    placeholder="Email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                ) : (
                  <Text style={styles.infoValue}>{orgInfo.email}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Phone color="#2563eb" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.phone}
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, phone: text })}
                    placeholder="Téléphone"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.infoValue}>{orgInfo.phone}</Text>
                )}
              </View>
            </View>
          </View>

          {/* Section: Localisation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Localisation</Text>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <MapPin color="#2563eb" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Adresse</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.address}
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, address: text })}
                    placeholder="Adresse"
                    multiline
                  />
                ) : (
                  <Text style={styles.infoValue}>{orgInfo.address}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <MapPin color="#2563eb" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Code postal</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.postalCode}
                    onChangeText={handlePostalCodeChange}
                    placeholder="Code postal"
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                ) : (
                  <Text style={styles.infoValue}>{orgInfo.postalCode}</Text>
                )}
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <MapPin color="#2563eb" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ville</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedInfo.city}
                    onChangeText={(text) => setEditedInfo({ ...editedInfo, city: text })}
                    placeholder="Ville"
                  />
                ) : (
                  <Text style={styles.infoValue}>{orgInfo.city}</Text>
                )}
              </View>
            </View>

            {departmentInfo && (
              <View style={styles.departmentInfo}>
                <Text style={styles.departmentLabel}>📍 Département</Text>
                <Text style={styles.departmentText}>
                  {departmentInfo.name} ({departmentInfo.code})
                </Text>
                <Text style={styles.regionText}>{departmentInfo.region}</Text>
              </View>
            )}
          </View>

              {/* Section: Statistiques */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Statistiques</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>15</Text>
                    <Text style={styles.statLabel}>Membres</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>42</Text>
                    <Text style={styles.statLabel}>Documents</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>8</Text>
                    <Text style={styles.statLabel}>Dossiers</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* Tab Content: Demandes d'inscription */}
          {activeTab === 'requests' && (
            <View style={styles.tabContent}>
              <Text style={styles.emptyStateTitle}>Demandes d'inscription</Text>
              <Text style={styles.emptyStateText}>
                Gérez les demandes d'inscription des nouveaux membres.
              </Text>

              {/* Loading state */}
              {loadingRequests && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>Chargement des demandes...</Text>
                </View>
              )}

              {/* Error state */}
              {!loadingRequests && errorRequests && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorRequests}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchRequests}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Empty state */}
              {!loadingRequests && !errorRequests && requests.filter(r => r.status !== 'validated' && r.status !== 'rejected').length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>Aucune demande d'inscription en attente</Text>
                </View>
              )}

              {/* Requests list */}
              {!loadingRequests && !errorRequests && requests.filter(r => r.status !== 'validated' && r.status !== 'rejected').length > 0 && (
                <View style={styles.requestsList}>
                  {requests.filter(r => r.status !== 'validated' && r.status !== 'rejected').map((request) => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'pending':
                        return { text: 'En attente', color: '#f59e0b', bg: '#fef3c7' };
                      case 'appointment_scheduled':
                        return { text: 'RDV programmé', color: '#2563eb', bg: '#dbeafe' };
                      default:
                        return { text: 'En attente', color: '#64748b', bg: '#f1f5f9' };
                    }
                  };

                  const badge = getStatusBadge(request.status);

                  const uploadedDocs = request.candidatDocuments ? request.candidatDocuments.filter(d => d.uploaded).length : 0;
                  const totalDocs = request.candidatDocuments ? request.candidatDocuments.length : 0;
                  const docsProgress = totalDocs > 0 ? (uploadedDocs / totalDocs) * 100 : 0;

                  return (
                    <View key={request.id} style={styles.requestCard}>
                      <View style={styles.requestHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.requestName}>
                            {request.firstname} {request.lastname}
                          </Text>
                          <Text style={styles.requestEmail}>{request.email}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                              <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                                {badge.text}
                              </Text>
                            </View>
                            {totalDocs > 0 && (
                              <View style={styles.documentsProgressBadge}>
                                <FileCheck color={docsProgress === 100 ? '#10b981' : '#f59e0b'} size={14} />
                                <Text style={styles.documentsProgressText}>
                                  {uploadedDocs}/{totalDocs} docs
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        {request.requestDate && (
                          <Text style={styles.requestDate}>
                            {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                          </Text>
                        )}
                      </View>
                      <View style={styles.requestActions}>
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => handleViewRequest(request)}
                        >
                          <Eye color="#2563eb" size={18} />
                          <Text style={styles.viewButtonText}>Voir détails</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
                </View>
              )}
            </View>
          )}

          {/* Tab Content: Formateurs */}
          {activeTab === 'trainers' && (
            <View style={styles.tabContent}>
              <Text style={styles.emptyStateTitle}>Formateurs & Encadrants</Text>
              <Text style={styles.emptyStateText}>
                Liste des formateurs et encadrants de votre association ({trainers.length}).
              </Text>
              <View style={styles.membersList}>
                {trainers.map((trainer) => {
                  const initials = `${trainer.firstname.charAt(0)}${trainer.lastname.charAt(0)}`;
                  return (
                    <View key={trainer.id} style={styles.memberCard}>
                      <View style={styles.memberAvatar}>
                        <Text style={styles.memberAvatarText}>{initials}</Text>
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {trainer.firstname} {trainer.lastname}
                        </Text>
                        <Text style={styles.memberRole}>{trainer.role}</Text>
                      </View>
                      <Text style={styles.memberPhone}>{trainer.phone}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Tab Content: Cadets */}
          {activeTab === 'cadets' && (
            <View style={styles.tabContent}>
              <Text style={styles.emptyStateTitle}>Cadets</Text>
              <Text style={styles.emptyStateText}>
                Liste des cadets inscrits dans votre association.
              </Text>

              {/* Loading state */}
              {loadingCadets && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>Chargement des cadets...</Text>
                </View>
              )}

              {/* Error state */}
              {!loadingCadets && errorCadets && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorCadets}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchCadets}>
                    <Text style={styles.retryButtonText}>Réessayer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Empty state */}
              {!loadingCadets && !errorCadets && cadets.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <Text style={styles.emptyStateText}>Aucun cadet trouvé</Text>
                </View>
              )}

              {/* Cadets list */}
              {!loadingCadets && !errorCadets && cadets.length > 0 && (
                <View style={styles.membersList}>
                  {cadets.map((cadet) => {
                    const initials = `${cadet.firstname.charAt(0)}${cadet.lastname.charAt(0)}`;
                    return (
                      <View key={cadet.id} style={styles.cadetCard}>
                        <View style={[styles.memberAvatar, { backgroundColor: '#dbeafe' }]}>
                          <Text style={[styles.memberAvatarText, { color: '#2563eb' }]}>
                            {initials}
                          </Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>
                            {cadet.firstname} {cadet.lastname}
                          </Text>
                          <Text style={styles.memberRole}>{cadet.role}</Text>
                          <Text style={styles.memberEmail}>{cadet.email}</Text>
                        </View>
                        <View style={styles.cadetActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.viewActionButton]}
                            onPress={() => handleViewCadet(cadet)}
                          >
                            <Eye color="#2563eb" size={18} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.editActionButton]}
                            onPress={() => handleEditCadet(cadet)}
                          >
                            <Edit3 color="#10b981" size={18} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.deleteActionButton]}
                            onPress={() => handleDeleteCadet(cadet)}
                          >
                            <Trash2 color="#ef4444" size={18} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Modal de détails de demande */}
      <Modal
        visible={showRequestModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRequestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Détails de la demande</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowRequestModal(false)}
                >
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              {selectedRequest && (
                <>
                  {/* Informations personnelles */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Informations personnelles</Text>

                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <User color="#2563eb" size={20} />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Nom complet</Text>
                        <Text style={styles.modalInfoValue}>
                          {selectedRequest.firstname} {selectedRequest.lastname}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <Mail color="#2563eb" size={20} />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Email</Text>
                        <Text style={styles.modalInfoValue}>{selectedRequest.email}</Text>
                      </View>
                    </View>

                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <Phone color="#2563eb" size={20} />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Téléphone</Text>
                        <Text style={styles.modalInfoValue}>{selectedRequest.phone}</Text>
                      </View>
                    </View>

                    {selectedRequest.dateOfBirth && (
                      <View style={styles.modalInfoRow}>
                        <View style={styles.modalIconContainer}>
                          <Calendar color="#2563eb" size={20} />
                        </View>
                        <View style={styles.modalInfoContent}>
                          <Text style={styles.modalInfoLabel}>Date de naissance</Text>
                          <Text style={styles.modalInfoValue}>
                            {new Date(selectedRequest.dateOfBirth).toLocaleDateString('fr-FR')}
                          </Text>
                        </View>
                      </View>
                    )}

                    {selectedRequest.parentEmail && (
                      <View style={styles.modalInfoRow}>
                        <View style={styles.modalIconContainer}>
                          <Mail color="#2563eb" size={20} />
                        </View>
                        <View style={styles.modalInfoContent}>
                          <Text style={styles.modalInfoLabel}>Email du parent</Text>
                          <Text style={styles.modalInfoValue}>{selectedRequest.parentEmail}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Adresse */}
                  {(selectedRequest.address || selectedRequest.postalCode || selectedRequest.city) && (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Adresse</Text>

                      <View style={styles.modalInfoRow}>
                        <View style={styles.modalIconContainer}>
                          <MapPin color="#2563eb" size={20} />
                        </View>
                        <View style={styles.modalInfoContent}>
                          <Text style={styles.modalInfoLabel}>Adresse complète</Text>
                          {selectedRequest.address && (
                            <Text style={styles.modalInfoValue}>{selectedRequest.address}</Text>
                          )}
                          {(selectedRequest.postalCode || selectedRequest.city) && (
                            <Text style={styles.modalInfoValue}>
                              {selectedRequest.postalCode} {selectedRequest.city}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Documents du candidat */}
                  {selectedRequest.candidatDocuments && selectedRequest.candidatDocuments.length > 0 && (
                    <View style={styles.modalSection}>
                      <View style={styles.documentsHeader}>
                        <Text style={styles.modalSectionTitle}>
                          Documents du candidat
                        </Text>
                        <View style={styles.documentsProgressContainer}>
                          <Text style={styles.documentsProgressSummary}>
                            {selectedRequest.candidatDocuments.filter(d => d.uploaded).length} / {selectedRequest.candidatDocuments.length} complétés
                          </Text>
                        </View>
                      </View>

                      {/* Bouton télécharger tous les documents */}
                      {selectedRequest.candidatDocuments.filter(d => d.uploaded).length > 0 && (
                        <TouchableOpacity
                          style={styles.downloadAllButton}
                          onPress={() => handleDownloadAllDocuments(selectedRequest)}
                        >
                          <FolderDown color="#2563eb" size={20} />
                          <Text style={styles.downloadAllButtonText}>
                            Télécharger tous les documents ({selectedRequest.candidatDocuments.filter(d => d.uploaded).length})
                          </Text>
                        </TouchableOpacity>
                      )}

                      {/* Documents requis */}
                      <Text style={styles.documentCategoryTitle}>Documents à fournir</Text>
                      {selectedRequest.candidatDocuments.filter(d => d.category === 'required').map((doc) => (
                      <View key={doc.id} style={styles.documentItem}>
                        <View style={[styles.documentIcon, { backgroundColor: doc.uploaded ? '#dcfce7' : '#fef3c7' }]}>
                          {doc.uploaded ? (
                            <CheckCircle2 color="#10b981" size={20} />
                          ) : (
                            <Loader2 color="#f59e0b" size={20} />
                          )}
                        </View>
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentName}>{doc.name}</Text>
                          <Text style={[styles.documentMeta, { color: doc.uploaded ? '#059669' : '#d97706' }]}>
                            {doc.uploaded ? 'Reçu' : 'En attente'}
                            {doc.uploadDate && ` • ${new Date(doc.uploadDate).toLocaleDateString('fr-FR')}`}
                          </Text>
                        </View>
                        {doc.uploaded && (
                          <TouchableOpacity style={styles.downloadButton}>
                            <Download color="#2563eb" size={20} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    {/* Formulaires */}
                    <Text style={[styles.documentCategoryTitle, { marginTop: 16 }]}>Formulaires complétés</Text>
                    {selectedRequest.candidatDocuments.filter(d => d.category === 'form').map((doc) => (
                      <View key={doc.id} style={styles.documentItem}>
                        <View style={[styles.documentIcon, { backgroundColor: doc.uploaded ? '#dcfce7' : '#fef3c7' }]}>
                          {doc.uploaded ? (
                            <CheckCircle2 color="#10b981" size={20} />
                          ) : (
                            <Loader2 color="#f59e0b" size={20} />
                          )}
                        </View>
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentName}>{doc.name}</Text>
                          <Text style={[styles.documentMeta, { color: doc.uploaded ? '#059669' : '#d97706' }]}>
                            {doc.uploaded ? 'Reçu' : 'En attente'}
                            {doc.uploadDate && ` • ${new Date(doc.uploadDate).toLocaleDateString('fr-FR')}`}
                          </Text>
                        </View>
                        {doc.uploaded && (
                          <TouchableOpacity style={styles.downloadButton}>
                            <Download color="#2563eb" size={20} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    </View>
                  )}

                  {/* Affichage du rendez-vous si programmé */}
                  {selectedRequest.status === 'appointment_scheduled' && selectedRequest.appointment && (
                    <View style={styles.appointmentInfoSection}>
                      <Text style={styles.modalSectionTitle}>Rendez-vous programmé</Text>
                      <View style={styles.appointmentInfoCard}>
                        <View style={styles.appointmentInfoRow}>
                          <CalendarDays color="#2563eb" size={20} />
                          <View style={styles.appointmentInfoText}>
                            <Text style={styles.appointmentInfoLabel}>Date</Text>
                            <Text style={styles.appointmentInfoValue}>
                              {selectedRequest.appointment.date.toLocaleDateString('fr-FR')}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.appointmentInfoRow}>
                          <Clock color="#2563eb" size={20} />
                          <View style={styles.appointmentInfoText}>
                            <Text style={styles.appointmentInfoLabel}>Heure</Text>
                            <Text style={styles.appointmentInfoValue}>
                              {selectedRequest.appointment.time}
                            </Text>
                          </View>
                        </View>
                        {selectedRequest.appointment.notes && (
                          <View style={styles.appointmentInfoRow}>
                            <FileCheck color="#2563eb" size={20} />
                            <View style={styles.appointmentInfoText}>
                              <Text style={styles.appointmentInfoLabel}>Notes</Text>
                              <Text style={styles.appointmentInfoValue}>
                                {selectedRequest.appointment.notes}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Actions selon le statut */}
                  {selectedRequest.status === 'pending' && (
                    <>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalAppointmentButton}
                          onPress={handleOpenAppointment}
                        >
                          <CalendarDays color="#2563eb" size={20} />
                          <Text style={styles.modalAppointmentButtonText}>Fixer un rendez-vous</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.modalActions}>
                        <TouchableOpacity
                          style={styles.modalRejectButton}
                          onPress={() => handleRejectRequest(selectedRequest.id)}
                        >
                          <X color="#fff" size={20} />
                          <Text style={styles.modalRejectButtonText}>Refuser</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}

                  {selectedRequest.status === 'appointment_scheduled' && selectedRequest.appointment && (
                    <>
                      {/* Vérifier si le rendez-vous est passé */}
                      {(() => {
                        const now = new Date();
                        const appointmentDateTime = new Date(selectedRequest.appointment.date);
                        const [hours, minutes] = selectedRequest.appointment.time.split(':');
                        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));
                        const isPast = appointmentDateTime < now;

                        return (
                          <View style={styles.modalActions}>
                            <TouchableOpacity
                              style={styles.modalRejectButton}
                              onPress={() => handleRejectRequest(selectedRequest.id)}
                            >
                              <X color="#fff" size={20} />
                              <Text style={styles.modalRejectButtonText}>Refuser</Text>
                            </TouchableOpacity>
                            {isPast && (
                              <TouchableOpacity
                                style={styles.modalApproveButton}
                                onPress={() => handleValidateRequest(selectedRequest.id)}
                              >
                                <FileCheck color="#fff" size={20} />
                                <Text style={styles.modalApproveButtonText}>Valider</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de rendez-vous */}
      <Modal
        visible={showAppointmentModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAppointmentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Fixer un rendez-vous</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowAppointmentModal(false)}
                >
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              {/* Calendrier */}
              <View style={styles.calendarSection}>
                <Text style={styles.calendarMonthTitle}>
                  {new Date(calendar.currentYear, calendar.currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </Text>

                {/* Jours de la semaine */}
                <View style={styles.calendarWeekdays}>
                  {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day, index) => (
                    <View key={index} style={styles.calendarWeekdayCell}>
                      <Text style={styles.calendarWeekdayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Jours du mois */}
                <View style={styles.calendarDays}>
                  {calendar.days.map((day, index) => {
                    if (day === null) {
                      return <View key={index} style={styles.calendarDayCell} />;
                    }

                    const isToday = day === calendar.today;
                    const isPast = day < calendar.today;
                    const date = new Date(calendar.currentYear, calendar.currentMonth, day);
                    const isSelected = selectedDate &&
                      selectedDate.getDate() === day &&
                      selectedDate.getMonth() === calendar.currentMonth &&
                      selectedDate.getFullYear() === calendar.currentYear;

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDayCell,
                          isToday && styles.calendarDayToday,
                          isSelected && styles.calendarDaySelected,
                          isPast && styles.calendarDayPast,
                        ]}
                        onPress={() => !isPast && setSelectedDate(date)}
                        disabled={isPast}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.calendarDayText,
                            isToday && styles.calendarDayTodayText,
                            isSelected && styles.calendarDaySelectedText,
                            isPast && styles.calendarDayPastText,
                          ]}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Heure */}
              <View style={styles.timeSection}>
                <Text style={styles.timeSectionTitle}>Heure du rendez-vous</Text>
                <View style={styles.timeInputContainer}>
                  <Clock color="#2563eb" size={20} />
                  <TextInput
                    style={styles.timeInput}
                    value={selectedTime}
                    onChangeText={setSelectedTime}
                    placeholder="14:00"
                    keyboardType="default"
                  />
                </View>
              </View>

              {/* Notes */}
              <View style={styles.notesSection}>
                <Text style={styles.notesSectionTitle}>Notes (optionnel)</Text>
                <TextInput
                  style={styles.notesInput}
                  value={appointmentNotes}
                  onChangeText={setAppointmentNotes}
                  placeholder="Ajouter des notes pour ce rendez-vous..."
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Actions */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelAppointmentButton}
                  onPress={() => setShowAppointmentModal(false)}
                >
                  <Text style={styles.cancelAppointmentButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmAppointmentButton}
                  onPress={handleConfirmAppointment}
                >
                  <CalendarDays color="#fff" size={20} />
                  <Text style={styles.confirmAppointmentButtonText}>Confirmer le rendez-vous</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de détails du cadet */}
      <Modal
        visible={showCadetModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCadetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Fiche du cadet</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCadetModal(false)}
                >
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              {selectedCadet && (
                <>
                  {/* Avatar et nom */}
                  <View style={styles.cadetModalHeader}>
                    <View style={styles.cadetModalAvatar}>
                      <Text style={styles.cadetModalAvatarText}>
                        {selectedCadet.firstname.charAt(0)}{selectedCadet.lastname.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.cadetModalName}>
                      {selectedCadet.firstname} {selectedCadet.lastname}
                    </Text>
                    <Text style={styles.cadetModalEmail}>{selectedCadet.email}</Text>
                  </View>

                  {/* Informations personnelles */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Informations personnelles</Text>

                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <Phone color="#2563eb" size={20} />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Téléphone</Text>
                        <Text style={styles.modalInfoValue}>{selectedCadet.phone}</Text>
                      </View>
                    </View>

                    {selectedCadet.dateOfbirth && (
                      <View style={styles.modalInfoRow}>
                        <View style={styles.modalIconContainer}>
                          <Calendar color="#2563eb" size={20} />
                        </View>
                        <View style={styles.modalInfoContent}>
                          <Text style={styles.modalInfoLabel}>Date de naissance</Text>
                          <Text style={styles.modalInfoValue}>
                            {new Date(selectedCadet.dateOfbirth).toLocaleDateString('fr-FR')}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.modalInfoRow}>
                      <View style={styles.modalIconContainer}>
                        <User color="#2563eb" size={20} />
                      </View>
                      <View style={styles.modalInfoContent}>
                        <Text style={styles.modalInfoLabel}>Statut</Text>
                        <Text style={styles.modalInfoValue}>{selectedCadet.statut}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Rôle / Brevet */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Rôle et brevet</Text>

                    <View style={styles.roleSection}>
                      <Text style={styles.roleLabel}>Rôle du cadet</Text>
                      <View style={styles.roleOptions}>
                        <TouchableOpacity
                          style={[
                            styles.roleOption,
                            cadetRole === 'Cadet' && styles.roleOptionActive
                          ]}
                          onPress={() => setCadetRole('Cadet')}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            cadetRole === 'Cadet' && styles.roleOptionTextActive
                          ]}>
                            Cadet
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.roleOption,
                            cadetRole === 'Cadet Breveté' && styles.roleOptionActive
                          ]}
                          onPress={() => setCadetRole('Cadet Breveté')}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            cadetRole === 'Cadet Breveté' && styles.roleOptionTextActive
                          ]}>
                            Cadet Breveté
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.roleOption,
                            cadetRole === 'Ancien Cadet' && styles.roleOptionActive
                          ]}
                          onPress={() => setCadetRole('Ancien Cadet')}
                        >
                          <Text style={[
                            styles.roleOptionText,
                            cadetRole === 'Ancien Cadet' && styles.roleOptionTextActive
                          ]}>
                            Ancien Cadet
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {cadetRole === 'Cadet Breveté' && (
                        <View style={styles.brevetInfo}>
                          <FileCheck color="#10b981" size={20} />
                          <Text style={styles.brevetInfoText}>
                            Ce cadet a obtenu son brevet
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelAppointmentButton}
                      onPress={() => setShowCadetModal(false)}
                    >
                      <Text style={styles.cancelAppointmentButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmAppointmentButton}
                      onPress={handleSaveCadetChanges}
                    >
                      <Save color="#fff" size={20} />
                      <Text style={styles.confirmAppointmentButtonText}>Enregistrer</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
    padding: 10,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#1e293b',
  },
  input: {
    fontSize: 16,
    color: '#1e293b',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  departmentInfo: {
    backgroundColor: '#eff6ff',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  departmentLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  departmentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  regionText: {
    fontSize: 14,
    color: '#2563eb',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
    marginBottom: 24,
    gap: 8,
    flexWrap: 'wrap',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -2,
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  tabContent: {
    paddingVertical: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  requestEmail: {
    fontSize: 14,
    color: '#64748b',
  },
  requestDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 14,
    color: '#64748b',
  },
  memberPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  memberEmail: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
  },
  cadetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  cadetActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewActionButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editActionButton: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  deleteActionButton: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  appointmentInfoSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  appointmentInfoCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  appointmentInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  appointmentInfoText: {
    flex: 1,
  },
  appointmentInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  appointmentInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalSection: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInfoContent: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalInfoValue: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 22,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 13,
    color: '#64748b',
  },
  downloadButton: {
    padding: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
  },
  modalRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalRejectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalApproveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#10b981',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  modalApproveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  modalAppointmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  modalAppointmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  calendarSection: {
    padding: 24,
  },
  calendarMonthTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  calendarWeekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  calendarDayToday: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  calendarDaySelected: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  calendarDayPast: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1e293b',
  },
  calendarDayTodayText: {
    color: '#2563eb',
    fontWeight: '700',
  },
  calendarDaySelectedText: {
    color: '#fff',
    fontWeight: '700',
  },
  calendarDayPastText: {
    color: '#94a3b8',
  },
  timeSection: {
    padding: 24,
    paddingTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  timeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  notesSection: {
    padding: 24,
    paddingTop: 16,
  },
  notesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 15,
    color: '#1e293b',
    minHeight: 100,
  },
  cancelAppointmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  cancelAppointmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmAppointmentButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  confirmAppointmentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cadetModalHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cadetModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cadetModalAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  cadetModalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  cadetModalEmail: {
    fontSize: 16,
    color: '#64748b',
  },
  roleSection: {
    padding: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  roleOptions: {
    gap: 8,
  },
  roleOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  roleOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  roleOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
  },
  roleOptionTextActive: {
    color: '#2563eb',
    fontWeight: '700',
  },
  brevetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  brevetInfoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#047857',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 40,
  },
  documentsProgressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  documentsProgressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  documentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentsProgressContainer: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  documentsProgressSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  documentCategoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#eff6ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    marginBottom: 20,
  },
  downloadAllButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2563eb',
  },
});
