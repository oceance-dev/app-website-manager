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
import { Building2, MapPin, Mail, Phone, Edit2, Save, X, UserPlus, Users, GraduationCap, FileCheck, Eye, Download, Calendar, User, Clock, CalendarDays, Edit3, Trash2, CheckCircle2, Loader2, FolderDown, UserCog, EyeOff, Upload, FileText, Search, MoreVertical, Plus } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getDepartmentFromPostalCode, isValidPostalCode, Department } from '../utils/department';
import { isWeb } from '../utils/responsive';
import { initialUtilisateurs } from '../data/mockData';
import type { User as UserType } from '../types';
import { CadetsApi, CandidatsApi, ApiError, mapCadetsArrayToUsers, AssociationsApi, AuthApi, DocumentRequirementsApi, DocumentsApi, API_CONFIG } from '../api';
import { UsersApi, UserResponse } from '../api/users.api';
import { RolesApi, Role } from '../api/roles.api';
import { tokenStorage } from '../api/tokenStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, textStyles, spacing, shadows, borderRadius } from '../theme';
import { Card, Badge } from '../components/cadep';
import Toast, { ToastType } from '../components/ui/Toast';
import DocumentViewerModal from '../components/modalsHelper/DocumentViewerModal';

type TabType = 'association' | 'document-requirements' | 'requests' | 'members' | 'cadets';

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
  siret?: string;
  president?: string;
}

interface Member {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  city_code: string;
  dateOfBirth: string;
}

interface AllMembersResponse {
  members: Member[];
}

export default function OrganizationScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('association');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [candidatDocuments, setCandidatDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [showDocumentViewerModal, setShowDocumentViewerModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [viewerDocumentUrl, setViewerDocumentUrl] = useState<string | null>(null);
  const [viewerDocumentName, setViewerDocumentName] = useState('');
  const [viewerDocumentMimeType, setViewerDocumentMimeType] = useState('');
  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [errorRequests, setErrorRequests] = useState<string | null>(null);
  const [candidateDocumentCounts, setCandidateDocumentCounts] = useState<{ [key: number]: { uploaded: number; total: number } }>({});
  const [showCadetModal, setShowCadetModal] = useState(false);
  const [selectedCadet, setSelectedCadet] = useState<UserType | null>(null);
  const [cadetRole, setCadetRole] = useState<string>('Cadet');

  // États pour l'ajout de document personnalisé
  const [showAddDocumentModal, setShowAddDocumentModal] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // États pour les membres en attente
  const [pendingMembers, setPendingMembers] = useState<UserResponse[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // États pour tous les membres actifs
  const [allMembers, setAllMembers] = useState<UserResponse[]>([]);
  const [loadingAllMembers, setLoadingAllMembers] = useState(false);

  // États pour la sélection de rôle lors de l'approbation
  const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);
  const [selectedMemberForApproval, setSelectedMemberForApproval] = useState<{ id: number; name: string } | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [orgInfo, setOrgInfo] = useState<OrganizationInfo>({
    name: '',
    address: '',
    postalCode: '',
    city: '',
    email: '',
    phone: '',
  });
  const [editedInfo, setEditedInfo] = useState<OrganizationInfo>(orgInfo);
  const [departmentInfo, setDepartmentInfo] = useState<Department | null>(null);

  // États pour les statistiques
  const [stats, setStats] = useState({
    activeUsers: 0,
    documentsCount: 0,
    foldersCount: 0,
  });

  // États pour les exigences documentaires
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [showRequirementModal, setShowRequirementModal] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState<any | null>(null);
  const [availableDocumentTypes, setAvailableDocumentTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // États pour la modal en 2 étapes
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [searchTypeQuery, setSearchTypeQuery] = useState('');

  // États du formulaire de document requis
  const [formDocumentTypeId, setFormDocumentTypeId] = useState<number | null>(null);
  const [formIsRequired, setFormIsRequired] = useState(false);
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [formRequiredFor, setFormRequiredFor] = useState<string>('all');
  const [formRequiredAt, setFormRequiredAt] = useState<string>('registration');
  const [formCustomName, setFormCustomName] = useState('');
  const [formCustomInstructions, setFormCustomInstructions] = useState('');
  const [formCustomValidityDays, setFormCustomValidityDays] = useState('');
  const [savingRequirement, setSavingRequirement] = useState(false);

  // États pour le document modèle (template)
  const [formTemplateDocumentId, setFormTemplateDocumentId] = useState<number | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [showTemplateSection, setShowTemplateSection] = useState(false);
  const [templateUploadMode, setTemplateUploadMode] = useState<'upload' | 'select'>('upload');

  // États pour le toast
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
    setToastType('success');
    setShowToast(true);
  };

  // États pour le modal de création de type de document personnalisé
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);
  const [formTypeName, setFormTypeName] = useState('');
  const [formTypeDescription, setFormTypeDescription] = useState('');
  const [formTypeCategory, setFormTypeCategory] = useState<string>('other');
  const [formTypeIsRequired, setFormTypeIsRequired] = useState(false);
  const [formTypeRequiresValidation, setFormTypeRequiresValidation] = useState(false);
  const [formTypeHasExpiration, setFormTypeHasExpiration] = useState(false);
  const [formTypeValidityDays, setFormTypeValidityDays] = useState('');
  const [formTypeRequiredFor, setFormTypeRequiredFor] = useState<string>('all');
  const [savingType, setSavingType] = useState(false);

  const showErrorToast = (message: string) => {
    setToastMessage(message);
    setToastType('error');
    setShowToast(true);
  };

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

      // Appel API avec nouveau système d'authentification
      const response = await CandidatsApi.getAllCandidatures();

      if (response.success && response.data && response.data.candidatures) {
        // Map API data to RegistrationRequest format
        const requestsData: RegistrationRequest[] = response.data.candidatures.map((candidat: any, index) => ({
          id: candidat.id || index + 1,
          firstname: candidat.firstName || '',
          lastname: candidat.lastName || '',
          email: candidat.email || '',
          phone: candidat.phone || '',
          dateOfBirth: candidat.dateOfBirth ? new Date(candidat.dateOfBirth).toISOString().split('T')[0] : '',
          address: '',
          postalCode: candidat.city_code || '',
          city: '',
          parentEmail: '',
          requestDate: candidat.createdAt ? new Date(candidat.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          documents: [],
          candidatDocuments: [],
          status: 'pending' as const,
        }));

        setRequests(requestsData);

        // Charger les documents requis pour l'association
        const requirementsResponse = await DocumentRequirementsApi.getAll();
        const totalRequired = requirementsResponse.success && requirementsResponse.data
          ? requirementsResponse.data.requirements.filter((req: any) => req.isRequired).length
          : 0;

        // Charger les documents pour chaque candidat
        const documentCounts: { [key: number]: { uploaded: number; total: number } } = {};

        for (const candidat of response.data.candidatures) {
          const candidatId = candidat.id;
          try {
            const docsResponse = await DocumentsApi.getAllDocumentsByCandidat(candidatId);
            const uploadedCount = docsResponse.success && docsResponse.data
              ? docsResponse.data.documents.length
              : 0;

            documentCounts[candidatId] = {
              uploaded: uploadedCount,
              total: totalRequired || 0,
            };
          } catch (error) {
            console.error(`Error loading documents for candidat ${candidatId}:`, error);
            documentCounts[candidatId] = { uploaded: 0, total: totalRequired || 0 };
          }
        }

        setCandidateDocumentCounts(documentCounts);
      } else {
        // Pas de candidatures
        setRequests([]);
        setCandidateDocumentCounts({});
      }
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      setErrorRequests(error?.message || 'Erreur lors du chargement des candidatures');
      setRequests([]);
      setCandidateDocumentCounts({});
    } finally {
      setLoadingRequests(false);
    }
  };

  // Charger les demandes d'inscription quand l'onglet est actif
  useEffect(() => {
    if (activeTab === 'association') {
      fetchOrganizationInfo();
      fetchStats();
    }
    if (activeTab === 'requests') {
      fetchRequests();
    }
    if (activeTab === 'members') {
      fetchPendingMembers();
      fetchAllMembers();
    }
  }, [activeTab]);


  // Fonction pour charger les informations de l'association
  const fetchOrganizationInfo = async () => {
    try {
      console.log('🔍 fetchOrganizationInfo: Starting...');
      const accessToken = await AsyncStorage.getItem('accessToken');

      if (!accessToken) {
        console.log('❌ No access token');
        return;
      }

      // Récupérer les infos de l'utilisateur connecté
      const meResponse = await AuthApi.getMe(accessToken);
      console.log('👤 Me Response:', meResponse);

      if (!meResponse.success || !meResponse.data) {
        console.log('❌ Failed to get user info');
        return;
      }

      const user = meResponse.data.user;
      const associationId = user.associationId;
      console.log('🏢 Association ID:', associationId);

      if (!associationId) {
        console.log('❌ No associationId found');
        return;
      }

      console.log('📡 Calling AssociationsApi.getById with ID:', associationId);
      const response = await AssociationsApi.getById(associationId);
      console.log('📥 API Response:', response);

      if (response.success && response.data) {
        const assoc = response.data.association;
        console.log('✅ Association data:', assoc);

        const newOrgInfo: OrganizationInfo = {
          name: assoc.name || '',
          address: assoc.address || '',
          postalCode: assoc.postalCode || '',
          city: assoc.city || '',
          email: assoc.email || '',
          phone: assoc.phone || '',
        };
        console.log('📝 Setting orgInfo:', newOrgInfo);
        setOrgInfo(newOrgInfo);
        setEditedInfo(newOrgInfo);

        // Mettre à jour les infos du département
        if (assoc.postalCode) {
          const dept = getDepartmentFromPostalCode(assoc.postalCode);
          setDepartmentInfo(dept);
        }
      } else {
        console.log('❌ Response not successful or no data');
      }
    } catch (error) {
      console.error('❌ Error loading organization info:', error);
    }
  };

  // Fonction pour charger les statistiques
  const fetchStats = async () => {
    try {
      const response = await AssociationsApi.getMyStats();
      if (response.success && response.data) {
        setStats({
          activeUsers: response.data.stats.activeUsers,
          documentsCount: response.data.stats.documentsCount,
          foldersCount: response.data.stats.foldersCount,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Fonction pour charger les membres en attente
  const fetchPendingMembers = async () => {
    try {
      setLoadingMembers(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await AssociationsApi.getMembersPending({isActive: false});
      if (response.success && response.data) {
        setPendingMembers(response.data.members);
      }
    } catch (error) {
      console.error('Error loading pending members:', error);
      Alert.alert('Erreur', 'Impossible de charger les membres en attente');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Fonction pour charger tous les membres actifs
  const fetchAllMembers = async () => {
    try {
      setLoadingAllMembers(true);
      const response = await AssociationsApi.getMembers({ isActive: true });

      if (response.success && response.data) {
        // Filtrer pour exclure les cadets et candidats (ils ont leurs propres tabs)
        const filteredMembers = response.data.members.filter(member => {
          const roleName = member.role?.name?.toLowerCase();
          return roleName !== 'cadet' && roleName !== 'candidat' && roleName !== 'cadet_brevete';
        });
        setAllMembers(filteredMembers);
      }
    } catch (error) {
      console.error('Error loading all members:', error);
      if (isWeb) {
        alert(`Erreur: ${error instanceof Error ? error.message : 'Impossible de charger les membres'}`);
      } else {
        Alert.alert('Erreur', 'Impossible de charger les membres');
      }
    } finally {
      setLoadingAllMembers(false);
    }
  };

  // Fonction pour charger les rôles assignables
  const fetchAssignableRoles = async () => {
    try {
      setLoadingRoles(true);
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await RolesApi.getAssignable(accessToken);
      if (response.success && response.data) {
        setAvailableRoles(response.data.roles);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      if (isWeb) {
        alert('Erreur: Impossible de charger les rôles disponibles');
      } else {
        Alert.alert('Erreur', 'Impossible de charger les rôles disponibles');
      }
    } finally {
      setLoadingRoles(false);
    }
  };

  // Fonction pour ouvrir le modal de sélection de rôle
  const openRoleSelectionModal = async (userId: number, userName: string) => {
    setSelectedMemberForApproval({ id: userId, name: userName });
    await fetchAssignableRoles();
    setShowRoleSelectionModal(true);
  };

  // Fonction pour confirmer l'approbation avec le rôle sélectionné
  const confirmApproveMember = async () => {
    if (!selectedMemberForApproval || !selectedRoleId) {
      if (isWeb) {
        alert('Erreur: Veuillez sélectionner un rôle');
      } else {
        Alert.alert('Erreur', 'Veuillez sélectionner un rôle');
      }
      return;
    }

    try {
      const response = await AssociationsApi.approveMember(selectedMemberForApproval.id, selectedRoleId);

      if (response.success) {
        if (isWeb) {
          alert('Succès: Membre approuvé avec succès');
        } else {
          Alert.alert('Succès', 'Membre approuvé avec succès');
        }
        fetchPendingMembers(); // Recharger la liste
        setShowRoleSelectionModal(false);
        setSelectedMemberForApproval(null);
        setSelectedRoleId(null);
      } else {
        if (isWeb) {
          alert('Erreur: ' + (response.message || 'Échec de l\'approbation'));
        } else {
          Alert.alert('Erreur', response.message || 'Échec de l\'approbation');
        }
      }
    } catch (error: any) {
      console.error('Error in confirmApproveMember:', error);
      if (isWeb) {
        alert('Erreur: ' + (error.message || 'Impossible d\'approuver le membre'));
      } else {
        Alert.alert('Erreur', error.message || 'Impossible d\'approuver le membre');
      }
    }
  };

  // Fonction pour approuver un membre - ouvre le modal de sélection de rôle
  const handleApproveMember = async (userId: number, userName: string) => {
    openRoleSelectionModal(userId, userName);
  };

  // Fonction pour rejeter un membre
  const handleRejectMember = async (userId: number, userName: string) => {
    if (isWeb) {
      const reason = prompt(`Pourquoi refusez-vous ${userName} ?`);
      if (reason !== null) {
        try {
          const accessToken = await AsyncStorage.getItem('accessToken');
          if (!accessToken) return;

          const response = await AssociationsApi.rejectMember(userId, reason || 'Demande refusée');
          if (response.success) {
            alert('Membre rejeté');
            fetchPendingMembers();
          }
        } catch (error: any) {
          alert(error.message || 'Impossible de rejeter le membre');
        }
      }
    } else {
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

                const response = await AssociationsApi.rejectMember(userId, reason || 'Demande refusée');
                if (response.success) {
                  Alert.alert('Succès', 'Membre rejeté');
                  fetchPendingMembers();
                }
              } catch (error: any) {
                Alert.alert('Erreur', error.message || 'Impossible de rejeter le membre');
              }
            },
          },
        ],
        'plain-text'
      );
    }
  };

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
    { id: 'association' as TabType, label: 'Association', icon: Building2 },
    { id: 'document-requirements' as TabType, label: 'Documents requis', icon: FileText },
    { id: 'requests' as TabType, label: 'Candidatures', icon: FileCheck },
    { id: 'members' as TabType, label: 'Membres', icon: Users },
    { id: 'cadets' as TabType, label: 'Cadets', icon: GraduationCap },
  ];

  const handleViewRequest = async (request: RegistrationRequest) => {
    setSelectedRequest(request);
    setShowRequestModal(true);

    // Charger les documents du candidat
    try {
      setLoadingDocuments(true);
      const response = await DocumentsApi.getAllDocumentsByCandidat(request.id);
      if (response.success && response.data) {
        setCandidatDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error('Error loading candidat documents:', error);
      setCandidatDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleViewDocument = async (document: any) => {
    console.log('📄 Viewing candidat document:', document);
    try {
      // Vérifier d'abord si on a un token valide
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        console.error('❌ No access token available');
        showErrorToast('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Télécharger le fichier avec authentification
      const downloadPath = `${API_CONFIG.BASE_URL}/candidats/download-my-document/${document.id}`;

      console.log('📄 Fetching document from:', downloadPath);

      // Télécharger le fichier avec le token d'authentification
      const fileResponse = await fetch(downloadPath, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!fileResponse.ok) {
        if (fileResponse.status === 401) {
          showErrorToast('Session expirée. Veuillez vous reconnecter.');
          return;
        }
        throw new Error(`Erreur HTTP: ${fileResponse.status}`);
      }

      // Récupérer le Content-Type depuis les headers de la réponse
      const contentType = fileResponse.headers.get('content-type') || document.mimeType || 'application/octet-stream';

      console.log('📄 Content-Type from response:', contentType);
      console.log('📄 MimeType from document:', document.mimeType);

      // Convertir en blob avec le bon type MIME
      const arrayBuffer = await fileResponse.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: contentType });

      // Créer une URL blob locale
      const blobUrl = URL.createObjectURL(blob);

      console.log('📄 Opening viewer modal with blob URL:', blobUrl);
      console.log('📄 Blob type:', blob.type);

      // Ouvrir la modal de visualisation
      setViewerDocumentUrl(blobUrl);
      setViewerDocumentName(document.name || document.originalName || 'Document');
      setViewerDocumentMimeType(contentType);
      setSelectedDocument(document);
      setShowDocumentViewerModal(true);
    } catch (error: any) {
      console.error('❌ Error viewing document:', error);

      // Gestion des erreurs d'authentification
      if (error?.code === 'SESSION_EXPIRED' || error?.status === 401) {
        showErrorToast('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (error?.code === 'NETWORK_ERROR') {
        showErrorToast('Erreur de connexion. Vérifiez votre réseau.');
      } else {
        const errorMessage = error?.message || 'Impossible d\'ouvrir le document';
        showErrorToast(errorMessage);
      }
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    try {
      console.log('💾 Downloading candidat document:', doc.id);

      // Vérifier le token
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        showErrorToast('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      // Télécharger le fichier avec authentification
      const downloadPath = `${API_CONFIG.BASE_URL}/candidats/download-my-document/${doc.id}`;

      console.log('📥 Fetching document from:', downloadPath);

      const fileResponse = await fetch(downloadPath, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!fileResponse.ok) {
        if (fileResponse.status === 401) {
          showErrorToast('Session expirée. Veuillez vous reconnecter.');
          return;
        }
        throw new Error(`Erreur HTTP: ${fileResponse.status}`);
      }

      // Convertir en blob
      const blob = await fileResponse.blob();

      console.log('📦 Blob received:', blob.type, blob.size);

      // Créer un blob URL et télécharger
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = doc.originalName || doc.name || doc.filePath?.split('/').pop() || 'document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Download completed');
      showSuccessToast('Document téléchargé avec succès');
    } catch (error: any) {
      console.error('❌ Error downloading document:', error);
      showErrorToast(error?.message || 'Erreur lors du téléchargement du document');
    }
  };

  const handleRejectDocument = async (document: any) => {
    try {
      // Vérifier le token
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        showErrorToast('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      const confirmed = isWeb
        ? confirm('Êtes-vous sûr de vouloir supprimer ce document ?')
        : await new Promise<boolean>((resolve) => {
            Alert.alert(
              'Supprimer le document',
              'Êtes-vous sûr de vouloir supprimer ce document ?',
              [
                {
                  text: 'Annuler',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: 'Supprimer',
                  style: 'destructive',
                  onPress: () => resolve(true),
                },
              ]
            );
          });

      if (!confirmed) {
        return;
      }

      try {
        const response = await CandidatsApi.deleteDocument(document.id);
        if (response.success) {
          showSuccessToast('Document supprimé avec succès');
          // Recharger les documents du candidat
          if (selectedRequest) {
            await handleViewRequest(selectedRequest);
          }
        } else {
          showErrorToast('Erreur lors de la suppression du document');
        }
      } catch (error: any) {
        console.error('Error deleting document:', error);
        showErrorToast(error?.message || 'Erreur lors de la suppression du document');
      }
    } catch (error: any) {
      console.error('Error deleting document:', error);
      showErrorToast(error?.message || 'Erreur lors de la suppression du document');
    }
  };

  // Fonction pour uploader un document personnalisé pour un candidat
  const handleUploadDocumentForCandidat = async () => {
    if (!selectedRequest) {
      showErrorToast('Aucun candidat sélectionné');
      return;
    }

    try {
      setIsUploadingDocument(true);

      // Sélectionner le fichier
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsUploadingDocument(false);
        return;
      }

      const file = result.assets[0];

      // Préparer FormData pour l'upload
      const formData = new FormData();

      if (isWeb) {
        // Sur web, on doit créer un vrai objet File à partir de l'URI
        const response = await fetch(file.uri);
        const blob = await response.blob();
        formData.append('file', blob, file.name);
      } else {
        // Sur mobile, on passe l'objet avec uri/type/name
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'application/octet-stream',
          name: file.name,
        } as any);
      }

      // Ajouter les métadonnées
      formData.append('category', 'other'); // Document personnalisé
      formData.append('name', file.name);

      // Upload via l'API - on doit créer une route admin pour uploader pour un candidat spécifique
      // Pour l'instant, on utilise l'API candidat mais il faudra créer une route admin
      const uploadResponse = await CandidatsApi.uploadDocument(formData);

      if (uploadResponse.success) {
        showSuccessToast(`Document "${file.name}" ajouté avec succès`);
        setShowAddDocumentModal(false);

        // Recharger les documents du candidat
        await handleViewRequest(selectedRequest);
      } else {
        showErrorToast('Erreur lors de l\'ajout du document');
      }
    } catch (error) {
      console.error('Error uploading document for candidat:', error);
      showErrorToast('Erreur lors de l\'ajout du document');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleValidateRequest = async (requestId: number) => {
    try {
      // Appel API pour valider la candidature
      const response = await CandidatsApi.validateCandidature(requestId);

      if (response.success) {
        // Mettre à jour l'état local
        setRequests(requests.map(req =>
          req.id === requestId
            ? { ...req, status: 'validated' as const }
            : req
        ));

        showSuccessToast('Candidature validée avec succès');
        setShowRequestModal(false);

        // Recharger les candidatures
        await fetchRequests();
      }
    } catch (error: any) {
      console.error('Error validating candidature:', error);
      showErrorToast(error?.message || 'Erreur lors de la validation de la candidature');
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      // Appel API pour rejeter la candidature
      const response = await CandidatsApi.rejectCandidature(requestId);

      if (response.success) {
        // Mettre à jour l'état local
        setRequests(requests.map(req =>
          req.id === requestId
            ? { ...req, status: 'rejected' as const }
            : req
        ));

        showSuccessToast('Candidature refusée');
        setShowRequestModal(false);

        // Recharger les candidatures
        await fetchRequests();
      }
    } catch (error: any) {
      console.error('Error rejecting candidature:', error);
      showErrorToast(error?.message || 'Erreur lors du rejet de la candidature');
    }
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

  const handleSave = async () => {
    try {
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (!accessToken) return;

      // Récupérer les infos de l'utilisateur connecté
      const meResponse = await AuthApi.getMe(accessToken);
      if (!meResponse.success || !meResponse.data) return;

      const associationId = meResponse.data.user.associationId;
      if (!associationId) return;

      const response = await AssociationsApi.update(associationId, {
        name: editedInfo.name,
        address: editedInfo.address,
        postalCode: editedInfo.postalCode,
        city: editedInfo.city,
        email: editedInfo.email,
        phone: editedInfo.phone,
      });

      if (response.success) {
        setOrgInfo(editedInfo);
        setIsEditing(false);

        if (isWeb) {
          alert('Informations mises à jour avec succès');
        } else {
          Alert.alert('Succès', 'Informations mises à jour avec succès');
        }
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      if (isWeb) {
        alert('Erreur lors de la mise à jour');
      } else {
        Alert.alert('Erreur', 'Erreur lors de la mise à jour');
      }
    }
  };

  // Charger les exigences documentaires
  const fetchRequirements = async () => {
    try {
      setLoadingRequirements(true);
      const response = await DocumentRequirementsApi.getAll();

      if (response.success && response.data) {
        console.log('📋 Requirements loaded:', response.data.requirements);
        setRequirements(response.data.requirements);
      }
    } catch (error) {
      console.error('❌ Error loading requirements:', error);
      if (isWeb) {
        alert('Erreur lors du chargement des exigences documentaires');
      } else {
        Alert.alert('Erreur', 'Impossible de charger les exigences documentaires');
      }
    } finally {
      setLoadingRequirements(false);
    }
  };


  // Créer un nouveau type de document personnalisé
  const handleSaveCustomType = async () => {
    try {
      if (!formTypeName.trim()) {
        showErrorToast('Le nom est obligatoire');
        return;
      }

      setSavingType(true);

      const typeData = {
        name: formTypeName.trim(),
        description: formTypeDescription.trim() || undefined,
        category: formTypeCategory as any,
        isRequired: formTypeIsRequired,
        isActive: true,
        requiresValidation: formTypeRequiresValidation,
        hasExpiration: formTypeHasExpiration,
        validityDays: formTypeValidityDays ? Number(formTypeValidityDays) : undefined,
        requiredFor: formTypeRequiredFor as any,
      };

      const response = await DocumentsApi.createType(typeData);

      if (response.success) {
        showSuccessToast('Type de document créé avec succès');
        setShowCreateTypeModal(false);

        // Réinitialiser le formulaire
        setFormTypeName('');
        setFormTypeDescription('');
        setFormTypeCategory('other');
        setFormTypeIsRequired(false);
        setFormTypeRequiresValidation(false);
        setFormTypeHasExpiration(false);
        setFormTypeValidityDays('');
        setFormTypeRequiredFor('all');

        // Recharger les types disponibles et rouvrir la modal de sélection
        await fetchAvailableTypes();
        setTimeout(() => {
          setShowRequirementModal(true);
          setModalStep(1);
        }, 300);
      }
    } catch (error: any) {
      console.error('Error creating custom type:', error);
      showErrorToast(error?.message || 'Erreur lors de la création du type de document');
    } finally {
      setSavingType(false);
    }
  };

  // Charger les documents disponibles pour les templates
  const fetchAvailableDocuments = async () => {
    try {
      const response = await DocumentsApi.getAll();
      if (response.success && response.data) {
        setAvailableDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('❌ Error loading documents:', error);
    }
  };

  // Uploader un nouveau document modèle
  const handleUploadTemplateDocument = async () => {
    try {
      setUploadingTemplate(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const file = result.assets[0];
      const blob = await fetch(file.uri).then(r => r.blob());

      const uploadData = {
        name: file.name,
        file: blob,
        visibility: 'staff' as const,
        category: 'administrative' as const,
        description: 'Document modèle pour les candidats',
        isTemplate: true,
      };

      const uploadResponse = await DocumentsApi.upload(uploadData);

      if (uploadResponse.success && uploadResponse.data) {
        setFormTemplateDocumentId(uploadResponse.data.document.id);
        showSuccessToast('Document modèle uploadé avec succès');
        await fetchAvailableDocuments();
      }
    } catch (error: any) {
      console.error('Error uploading template:', error);
      showErrorToast(error?.message || 'Erreur lors de l\'upload du document modèle');
    } finally {
      setUploadingTemplate(false);
    }
  };

  // Charger les exigences quand on arrive sur l'onglet
  useEffect(() => {
    if (activeTab === 'document-requirements') {
      fetchRequirements();
      fetchAvailableTypes();
      fetchAvailableDocuments();
    }
  }, [activeTab]);

  // Pré-remplir le formulaire quand on édite un document requis
  useEffect(() => {
    if (selectedRequirement && showRequirementModal) {
      setFormDocumentTypeId(selectedRequirement.documentTypeId);
      setFormIsRequired(selectedRequirement.isRequired);
      setFormIsEnabled(selectedRequirement.isEnabled);
      setFormRequiredFor(selectedRequirement.requiredFor || 'all');
      setFormRequiredAt(selectedRequirement.requiredAt || 'registration');
      setFormCustomName(selectedRequirement.customName || '');
      setFormCustomInstructions(selectedRequirement.customInstructions || '');
      setFormCustomValidityDays(selectedRequirement.customValidityDays?.toString() || '');
      setFormTemplateDocumentId(selectedRequirement.templateDocumentId || null);
      setShowTemplateSection(!!selectedRequirement.templateDocumentId);
    } else if (!selectedRequirement && showRequirementModal) {
      // Réinitialiser le formulaire pour un nouveau document
      setFormDocumentTypeId(null);
      setFormIsRequired(false);
      setFormIsEnabled(true);
      setFormRequiredFor('all');
      setFormRequiredAt('registration');
      setFormCustomName('');
      setFormCustomInstructions('');
      setFormCustomValidityDays('');
      setFormTemplateDocumentId(null);
      setShowTemplateSection(false);
      setTemplateUploadMode('upload');
    }
  }, [selectedRequirement, showRequirementModal]);

  const handlePostalCodeChange = (text: string) => {
    setEditedInfo({ ...editedInfo, postalCode: text });

    if (isValidPostalCode(text)) {
      const department = getDepartmentFromPostalCode(text);
      setDepartmentInfo(department);
    } else {
      setDepartmentInfo(null);
    }
  };

  // Charger les types de documents disponibles
  const fetchAvailableTypes = async () => {
    try {
      setLoadingTypes(true);
      const response = await DocumentRequirementsApi.getAvailableTypes();
      if (response.success && response.data) {
        setAvailableDocumentTypes(response.data.types || []);
      }
    } catch (error) {
      console.error('Error loading document types:', error);
      showErrorToast('Erreur lors du chargement des types');
    } finally {
      setLoadingTypes(false);
    }
  };

  // Ouvrir la modal d'ajout
  const handleOpenRequirementModal = () => {
    setSelectedRequirement(null);
    setModalStep(1);
    setSearchTypeQuery('');
    setFormDocumentTypeId(null);
    setFormCustomName('');
    setFormCustomInstructions('');
    setFormIsRequired(true);
    setFormRequiredFor('all');
    setFormRequiredAt('registration');
    setFormTemplateDocumentId(null);
    setTemplateUploadMode('upload');
    setShowRequirementModal(true);
    fetchAvailableTypes();
    fetchAvailableDocuments();
  };

  // Sélectionner un type et passer à l'étape 2
  const handleSelectType = (type: any) => {
    setFormDocumentTypeId(type.id);
    setFormCustomName(type.displayName || type.name);
    setFormCustomInstructions(type.description || '');
    setModalStep(2);
  };

  const handleSaveRequirement = async () => {
    try {
      if (!formDocumentTypeId) {
        showErrorToast('Veuillez sélectionner un type de document');
        return;
      }

      setSavingRequirement(true);

      const requirementData = {
        documentTypeId: formDocumentTypeId,
        customName: formCustomName,
        customInstructions: formCustomInstructions,
        isRequired: formIsRequired,
        requiredFor: formRequiredFor as 'all' | 'cadets' | 'candidates' | 'staff',
        requiredAt: formRequiredAt as 'registration' | 'approval' | 'anytime',
        isEnabled: true,
        templateDocumentId: formTemplateDocumentId,
      };

      let response;
      if (selectedRequirement) {
        response = await DocumentRequirementsApi.update(selectedRequirement.id, requirementData);
      } else {
        response = await DocumentRequirementsApi.create(requirementData);
      }

      if (response.success) {
        showSuccessToast(selectedRequirement ? 'Document modifié' : 'Document ajouté');
        setShowRequirementModal(false);
        fetchRequirements();
      } else {
        showErrorToast('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving requirement:', error);
      showErrorToast('Erreur lors de la sauvegarde');
    } finally {
      setSavingRequirement(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER SECTION */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Building2 color={colors.navy} size={32} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Gestion de l'association</Text>
            <Text style={styles.headerSubtitle}>Gérez votre association, ses membres et les candidatures</Text>
          </View>
        </View>
      </View>

      {/* Navigation Tabs - Horizontal at the top */}
      <View style={styles.topNavigation}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navTab, isActive && styles.navTabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.7}
            >
              <Icon
                color={isActive ? colors.navy : colors.gray[600]}
                size={18}
              />
              <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

          {/* Tab Content: Association */}
          {activeTab === 'association' && (
            <View style={styles.pageContent}>
              {/* Information Card */}
              <View style={styles.infoCard}>
                <View style={styles.infoCardHeader}>
                  <View>
                    <Text style={styles.infoCardTitle}>Informations de l'association</Text>
                    <Text style={styles.infoCardSubtitle}>Détails et paramètres de votre association</Text>
                  </View>
                  {!isEditing ? (
                    <TouchableOpacity style={styles.modifyButton} onPress={handleEdit}>
                      <Edit2 color={colors.navy} size={18} />
                      <Text style={styles.modifyButtonText}>Modifier</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.editActions}>
                      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <X color={colors.gray[600]} size={18} />
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Save color={colors.white} size={18} />
                        <Text style={styles.saveButtonText}>Enregistrer</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* 2 columns grid */}
                <View style={styles.infoGrid}>
                  {/* Column 1 */}
                  <View style={styles.infoColumn}>
                    {/* Nom */}
                    <View style={styles.infoField}>
                      <Text style={styles.infoFieldLabel}>Nom</Text>
                      {isEditing ? (
                        <TextInput
                          style={styles.infoFieldInput}
                          value={editedInfo.name}
                          onChangeText={(text) => setEditedInfo({ ...editedInfo, name: text })}
                          placeholder="Nom de l'association"
                        />
                      ) : (
                        <Text style={styles.infoFieldValue}>{orgInfo.name || ''}</Text>
                      )}
                    </View>

                    {/* SIRET */}
                    <View style={styles.infoField}>
                      <Text style={styles.infoFieldLabel}>SIRET</Text>
                      <Text style={styles.infoFieldValue}>{orgInfo.siret || ''}</Text>
                    </View>

                    {/* Adresse */}
                    <View style={styles.infoField}>
                      <Text style={styles.infoFieldLabel}>Adresse</Text>
                      {isEditing ? (
                        <TextInput
                          style={styles.infoFieldInput}
                          value={editedInfo.address}
                          onChangeText={(text) => setEditedInfo({ ...editedInfo, address: text })}
                          placeholder="Adresse"
                          multiline
                        />
                      ) : (
                        <Text style={styles.infoFieldValue}>
                          {orgInfo.address || ''}{'\n'}
                          {orgInfo.postalCode || ''} {orgInfo.city || ''}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Column 2 */}
                  <View style={styles.infoColumn}>
                    {/* Email */}
                    <View style={styles.infoField}>
                      <Text style={styles.infoFieldLabel}>Email</Text>
                      <View style={styles.infoFieldValueRow}>
                        <Mail color={colors.gray[600]} size={16} />
                        {isEditing ? (
                          <TextInput
                            style={[styles.infoFieldInput, { flex: 1, marginLeft: spacing[2] }]}
                            value={editedInfo.email}
                            onChangeText={(text) => setEditedInfo({ ...editedInfo, email: text })}
                            placeholder="Email"
                          />
                        ) : (
                          <Text style={[styles.infoFieldValue, { marginLeft: spacing[2] }]}>
                            {orgInfo.email || ''}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Téléphone */}
                    <View style={styles.infoField}>
                      <Text style={styles.infoFieldLabel}>Téléphone</Text>
                      <View style={styles.infoFieldValueRow}>
                        <Phone color={colors.gray[600]} size={16} />
                        {isEditing ? (
                          <TextInput
                            style={[styles.infoFieldInput, { flex: 1, marginLeft: spacing[2] }]}
                            value={editedInfo.phone}
                            onChangeText={(text) => setEditedInfo({ ...editedInfo, phone: text })}
                            placeholder="Téléphone"
                          />
                        ) : (
                          <Text style={[styles.infoFieldValue, { marginLeft: spacing[2] }]}>
                            {orgInfo.phone || ''}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Président */}
                    <View style={styles.infoField}>
                      <Text style={styles.infoFieldLabel}>Président</Text>
                      <Text style={styles.infoFieldValue}>
                        {orgInfo.president || ''}{'\n'}
                        <Text style={styles.infoFieldValueSecondary}></Text>
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Stats Cards */}
              <View style={styles.statsContainer}>
                {/* Stat 1: Membres actifs */}
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: colors.gray[100] }]}>
                    <Users color={colors.gray[600]} size={24} />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>{stats.activeUsers}</Text>
                    <Text style={styles.statLabel}>Membres actifs</Text>
                  </View>
                </View>

                {/* Stat 2: Cadets */}
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: colors.successLight }]}>
                    <GraduationCap color={colors.success} size={24} />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>{stats.documentsCount}</Text>
                    <Text style={styles.statLabel}>Cadets</Text>
                  </View>
                </View>

                {/* Stat 3: Candidatures en attente */}
                <View style={styles.statCard}>
                  <View style={[styles.statIconCircle, { backgroundColor: colors.warningLight }]}>
                    <FileText color={colors.warning} size={24} />
                  </View>
                  <View style={styles.statContent}>
                    <Text style={styles.statNumber}>{stats.foldersCount}</Text>
                    <Text style={styles.statLabel}>Candidatures en attente</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Tab Content: Demandes d'inscription */}
          {activeTab === 'requests' && (
            <View style={styles.pageContent}>
              {/* Page Header avec titre + search */}
              <View style={styles.pageHeader}>
                <View style={styles.pageHeaderLeft}>
                  <Text style={styles.pageTitle}>Candidatures des futurs cadets</Text>
                  <Text style={styles.pageSubtitle}>Gérez les inscriptions des candidats souhaitant devenir cadets</Text>
                </View>
                <View style={styles.searchContainer}>
                  <Search color={colors.gray[400]} size={20} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher..."
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              {loadingRequests ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.navy} />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : requests.length === 0 ? (
                <View style={styles.centeredContainer}>
                  <FileCheck color={colors.gray[400]} size={48} />
                  <Text style={styles.emptyTitle}>Aucune candidature</Text>
                  <Text style={styles.emptyText}>Les nouvelles candidatures apparaîtront ici</Text>
                </View>
              ) : (
                <View style={styles.tableContainer}>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Candidat</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Contact</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date de naissance</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Documents</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Statut</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                  </View>

                  {/* Table Rows */}
                  {requests.map((request, index) => (
                    <View
                      key={request.id}
                      style={[
                        styles.tableRow,
                        index === requests.length - 1 && styles.tableRowLast
                      ]}
                    >
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <Text style={styles.tableCellText}>
                          {request.firstname} {request.lastname}
                        </Text>
                        <Text style={styles.tableCellSubtext}>
                          Soumis le {new Date(request.requestDate).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <View style={styles.contactRow}>
                          <Mail color={colors.gray[600]} size={14} />
                          <Text style={styles.tableCellSubtext}>{request.email}</Text>
                        </View>
                        <View style={styles.contactRow}>
                          <Phone color={colors.gray[600]} size={14} />
                          <Text style={styles.tableCellSubtext}>{request.phone}</Text>
                        </View>
                      </View>
                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <Text style={styles.tableCellText}>
                          {request.dateOfBirth ? new Date(request.dateOfBirth).toLocaleDateString('fr-FR') : '-'}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <Text style={styles.tableCellText}>
                          {candidateDocumentCounts[request.id] ? (
                            candidateDocumentCounts[request.id].total > 0
                              ? `${candidateDocumentCounts[request.id].uploaded}/${candidateDocumentCounts[request.id].total}`
                              : candidateDocumentCounts[request.id].uploaded > 0
                              ? `${candidateDocumentCounts[request.id].uploaded}`
                              : 'Aucun'
                          ) : '-'}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <Badge variant="warning" label="En attente" />
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <TouchableOpacity style={styles.tableActionButton} onPress={() => handleViewRequest(request)}>
                          <MoreVertical color={colors.gray[600]} size={20} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Tab Content: Membres */}
          {activeTab === 'members' && (
            <View style={styles.pageContent}>
              {/* Section 1: Membres en attente */}
              <View style={styles.pageHeader}>
                <View style={styles.pageHeaderLeft}>
                  <Text style={styles.pageTitle}>Membres en attente de validation</Text>
                  <Text style={styles.pageSubtitle}>Approuvez ou rejetez les demandes d'inscription</Text>
                </View>
              </View>

              {loadingMembers ? (
                <ActivityIndicator size="large" color={colors.navy} />
              ) : pendingMembers.length === 0 ? (
                <View style={styles.centeredContainer}>
                  <Clock color={colors.gray[400]} size={48} />
                  <Text style={styles.emptyText}>Aucune demande en attente</Text>
                </View>
              ) : (
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Membre</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Contact</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Demande le</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Statut</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Actions</Text>
                  </View>
                  {pendingMembers.map((member, index) => (
                    <View key={member.id} style={[styles.tableRow, index === pendingMembers.length - 1 && styles.tableRowLast]}>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <Text style={styles.tableCellText}>{member.firstName} {member.lastName}</Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <View style={styles.contactRow}>
                          <Mail color={colors.gray[600]} size={14} />
                          <Text style={styles.tableCellSubtext}>{member.email}</Text>
                        </View>
                        {member.phone && (
                          <View style={styles.contactRow}>
                            <Phone color={colors.gray[600]} size={14} />
                            <Text style={styles.tableCellSubtext}>{member.phone}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <Text style={styles.tableCellText}>
                          {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <Badge variant="warning" label="En attente" />
                      </View>
                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                          <TouchableOpacity
                            style={[styles.tableActionButton, { backgroundColor: colors.errorLight }]}
                            onPress={() => handleRejectMember(member.id, `${member.firstName} ${member.lastName}`)}
                          >
                            <X color={colors.error} size={18} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.tableActionButton, { backgroundColor: colors.successLight }]}
                            onPress={() => handleApproveMember(member.id, `${member.firstName} ${member.lastName}`)}
                          >
                            <CheckCircle2 color={colors.success} size={18} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Section 2: Tous les membres actifs */}
              <View style={[styles.pageHeader, { marginTop: spacing[8] }]}>
                <View style={styles.pageHeaderLeft}>
                  <Text style={styles.pageTitle}>Tous les membres actifs</Text>
                  <Text style={styles.pageSubtitle}>Liste de tous les membres de votre association</Text>
                </View>
                <View style={styles.searchContainer}>
                  <Search color={colors.gray[400]} size={20} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un membre..."
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              {loadingAllMembers ? (
                <ActivityIndicator size="large" color={colors.navy} />
              ) : allMembers.length === 0 ? (
                <View style={styles.centeredContainer}>
                  <Users color={colors.gray[400]} size={48} />
                  <Text style={styles.emptyText}>Aucun membre actif</Text>
                </View>
              ) : (
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Membre</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Contact</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Rôle</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Depuis le</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Statut</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                  </View>
                  {allMembers.map((member, index) => (
                    <View key={member.id} style={[styles.tableRow, index === allMembers.length - 1 && styles.tableRowLast]}>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <Text style={styles.tableCellText}>{member.firstName} {member.lastName}</Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <View style={styles.contactRow}>
                          <Mail color={colors.gray[600]} size={14} />
                          <Text style={styles.tableCellSubtext}>{member.email}</Text>
                        </View>
                        {member.phone && (
                          <View style={styles.contactRow}>
                            <Phone color={colors.gray[600]} size={14} />
                            <Text style={styles.tableCellSubtext}>{member.phone}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <Text style={styles.tableCellText}>{member.role?.displayName || 'Membre'}</Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <Text style={styles.tableCellText}>
                          {new Date(member.createdAt).toLocaleDateString('fr-FR')}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <Badge variant="success" label="Actif" />
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <TouchableOpacity style={styles.tableActionButton}>
                          <MoreVertical color={colors.gray[600]} size={20} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Tab Content: Cadets */}
          {activeTab === 'cadets' && (
            <View style={styles.pageContent}>
              <View style={styles.pageHeader}>
                <View style={styles.pageHeaderLeft}>
                  <Text style={styles.pageTitle}>Liste des cadets</Text>
                  <Text style={styles.pageSubtitle}>Tous les cadets actifs et diplômés de votre association</Text>
                </View>
                <View style={styles.searchContainer}>
                  <Search color={colors.gray[400]} size={20} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Rechercher un cadet..."
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>
              </View>

              {loadingCadets ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.navy} />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : cadets.length === 0 ? (
                <View style={styles.centeredContainer}>
                  <GraduationCap color={colors.gray[400]} size={48} />
                  <Text style={styles.emptyTitle}>Aucun cadet</Text>
                  <Text style={styles.emptyText}>Les cadets apparaîtront ici</Text>
                </View>
              ) : (
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Cadet</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Contact</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Date de naissance</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Début formation</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Cours validés</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Statut</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Actions</Text>
                  </View>
                  {cadets.map((cadet, index) => (
                    <View key={cadet.id} style={[styles.tableRow, index === cadets.length - 1 && styles.tableRowLast]}>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <Text style={styles.tableCellText}>{cadet.firstname} {cadet.lastname}</Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 2 }]}>
                        <View style={styles.contactRow}>
                          <Mail color={colors.gray[600]} size={14} />
                          <Text style={styles.tableCellSubtext}>{cadet.email}</Text>
                        </View>
                        <View style={styles.contactRow}>
                          <Phone color={colors.gray[600]} size={14} />
                          <Text style={styles.tableCellSubtext}>{cadet.phone}</Text>
                        </View>
                      </View>
                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <Text style={styles.tableCellText}>
                          {cadet.dateOfbirth ? new Date(cadet.dateOfbirth).toLocaleDateString('fr-FR') : '-'}
                        </Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1.5 }]}>
                        <Text style={styles.tableCellText}>01/09/2025</Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <Text style={styles.tableCellText}>8 cours</Text>
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <Badge variant="success" label="Actif" />
                      </View>
                      <View style={[styles.tableCell, { flex: 1 }]}>
                        <TouchableOpacity style={styles.tableActionButton} onPress={() => handleViewCadet(cadet)}>
                          <MoreVertical color={colors.gray[600]} size={20} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Tab Content: Documents requis */}
          {activeTab === 'document-requirements' && (
            <View style={styles.pageContent}>
              {/* Header */}
              <View style={styles.requirementsHeader}>
                <View>
                  <Text style={styles.requirementsTitle}>Documents requis</Text>
                  <Text style={styles.requirementsSubtitle}>Gérez les documents requis pour les inscriptions</Text>
                </View>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={handleOpenRequirementModal}
                >
                  <Plus color={colors.navy} size={20} />
                  <Text style={styles.addButtonText}>Ajouter</Text>
                </TouchableOpacity>
              </View>

              {/* Loading/Empty/Content */}
              {loadingRequirements ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.navy} />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : requirements.length === 0 ? (
                <Card>
                  <View style={{ padding: spacing[6], alignItems: 'center' }}>
                    <FileCheck color={colors.gray[400]} size={48} />
                    <Text style={[styles.emptyStateTitle, { marginTop: spacing[4] }]}>
                      Aucun document requis
                    </Text>
                    <Text style={styles.emptyStateText}>
                      Utilisez le bouton "Ajouter" ci-dessus pour créer des documents requis
                    </Text>
                  </View>
                </Card>
              ) : (
                <View style={styles.requirementsList}>
                  {requirements.map((req) => (
                    <View key={req.id} style={styles.requirementCard}>
                      {/* Icône circulaire à gauche */}
                      <View style={styles.requirementIconCircle}>
                        <FileCheck color={colors.navy} size={24} />
                      </View>

                      {/* Contenu principal */}
                      <View style={styles.requirementContent}>
                        {/* Titre + Badge */}
                        <View style={styles.requirementTitleRow}>
                          <Text style={styles.requirementTitle}>
                            {req.documentType?.name || req.customName}
                          </Text>
                          {req.isRequired && (
                            <View style={styles.requiredBadge}>
                              <Text style={styles.requiredBadgeText}>Requis</Text>
                            </View>
                          )}
                        </View>

                        {/* Description */}
                        <Text style={styles.requirementDescription}>
                          {req.documentType?.description || req.customInstructions}
                        </Text>

                        {/* Métadonnées (Pour: ... / Quand: ...) */}
                        <View style={styles.requirementMeta}>
                          <Text style={styles.requirementMetaText}>
                            Pour: {req.requiredFor === 'all' ? 'Tous' : req.requiredFor === 'minors' ? 'Mineurs' : req.requiredFor === 'adults' ? 'Adultes' : 'Tous'}
                          </Text>
                          <Text style={styles.requirementMetaText}>
                            Quand: {req.requiredAt === 'registration' ? 'Inscription' : req.requiredAt === 'annual' ? 'Annuel' : 'Inscription'}
                          </Text>
                        </View>
                      </View>

                      {/* Boutons d'action à droite */}
                      <View style={styles.requirementActions}>
                        <TouchableOpacity
                          style={[styles.requirementActionButton, { backgroundColor: colors.successLight }]}
                          onPress={() => {
                            setSelectedRequirement(req);
                            setShowRequirementModal(true);
                          }}
                        >
                          <Edit3 color={colors.success} size={20} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.requirementActionButton, { backgroundColor: colors.errorLight }]}
                          onPress={async () => {
                            if (isWeb ? confirm('Voulez-vous vraiment supprimer ce document requis ?') : true) {
                              try {
                                await DocumentRequirementsApi.delete(req.id);
                                fetchRequirements();
                                showSuccessToast('Document requis supprimé');
                              } catch (error) {
                                console.error('Error deleting requirement:', error);
                                showErrorToast('Erreur lors de la suppression');
                              }
                            }
                          }}
                        >
                          <Trash2 color={colors.error} size={20} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

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

      {/* Modal de sélection de rôle pour approbation */}
      <Modal
        visible={showRoleSelectionModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => {
          setShowRoleSelectionModal(false);
          setSelectedMemberForApproval(null);
          setSelectedRoleId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner un rôle</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => {
                    setShowRoleSelectionModal(false);
                    setSelectedMemberForApproval(null);
                    setSelectedRoleId(null);
                  }}
                >
                  <X color="#64748b" size={24} />
                </TouchableOpacity>
              </View>

              {selectedMemberForApproval && (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>
                      Approuver {selectedMemberForApproval.name}
                    </Text>
                    <Text style={styles.modalSectionDescription}>
                      Sélectionnez le rôle à attribuer à ce membre
                    </Text>
                  </View>

                  {loadingRoles ? (
                    <View style={styles.loadingContainer}>
                      <Loader2 color="#2563eb" size={24} />
                      <Text style={styles.loadingText}>Chargement des rôles...</Text>
                    </View>
                  ) : (
                    <View style={styles.rolesContainer}>
                      {availableRoles.length === 0 ? (
                        <Text style={styles.noRolesText}>Aucun rôle disponible</Text>
                      ) : (
                        availableRoles.map((role) => (
                          <TouchableOpacity
                            key={role.id}
                            style={[
                              styles.roleOption,
                              selectedRoleId === role.id && styles.roleOptionActive
                            ]}
                            onPress={() => setSelectedRoleId(role.id)}
                          >
                            <View>
                              <Text style={[
                                styles.roleOptionText,
                                selectedRoleId === role.id && styles.roleOptionTextActive
                              ]}>
                                {role.displayName}
                              </Text>
                              {role.description && (
                                <Text style={styles.roleOptionDescription}>
                                  {role.description}
                                </Text>
                              )}
                            </View>
                            {selectedRoleId === role.id && (
                              <CheckCircle2 color="#2563eb" size={20} />
                            )}
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}

                  {/* Actions */}
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelAppointmentButton}
                      onPress={() => {
                        setShowRoleSelectionModal(false);
                        setSelectedMemberForApproval(null);
                        setSelectedRoleId(null);
                      }}
                    >
                      <Text style={styles.cancelAppointmentButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.confirmAppointmentButton,
                        !selectedRoleId && styles.confirmAppointmentButtonDisabled
                      ]}
                      onPress={confirmApproveMember}
                      disabled={!selectedRoleId}
                    >
                      <CheckCircle2 color="#fff" size={20} />
                      <Text style={styles.confirmAppointmentButtonText}>Approuver</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal pour ajouter/éditer un document requis - 2 étapes */}
      <Modal
        visible={showRequirementModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowRequirementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.requirementModalContent}>
            {/* Header */}
            <View style={styles.requirementModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.requirementModalTitle}>
                  {modalStep === 1 ? 'Choisir le type de document' : 'Configurer le document'}
                </Text>
                <Text style={styles.requirementModalSubtitle}>
                  {modalStep === 1
                    ? 'Sélectionnez un type de document dans la liste'
                    : 'Définissez les paramètres du document requis'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowRequirementModal(false)}
              >
                <X color={colors.gray[600]} size={24} />
              </TouchableOpacity>
            </View>

            {/* ÉTAPE 1 : Sélection du type de document */}
            {modalStep === 1 && (
              <>
                {/* Barre de recherche */}
                <View style={styles.searchSection}>
                  <View style={styles.searchInputContainer}>
                    <Search color={colors.gray[400]} size={18} />
                    <TextInput
                      style={styles.searchInput}
                      value={searchTypeQuery}
                      onChangeText={setSearchTypeQuery}
                      placeholder="Rechercher un type de document..."
                      placeholderTextColor={colors.gray[400]}
                    />
                  </View>

                  {/* Bouton pour créer un type personnalisé */}
                  <TouchableOpacity
                    style={styles.createTypeButton}
                    onPress={() => {
                      setShowRequirementModal(false);
                      setTimeout(() => setShowCreateTypeModal(true), 300);
                    }}
                  >
                    <Plus color={colors.purple} size={20} />
                    <Text style={styles.createTypeButtonText}>Créer un type personnalisé</Text>
                  </TouchableOpacity>
                </View>

                {/* Liste des types */}
                <ScrollView style={styles.typeListScroll} showsVerticalScrollIndicator={false}>
                  {loadingTypes ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.navy} />
                      <Text style={styles.loadingText}>Chargement des types...</Text>
                    </View>
                  ) : (
                    <View style={styles.typeList}>
                      {availableDocumentTypes
                        .filter(type =>
                          !searchTypeQuery ||
                          type.displayName?.toLowerCase().includes(searchTypeQuery.toLowerCase()) ||
                          type.name?.toLowerCase().includes(searchTypeQuery.toLowerCase()) ||
                          type.description?.toLowerCase().includes(searchTypeQuery.toLowerCase())
                        )
                        .map((type) => (
                          <TouchableOpacity
                            key={type.id}
                            style={styles.typeItem}
                            onPress={() => handleSelectType(type)}
                          >
                            <View style={styles.typeIconContainer}>
                              <FileText color={colors.navy} size={24} />
                            </View>
                            <View style={styles.typeInfo}>
                              <Text style={styles.typeName}>{type.displayName || type.name}</Text>
                              {type.description && (
                                <Text style={styles.typeDescription} numberOfLines={2}>
                                  {type.description}
                                </Text>
                              )}
                              {type.category && (
                                <View style={styles.typeCategoryBadge}>
                                  <Text style={styles.typeCategoryText}>{type.category}</Text>
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                        ))}

                      {availableDocumentTypes.filter(type =>
                        !searchTypeQuery ||
                        type.displayName?.toLowerCase().includes(searchTypeQuery.toLowerCase()) ||
                        type.name?.toLowerCase().includes(searchTypeQuery.toLowerCase())
                      ).length === 0 && (
                        <View style={styles.emptyState}>
                          <FileText color={colors.gray[400]} size={48} />
                          <Text style={styles.emptyStateText}>Aucun type de document trouvé</Text>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>

                {/* Bouton Annuler */}
                <View style={styles.requirementModalActions}>
                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={() => setShowRequirementModal(false)}
                  >
                    <Text style={styles.cancelModalButtonText}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* ÉTAPE 2 : Configuration du document */}
            {modalStep === 2 && (
              <>
                {/* Formulaire scrollable */}
                <ScrollView style={styles.requirementModalFormScroll} showsVerticalScrollIndicator={false}>
                  <View style={styles.requirementModalForm}>
                    {/* Nom du document */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Nom du document</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formCustomName}
                        onChangeText={setFormCustomName}
                        placeholder="Ex: Carte d'identité"
                        placeholderTextColor={colors.gray[400]}
                      />
                    </View>

                    {/* Description */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Description</Text>
                      <TextInput
                        style={[styles.formInput, styles.formTextarea]}
                        value={formCustomInstructions}
                        onChangeText={setFormCustomInstructions}
                        placeholder="Décrivez le document attendu..."
                        placeholderTextColor={colors.gray[400]}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                      />
                    </View>

                    {/* Pour qui & Quand (côte à côte) */}
                    <View style={styles.formRow}>
                      {/* Pour qui */}
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.formLabel}>Pour qui</Text>
                        <TouchableOpacity
                          style={styles.selectContainer}
                          onPress={() => {
                            const options = ['all', 'cadets', 'candidates', 'staff'];
                            const currentIndex = options.indexOf(formRequiredFor);
                            const nextIndex = (currentIndex + 1) % options.length;
                            setFormRequiredFor(options[nextIndex]);
                          }}
                        >
                          <Text style={styles.selectText}>
                            {formRequiredFor === 'all' ? 'Tous' :
                             formRequiredFor === 'cadets' ? 'Cadets' :
                             formRequiredFor === 'candidates' ? 'Candidats' : 'Staff'}
                          </Text>
                          <Text style={styles.selectHint}>(cliquer pour changer)</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Quand */}
                      <View style={[styles.formGroup, { flex: 1 }]}>
                        <Text style={styles.formLabel}>Quand</Text>
                        <TouchableOpacity
                          style={styles.selectContainer}
                          onPress={() => {
                            const options = ['registration', 'approval', 'anytime'];
                            const currentIndex = options.indexOf(formRequiredAt);
                            const nextIndex = (currentIndex + 1) % options.length;
                            setFormRequiredAt(options[nextIndex]);
                          }}
                        >
                          <Text style={styles.selectText}>
                            {formRequiredAt === 'registration' ? 'Inscription' :
                             formRequiredAt === 'approval' ? 'Approbation' : 'N\'importe quand'}
                          </Text>
                          <Text style={styles.selectHint}>(cliquer pour changer)</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Document modèle à télécharger */}
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Document modèle (optionnel)</Text>
                      <Text style={styles.formHint}>
                        Ajoutez un document que les candidats pourront télécharger (exemple: formulaire vierge, modèle à remplir)
                      </Text>

                      {/* Toggle Upload / Select */}
                      <View style={styles.templateModeToggle}>
                        <TouchableOpacity
                          style={[
                            styles.templateModeButton,
                            templateUploadMode === 'upload' && styles.templateModeButtonActive,
                          ]}
                          onPress={() => setTemplateUploadMode('upload')}
                        >
                          <Upload size={16} color={templateUploadMode === 'upload' ? colors.white : colors.gray[600]} />
                          <Text style={[
                            styles.templateModeButtonText,
                            templateUploadMode === 'upload' && styles.templateModeButtonTextActive,
                          ]}>
                            Uploader
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.templateModeButton,
                            templateUploadMode === 'select' && styles.templateModeButtonActive,
                          ]}
                          onPress={() => {
                            setTemplateUploadMode('select');
                            fetchAvailableDocuments();
                          }}
                        >
                          <FileText size={16} color={templateUploadMode === 'select' ? colors.white : colors.gray[600]} />
                          <Text style={[
                            styles.templateModeButtonText,
                            templateUploadMode === 'select' && styles.templateModeButtonTextActive,
                          ]}>
                            Choisir existant
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Preview du document sélectionné */}
                      {formTemplateDocumentId ? (
                        <View style={styles.templateDocumentPreview}>
                          <View style={styles.templateDocumentInfo}>
                            <FileText color={colors.navy} size={20} />
                            <Text style={styles.templateDocumentName}>
                              {availableDocuments.find(d => d.id === formTemplateDocumentId)?.name || 'Document sélectionné'}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.removeTemplateButton}
                            onPress={() => setFormTemplateDocumentId(null)}
                          >
                            <X color={colors.error} size={18} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          {/* Mode Upload */}
                          {templateUploadMode === 'upload' && (
                            <TouchableOpacity
                              style={styles.uploadTemplateButton}
                              onPress={handleUploadTemplateDocument}
                              disabled={uploadingTemplate}
                            >
                              {uploadingTemplate ? (
                                <ActivityIndicator size="small" color={colors.navy} />
                              ) : (
                                <>
                                  <Upload color={colors.navy} size={20} />
                                  <Text style={styles.uploadTemplateButtonText}>
                                    Télécharger un document modèle
                                  </Text>
                                </>
                              )}
                            </TouchableOpacity>
                          )}

                          {/* Mode Select */}
                          {templateUploadMode === 'select' && (
                            <View style={styles.documentSelectContainer}>
                              {availableDocuments.length === 0 ? (
                                <View style={styles.emptyDocumentsContainer}>
                                  <FileText color={colors.gray[400]} size={24} />
                                  <Text style={styles.emptyDocumentsText}>
                                    Aucun document disponible
                                  </Text>
                                </View>
                              ) : (
                                <ScrollView style={styles.documentList} nestedScrollEnabled>
                                  {availableDocuments.map((doc) => (
                                    <TouchableOpacity
                                      key={doc.id}
                                      style={styles.documentListItem}
                                      onPress={() => setFormTemplateDocumentId(doc.id)}
                                    >
                                      <FileText color={colors.navy} size={18} />
                                      <View style={styles.documentListItemText}>
                                        <Text style={styles.documentListItemName}>{doc.name}</Text>
                                        {doc.description && (
                                          <Text style={styles.documentListItemDesc} numberOfLines={1}>
                                            {doc.description}
                                          </Text>
                                        )}
                                      </View>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              )}
                            </View>
                          )}
                        </>
                      )}
                    </View>

                    {/* Checkbox Document obligatoire */}
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() => setFormIsRequired(!formIsRequired)}
                    >
                      <View style={[styles.checkbox, formIsRequired && styles.checkboxChecked]}>
                        {formIsRequired && <CheckCircle2 color={colors.white} size={16} />}
                      </View>
                      <Text style={styles.checkboxLabel}>Document obligatoire</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                {/* Boutons fixes en bas */}
                <View style={styles.requirementModalActions}>
                  <TouchableOpacity
                    style={styles.cancelModalButton}
                    onPress={() => setModalStep(1)}
                  >
                    <Text style={styles.cancelModalButtonText}>Retour</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitModalButton}
                    onPress={handleSaveRequirement}
                    disabled={savingRequirement}
                  >
                    {savingRequirement ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.submitModalButtonText}>
                        {selectedRequirement ? 'Modifier' : 'Ajouter'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Détails Candidature */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowRequestModal(false);
          setCandidatDocuments([]);
        }}
      >
        <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', maxWidth: 500, height: '85%', backgroundColor: colors.white, borderRadius: borderRadius.xl, ...shadows.lg }}>
            {/* Header avec gradient visuel */}
            <View style={{
              backgroundColor: colors.navy,
              padding: spacing.md,
              borderTopLeftRadius: borderRadius.xl,
              borderTopRightRadius: borderRadius.xl,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={[textStyles.h3, { color: colors.white, marginBottom: spacing.xs }]}>
                  Candidature
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <View style={{
                    backgroundColor: colors.badge.pending.background,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: borderRadius.full
                  }}>
                    <Text style={[textStyles.caption, { color: colors.badge.pending.text, fontSize: 11 }]}>
                      En attente
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowRequestModal(false);
                  setCandidatDocuments([]);
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  padding: spacing.xs,
                  borderRadius: borderRadius.full,
                }}
                activeOpacity={0.7}
              >
                <X color={colors.white} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1, padding: spacing.md }}>
              {selectedRequest && (
                <>
                  {/* Informations personnelles */}
                  <View style={{ marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
                      <View style={{
                        backgroundColor: colors.navy,
                        width: 3,
                        height: 16,
                        borderRadius: borderRadius.sm,
                      }} />
                      <Text style={[textStyles.h4, { color: colors.navy }]}>
                        Informations personnelles
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: colors.gray[200],
                      borderRadius: borderRadius.md,
                      overflow: 'hidden',
                    }}>
                      {/* Nom complet */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: spacing.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.gray[100],
                      }}>
                        <View style={{
                          backgroundColor: colors.infoLight,
                          padding: 6,
                          borderRadius: borderRadius.full,
                        }}>
                          <User color={colors.info} size={16} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[textStyles.caption, { color: colors.gray[500], fontSize: 11, marginBottom: 2 }]}>
                            Nom complet
                          </Text>
                          <Text style={[textStyles.bodyBold, { color: colors.gray[800], fontSize: 14 }]}>
                            {selectedRequest.firstname} {selectedRequest.lastname}
                          </Text>
                        </View>
                      </View>

                      {/* Email */}
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: spacing.sm,
                        padding: spacing.sm,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.gray[100],
                      }}>
                        <View style={{
                          backgroundColor: colors.warningLight,
                          padding: 6,
                          borderRadius: borderRadius.full,
                        }}>
                          <Mail color={colors.warning} size={16} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[textStyles.caption, { color: colors.gray[500], fontSize: 11, marginBottom: 2 }]}>
                            Email
                          </Text>
                          <Text style={[textStyles.body, { color: colors.gray[700], fontSize: 13 }]}>
                            {selectedRequest.email}
                          </Text>
                        </View>
                      </View>

                      {/* Téléphone */}
                      {selectedRequest.phone && (
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                          padding: spacing.sm,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.gray[100],
                        }}>
                          <View style={{
                            backgroundColor: colors.successLight,
                            padding: 6,
                            borderRadius: borderRadius.full,
                          }}>
                            <Phone color={colors.success} size={16} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[textStyles.caption, { color: colors.gray[500], fontSize: 11, marginBottom: 2 }]}>
                              Téléphone
                            </Text>
                            <Text style={[textStyles.body, { color: colors.gray[700], fontSize: 13 }]}>
                              {selectedRequest.phone}
                            </Text>
                          </View>
                        </View>
                      )}

                      {/* Date de naissance */}
                      {selectedRequest.dateOfBirth && (
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.sm,
                          padding: spacing.sm,
                        }}>
                          <View style={{
                            backgroundColor: colors.errorLight,
                            padding: 6,
                            borderRadius: borderRadius.full,
                          }}>
                            <Calendar color={colors.error} size={16} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[textStyles.caption, { color: colors.gray[500], fontSize: 11, marginBottom: 2 }]}>
                              Date de naissance
                            </Text>
                            <Text style={[textStyles.body, { color: colors.gray[700], fontSize: 13 }]}>
                              {new Date(selectedRequest.dateOfBirth).toLocaleDateString('fr-FR')}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Documents */}
                  <View style={{ marginBottom: spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <View style={{
                          backgroundColor: colors.navy,
                          width: 3,
                          height: 16,
                          borderRadius: borderRadius.sm,
                        }} />
                        <Text style={[textStyles.h4, { color: colors.navy }]}>
                          Documents
                        </Text>
                      </View>
                      {!loadingDocuments && candidatDocuments.length > 0 && (
                        <View style={{
                          backgroundColor: colors.successLight,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 2,
                          borderRadius: borderRadius.full,
                        }}>
                          <Text style={[textStyles.caption, { color: colors.successDark, fontSize: 11 }]}>
                            {candidatDocuments.length} doc{candidatDocuments.length > 1 ? 's' : ''}
                          </Text>
                        </View>
                      )}
                    </View>

                    {loadingDocuments && (
                      <View style={{
                        backgroundColor: colors.gray[50],
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.gray[200],
                        borderStyle: 'dashed',
                      }}>
                        <ActivityIndicator size="small" color={colors.navy} />
                        <Text style={[textStyles.body, { color: colors.gray[600], marginTop: spacing.sm, fontSize: 13 }]}>
                          Chargement...
                        </Text>
                      </View>
                    )}

                    {!loadingDocuments && candidatDocuments.length === 0 && (
                      <View style={{
                        backgroundColor: colors.gray[50],
                        padding: spacing.md,
                        borderRadius: borderRadius.md,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: colors.gray[200],
                        borderStyle: 'dashed',
                      }}>
                        <View style={{
                          backgroundColor: colors.white,
                          padding: spacing.sm,
                          borderRadius: borderRadius.full,
                          marginBottom: spacing.sm,
                        }}>
                          <FileCheck color={colors.gray[400]} size={24} />
                        </View>
                        <Text style={[textStyles.bodyBold, { color: colors.gray[700], fontSize: 13 }]}>
                          Aucun document
                        </Text>
                        <Text style={[textStyles.caption, { color: colors.gray[500], marginTop: 2, fontSize: 11 }]}>
                          Le candidat n'a envoyé aucun document
                        </Text>
                      </View>
                    )}

                    {!loadingDocuments && candidatDocuments.length > 0 && (
                      <View style={{ gap: spacing.sm }}>
                        {candidatDocuments.map((doc, index) => (
                          <View
                            key={index}
                            style={{
                              backgroundColor: colors.white,
                              borderWidth: 1,
                              borderColor: colors.gray[200],
                              borderRadius: borderRadius.md,
                              overflow: 'hidden',
                            }}
                          >
                            <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              padding: spacing.sm,
                              gap: spacing.sm,
                            }}>
                              <View style={{
                                backgroundColor: colors.successLight,
                                padding: spacing.sm,
                                borderRadius: borderRadius.md,
                              }}>
                                <FileCheck color={colors.success} size={18} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[textStyles.bodyBold, { color: colors.gray[800], fontSize: 13, marginBottom: 2 }]}>
                                  {doc.documentType?.name || doc.category || 'Document'}
                                </Text>
                                {doc.createdAt && (
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                                    <View style={{
                                      width: 4,
                                      height: 4,
                                      borderRadius: 2,
                                      backgroundColor: colors.success,
                                    }} />
                                    <Text style={[textStyles.caption, { color: colors.gray[500], fontSize: 11 }]}>
                                      {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                                    </Text>
                                  </View>
                                )}
                              </View>
                              {/* Boutons d'action */}
                              <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                                {/* Bouton Voir */}
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: colors.navy,
                                    padding: spacing.xs,
                                    borderRadius: borderRadius.sm,
                                  }}
                                  activeOpacity={0.7}
                                  onPress={() => handleViewDocument(doc)}
                                >
                                  <Eye color={colors.white} size={16} />
                                </TouchableOpacity>
                                {/* Bouton Télécharger */}
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: colors.success,
                                    padding: spacing.xs,
                                    borderRadius: borderRadius.sm,
                                  }}
                                  activeOpacity={0.7}
                                  onPress={() => handleDownloadDocument(doc)}
                                >
                                  <Download color={colors.white} size={16} />
                                </TouchableOpacity>
                                {/* Bouton Refuser */}
                                <TouchableOpacity
                                  style={{
                                    backgroundColor: colors.error,
                                    padding: spacing.xs,
                                    borderRadius: borderRadius.sm,
                                  }}
                                  activeOpacity={0.7}
                                  onPress={() => handleRejectDocument(doc)}
                                >
                                  <X color={colors.white} size={16} />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))}

                        {/* Bouton Ajouter un document */}
                        <TouchableOpacity
                          style={{
                            backgroundColor: colors.white,
                            borderWidth: 1.5,
                            borderColor: colors.navy,
                            borderStyle: 'dashed',
                            borderRadius: borderRadius.md,
                            paddingVertical: spacing.md,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: spacing.xs,
                            marginTop: spacing.xs,
                          }}
                          activeOpacity={0.7}
                          onPress={() => setShowAddDocumentModal(true)}
                        >
                          <Upload color={colors.navy} size={18} />
                          <Text style={[textStyles.bodyBold, { color: colors.navy, fontSize: 14 }]}>
                            Ajouter un document
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Actions */}
                  <View style={{
                    gap: spacing.sm,
                    paddingTop: spacing.md,
                    paddingBottom: spacing.md,
                    borderTopWidth: 1,
                    borderTopColor: colors.gray[200],
                  }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.success,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.xs,
                        ...shadows.sm,
                      }}
                      activeOpacity={0.8}
                      onPress={() => handleValidateRequest(selectedRequest.id)}
                    >
                      <FileCheck color={colors.white} size={18} />
                      <Text style={[textStyles.bodyBold, { color: colors.white, fontSize: 14 }]}>
                        Valider la candidature
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: colors.white,
                        borderWidth: 1.5,
                        borderColor: colors.error,
                        paddingVertical: spacing.sm,
                        borderRadius: borderRadius.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: spacing.xs,
                      }}
                      activeOpacity={0.8}
                      onPress={() => handleRejectRequest(selectedRequest.id)}
                    >
                      <X color={colors.error} size={18} />
                      <Text style={[textStyles.bodyBold, { color: colors.error, fontSize: 14 }]}>
                        Refuser
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Visualisation Document */}
      <DocumentViewerModal
        visible={showDocumentViewerModal}
        onClose={() => {
          // Libérer l'URL blob pour éviter les fuites mémoire
          if (viewerDocumentUrl && viewerDocumentUrl.startsWith('blob:')) {
            URL.revokeObjectURL(viewerDocumentUrl);
          }
          setShowDocumentViewerModal(false);
          setSelectedDocument(null);
          setViewerDocumentUrl(null);
          setViewerDocumentName('');
          setViewerDocumentMimeType('');
        }}
        documentUrl={viewerDocumentUrl}
        documentName={viewerDocumentName}
        mimeType={viewerDocumentMimeType}
        showDownload={true}
      />

      {/* Modal pour ajouter un document pour le candidat */}
      <Modal
        visible={showAddDocumentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddDocumentModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: spacing.md,
        }}>
          <View style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            width: '100%',
            maxWidth: 500,
            ...shadows.lg,
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.gray[200],
            }}>
              <Text style={[textStyles.h3, { color: colors.navy }]}>
                Ajouter un document
              </Text>
              <TouchableOpacity
                style={{ padding: spacing.xs }}
                onPress={() => setShowAddDocumentModal(false)}
              >
                <X color={colors.gray[600]} size={24} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={{ padding: spacing.lg }}>
              <Text style={[textStyles.body, { color: colors.gray[600], marginBottom: spacing.lg }]}>
                Ajoutez un document complémentaire au dossier de {selectedRequest?.name}.
                Les formats acceptés sont PDF, JPEG et PNG.
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.navy,
                  paddingVertical: spacing.md,
                  paddingHorizontal: spacing.lg,
                  borderRadius: borderRadius.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: spacing.sm,
                  ...shadows.sm,
                }}
                activeOpacity={0.8}
                onPress={handleUploadDocumentForCandidat}
                disabled={isUploadingDocument}
              >
                {isUploadingDocument ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <>
                    <Upload color={colors.white} size={20} />
                    <Text style={[textStyles.bodyBold, { color: colors.white }]}>
                      Sélectionner un fichier
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal pour créer un type de document personnalisé */}
      <Modal
        visible={showCreateTypeModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCreateTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxWidth: 600 }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Créer un type de document personnalisé
                </Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowCreateTypeModal(false)}
                >
                  <X color={colors.gray[600]} size={24} />
                </TouchableOpacity>
              </View>

              {/* Formulaire */}
              <View style={{ paddingHorizontal: spacing[6], paddingBottom: spacing[6], gap: spacing[5] }}>
                {/* Nom */}
                <View>
                  <Text style={styles.fieldLabel}>Nom du type de document *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={formTypeName}
                    onChangeText={setFormTypeName}
                    placeholder="Ex: Certificat médical spécifique"
                    placeholderTextColor={colors.gray[400]}
                  />
                </View>

                {/* Description */}
                <View>
                  <Text style={styles.fieldLabel}>Description / Instructions</Text>
                  <TextInput
                    style={[styles.fieldInput, { minHeight: 80, textAlignVertical: 'top', paddingTop: spacing[3] }]}
                    value={formTypeDescription}
                    onChangeText={setFormTypeDescription}
                    placeholder="Instructions pour ce type de document..."
                    placeholderTextColor={colors.gray[400]}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Catégorie */}
                <View>
                  <Text style={styles.fieldLabel}>Catégorie *</Text>
                  <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
                    {[
                      { value: 'identity', label: 'Identité' },
                      { value: 'medical', label: 'Médical' },
                      { value: 'parental_authorization', label: 'Autorisation parentale' },
                      { value: 'insurance', label: 'Assurance' },
                      { value: 'registration', label: 'Inscription' },
                      { value: 'certificate', label: 'Certificat' },
                      { value: 'administrative', label: 'Administratif' },
                      { value: 'training', label: 'Formation' },
                      { value: 'other', label: 'Autre' },
                    ].map((cat) => (
                      <TouchableOpacity
                        key={cat.value}
                        style={{
                          paddingHorizontal: spacing[3],
                          paddingVertical: spacing[2],
                          borderRadius: borderRadius.md,
                          backgroundColor: formTypeCategory === cat.value ? colors.navy : colors.gray[100],
                          borderWidth: 1,
                          borderColor: formTypeCategory === cat.value ? colors.navy : colors.gray[300],
                        }}
                        onPress={() => setFormTypeCategory(cat.value)}
                      >
                        <Text style={{
                          ...textStyles.bodySmall,
                          color: formTypeCategory === cat.value ? colors.white : colors.gray[700],
                        }}>
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Requis pour */}
                <View>
                  <Text style={styles.fieldLabel}>Requis pour</Text>
                  <View style={{ flexDirection: 'row', gap: spacing[2], flexWrap: 'wrap' }}>
                    {[
                      { value: 'all', label: 'Tous' },
                      { value: 'cadets', label: 'Cadets' },
                      { value: 'candidates', label: 'Candidats' },
                      { value: 'staff', label: 'Staff' },
                      { value: 'minors', label: 'Mineurs' },
                    ].map((type) => (
                      <TouchableOpacity
                        key={type.value}
                        style={{
                          paddingHorizontal: spacing[3],
                          paddingVertical: spacing[2],
                          borderRadius: borderRadius.md,
                          backgroundColor: formTypeRequiredFor === type.value ? colors.navy : colors.gray[100],
                          borderWidth: 1,
                          borderColor: formTypeRequiredFor === type.value ? colors.navy : colors.gray[300],
                        }}
                        onPress={() => setFormTypeRequiredFor(type.value)}
                      >
                        <Text style={{
                          ...textStyles.bodySmall,
                          color: formTypeRequiredFor === type.value ? colors.white : colors.gray[700],
                        }}>
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Séparateur */}
                <View style={{ height: 1, backgroundColor: colors.gray[200] }} />

                {/* Options */}
                <View style={{ gap: spacing[3] }}>
                  {/* Obligatoire */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing[3],
                    backgroundColor: colors.gray[50],
                    borderRadius: borderRadius.md,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Document obligatoire par défaut</Text>
                      <Text style={{ ...textStyles.caption, color: colors.gray[500], marginTop: spacing[1] }}>
                        Peut être modifié lors de l'ajout aux exigences
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: 50,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: formTypeIsRequired ? colors.success : colors.gray[300],
                        justifyContent: 'center',
                        paddingHorizontal: 2,
                      }}
                      onPress={() => setFormTypeIsRequired(!formTypeIsRequired)}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.white,
                          alignSelf: formTypeIsRequired ? 'flex-end' : 'flex-start',
                        }}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Nécessite validation */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing[3],
                    backgroundColor: colors.gray[50],
                    borderRadius: borderRadius.md,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Nécessite une validation</Text>
                      <Text style={{ ...textStyles.caption, color: colors.gray[500], marginTop: spacing[1] }}>
                        Le document doit être approuvé par un staff
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: 50,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: formTypeRequiresValidation ? colors.success : colors.gray[300],
                        justifyContent: 'center',
                        paddingHorizontal: 2,
                      }}
                      onPress={() => setFormTypeRequiresValidation(!formTypeRequiresValidation)}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.white,
                          alignSelf: formTypeRequiresValidation ? 'flex-end' : 'flex-start',
                        }}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* A une expiration */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: spacing[3],
                    backgroundColor: colors.gray[50],
                    borderRadius: borderRadius.md,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.fieldLabel}>Le document expire</Text>
                      <Text style={{ ...textStyles.caption, color: colors.gray[500], marginTop: spacing[1] }}>
                        Document avec date d'expiration
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{
                        width: 50,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: formTypeHasExpiration ? colors.success : colors.gray[300],
                        justifyContent: 'center',
                        paddingHorizontal: 2,
                      }}
                      onPress={() => setFormTypeHasExpiration(!formTypeHasExpiration)}
                    >
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.white,
                          alignSelf: formTypeHasExpiration ? 'flex-end' : 'flex-start',
                        }}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Durée de validité (si expiration) */}
                  {formTypeHasExpiration && (
                    <View>
                      <Text style={styles.fieldLabel}>Durée de validité (jours)</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={formTypeValidityDays}
                        onChangeText={setFormTypeValidityDays}
                        placeholder="Ex: 365"
                        placeholderTextColor={colors.gray[400]}
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </View>

                {/* Boutons d'action */}
                <View style={{ flexDirection: 'row', gap: spacing[3], marginTop: spacing[4] }}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton, { flex: 1 }]}
                    onPress={() => setShowCreateTypeModal(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Annuler</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalSaveButton, { flex: 1 }]}
                    onPress={handleSaveCustomType}
                    disabled={savingType}
                  >
                    {savingType ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <>
                        <Save color={colors.white} size={18} />
                        <Text style={styles.modalSaveButtonText}>Créer</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </ScrollView>

      {/* Toast */}
      <Toast
        visible={showToast}
        message={toastMessage}
        type={toastType}
        onHide={() => setShowToast(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // HEADER
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
    paddingHorizontal: spacing[6],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  // TAB NAVIGATION
  topNavigation: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[2],
    gap: spacing[2],
  },
  navTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 0,
    backgroundColor: 'transparent',
  },
  navTabActive: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    ...shadows.card,
  },
  navTabText: {
    ...textStyles.body,
    color: colors.gray[600],
    fontWeight: '500',
  },
  navTabTextActive: {
    color: colors.navy,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing[6],
    paddingTop: spacing[8],
  },
  // New Design: Page Layout
  pageContent: {
    padding: spacing[6],
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[6],
  },
  pageTitle: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  pageSubtitle: {
    ...textStyles.bodySmall,
    color: colors.gray[600],
  },
  modifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.foreground,
    backgroundColor: colors.white,
  },
  modifyButtonText: {
    ...textStyles.label,
    color: colors.foreground,
    fontSize: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cancelButtonText: {
    ...textStyles.label,
    color: colors.gray[600],
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.navy,
  },
  saveButtonText: {
    ...textStyles.label,
    color: colors.white,
  },
  cancelEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.gray[100],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
  },
  cancelEditButtonText: {
    ...textStyles.button,
    color: colors.gray[700],
  },
  saveEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.navy,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
  },
  saveEditButtonText: {
    ...textStyles.button,
    color: colors.white,
  },
  // New Design: Information Card
  infoCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[6],
    ...shadows.card,
    marginBottom: spacing[6],
  },
  infoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[6],
  },
  infoCardTitle: {
    ...textStyles.h2,
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  infoCardSubtitle: {
    ...textStyles.body,
    color: colors.gray[600],
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  infoColumn: {
    flex: 1,
    gap: spacing[5],
  },
  infoField: {
    gap: spacing[2],
  },
  infoFieldLabel: {
    ...textStyles.caption,
    color: colors.gray[600],
    fontWeight: '500',
  },
  infoFieldValue: {
    ...textStyles.body,
    color: colors.foreground,
    fontSize: 16,
  },
  infoFieldValueSecondary: {
    ...textStyles.caption,
    color: colors.gray[600],
    fontSize: 14,
  },
  infoFieldValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoFieldInput: {
    ...textStyles.body,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.background,
  },
  locationRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  postalCodeInput: {
    flex: 0.3,
  },
  cityInput: {
    flex: 0.7,
  },
  departmentHint: {
    ...textStyles.caption,
    color: colors.gray[500],
    marginTop: spacing[1],
  },
  // New Design: Stats Cards
  statsContainer: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    ...shadows.card,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
    lineHeight: 38,
  },
  statValue: {
    ...textStyles.h2,
    color: colors.navy,
    marginBottom: spacing[1],
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.gray[600],
    marginTop: spacing[1],
    fontSize: 14,
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
  oldStatCard: {
    alignItems: 'center',
    flex: 1,
  },
  oldStatValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  oldStatLabel: {
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
  confirmAppointmentButtonDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.6,
  },
  modalSectionDescription: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
  },
  rolesContainer: {
    gap: 10,
    marginTop: 16,
    marginBottom: 24,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  roleOptionDescription: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748b',
  },
  noRolesText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    padding: 24,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  roleOptionActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  roleOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
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
  centeredLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  centeredLoadingText: {
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
  pendingMemberCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pendingMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f59e0b',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  oldStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberDetails: {
    gap: 10,
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 12,
  },
  oldRejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  oldRejectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  oldApproveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  oldApproveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // TABLE STYLES (CADEP Design)
  tableContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.muted,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    ...textStyles.label,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  tableCell: {
    justifyContent: 'center',
  },
  tableCellText: {
    ...textStyles.body,
    color: colors.foreground,
  },
  tableActionButton: {
    padding: spacing[2],
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
  },
  // Additional table styles
  pageHeaderLeft: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.muted,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
    minWidth: 300,
  },
  searchInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.foreground,
  },
  tableCellSubtext: {
    ...textStyles.caption,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
    gap: spacing[3],
  },
  emptyTitle: {
    ...textStyles.h3,
    color: colors.gray[600],
  },
  emptyText: {
    ...textStyles.body,
    color: colors.gray[500],
    textAlign: 'center',
  },
  // Document Requirements Section
  requirementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[6],
  },
  requirementsTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  requirementsSubtitle: {
    ...textStyles.body,
    color: colors.gray[600],
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.foreground,
    backgroundColor: colors.white,
  },
  addButtonText: {
    ...textStyles.label,
    color: colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  requirementsList: {
    gap: spacing[4],
  },
  requirementCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[4],
    ...shadows.card,
  },
  requirementIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  requirementContent: {
    flex: 1,
    gap: spacing[2],
  },
  requirementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  requirementTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
  },
  requiredBadge: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
  },
  requiredBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray[700],
  },
  requirementDescription: {
    ...textStyles.body,
    color: colors.gray[600],
    fontSize: 16,
    lineHeight: 24,
  },
  requirementMeta: {
    flexDirection: 'row',
    gap: spacing[6],
    marginTop: spacing[1],
  },
  requirementMetaText: {
    ...textStyles.caption,
    color: colors.gray[500],
    fontSize: 14,
  },
  requirementActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  requirementActionButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Modal nouvelle version simplifiée
  requirementModalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius['2xl'],
    width: '90%',
    maxWidth: 500,
    maxHeight: '70%',
  },
  requirementModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing[6],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  requirementModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing[1],
  },
  requirementModalSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  requirementModalFormScroll: {
    flex: 1,
  },
  requirementModalForm: {
    padding: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[4],
  },
  formGroup: {
    gap: spacing[2],
  },
  formLabel: {
    ...textStyles.label,
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  formInput: {
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.white,
  },
  formTextarea: {
    minHeight: 80,
    paddingTop: spacing[2],
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  selectContainer: {
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    backgroundColor: colors.white,
  },
  selectText: {
    fontSize: 15,
    color: colors.foreground,
  },
  selectHint: {
    fontSize: 11,
    color: colors.gray[400],
    marginTop: spacing[1],
  },
  formHint: {
    fontSize: 13,
    color: colors.gray[500],
    marginBottom: spacing[3],
    lineHeight: 18,
  },
  uploadTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    backgroundColor: colors.navyLight,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 2,
    borderColor: colors.navy,
    borderStyle: 'dashed',
  },
  uploadTemplateButtonText: {
    fontSize: 14,
    color: colors.navy,
    fontWeight: '600',
  },
  templateDocumentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.successLight,
    borderRadius: borderRadius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.success,
  },
  templateDocumentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  templateDocumentName: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
  },
  removeTemplateButton: {
    padding: spacing[1],
  },
  templateModeToggle: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  templateModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },
  templateModeButtonActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  templateModeButtonText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '600',
  },
  templateModeButtonTextActive: {
    color: colors.white,
  },
  documentSelectContainer: {
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.muted,
    maxHeight: 200,
  },
  documentList: {
    maxHeight: 200,
  },
  documentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  documentListItemText: {
    flex: 1,
  },
  documentListItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing[0.5],
  },
  documentListItemDesc: {
    fontSize: 12,
    color: colors.gray[600],
  },
  emptyDocumentsContainer: {
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDocumentsText: {
    fontSize: 14,
    color: colors.gray[500],
    marginTop: spacing[2],
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[400],
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.info,
    borderColor: colors.info,
  },
  checkboxLabel: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '500',
  },
  requirementModalActions: {
    flexDirection: 'row',
    gap: spacing[3],
    padding: spacing[5],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    justifyContent: 'flex-end',
  },
  cancelModalButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.foreground,
    backgroundColor: colors.white,
  },
  cancelModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  submitModalButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[5],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.navy,
  },
  submitModalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  // Styles pour l'étape 1 - Sélection du type
  searchSection: {
    padding: spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing[3],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    backgroundColor: colors.white,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.foreground,
    paddingVertical: spacing[2],
    minHeight: 40,
  },
  createTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.purple,
    backgroundColor: colors.purpleLight,
  },
  createTypeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.purple,
  },
  typeListScroll: {
    flex: 1,
  },
  typeList: {
    padding: spacing[5],
    gap: spacing[3],
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.navyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
    gap: spacing[1],
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  typeDescription: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
  typeCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.purpleLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginTop: spacing[1],
  },
  typeCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.purple,
  },
  // Styles pour la modal de création de type personnalisé
  fieldLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  fieldInput: {
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.white,
  },
  modalButton: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  modalCancelButton: {
    borderWidth: 2,
    borderColor: colors.foreground,
    backgroundColor: colors.white,
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  modalSaveButton: {
    backgroundColor: colors.navy,
  },
  modalSaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});
