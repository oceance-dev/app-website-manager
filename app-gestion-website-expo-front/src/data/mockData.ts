import { Document, User, Folder } from '../types';

export const initialFolders: Folder[] = [
  {
    id: 1,
    name: 'Administratif',
    parentId: null,
    createdBy: 1,
    createdAt: '2025-01-15',
    permissions: [
      { userId: 1, role: 'admin' },
      { userId: 4, role: 'editor' },
      { userId: 3, role: 'viewer' }
    ]
  },
  {
    id: 2,
    name: 'Comptabilité',
    parentId: 1,
    createdBy: 1,
    createdAt: '2025-01-15',
    permissions: [
      { userId: 1, role: 'admin' },
      { userId: 5, role: 'admin' }
    ]
  },
  {
    id: 3,
    name: 'Formations',
    parentId: null,
    createdBy: 2,
    createdAt: '2025-01-20',
    permissions: [
      { userId: 1, role: 'admin' },
      { userId: 2, role: 'admin' },
      { userId: 3, role: 'editor' }
    ]
  },
  {
    id: 4,
    name: 'Rapports',
    parentId: null,
    createdBy: 1,
    createdAt: '2025-02-01',
    permissions: [
      { userId: 1, role: 'admin' },
      { userId: 4, role: 'editor' },
      { userId: 2, role: 'viewer' },
      { userId: 3, role: 'viewer' }
    ]
  }
];

export const initialDocuments: Document[] = [
  {
    id: 1,
    nameDoc: 'Rapport_Q1.pdf',
    folderId: 4,
    length: '2.4 MB',
    date: '2025-03-15',
    type: 'PDF',
    uploadedBy: 1
  },
  {
    id: 2,
    nameDoc: 'Présentation.pptx',
    folderId: 3,
    length: '5.1 MB',
    date: '2025-03-10',
    type: 'PPTX',
    uploadedBy: 2
  },
  {
    id: 3,
    nameDoc: 'Budget_2025.xlsx',
    folderId: 2,
    length: '1.2 MB',
    date: '2025-02-28',
    type: 'XLSX',
    uploadedBy: 5
  }
];

// Documents de cours avec permissions
export const courseDocuments: Document[] = [
  {
    id: 100,
    nameDoc: 'Introduction_Cadets.pdf',
    folderId: 3,
    length: '3.2 MB',
    date: '2025-01-10',
    type: 'PDF',
    uploadedBy: 2,
    permissions: [
      { userId: 3, canAccess: true },
    ]
  },
  {
    id: 101,
    nameDoc: 'Techniques_Base.pdf',
    folderId: 3,
    length: '4.5 MB',
    date: '2025-01-15',
    type: 'PDF',
    uploadedBy: 2,
    permissions: [
      { userId: 3, canAccess: true },
    ]
  },
  {
    id: 102,
    nameDoc: 'Leadership_Guide.pdf',
    folderId: 3,
    length: '2.8 MB',
    date: '2025-02-01',
    type: 'PDF',
    uploadedBy: 2,
    permissions: []  // Personne n'a accès pour le moment
  },
  {
    id: 103,
    nameDoc: 'Preparation_Brevet.pdf',
    folderId: 3,
    length: '5.1 MB',
    date: '2025-02-10',
    type: 'PDF',
    uploadedBy: 2,
    permissions: []  // Personne n'a accès pour le moment
  },
];

export const initialUtilisateurs: User[] = [
  {
    id: 0,
    lastname: 'SuperAdmin',
    firstname: 'Admin',
    email: 'superadmin@cadetapp.fr',
    role: 'SuperAdmin',
    statut: 'Actif',
    dateOfbirth: '1980-01-01',
    sexe: 0,
    phone: '+33 6 00 00 00 00',
    courseAccess: true,
  },
  {
    id: 1,
    lastname: 'Dupont',
    firstname: 'Marie',
    email: 'marie.dupont@exemple.fr',
    role: 'Admin',
    statut: 'Actif',
    dateOfbirth: '1990-05-15',
    sexe: 1,
    phone: '+33 6 12 34 56 78',
    courseAccess: true,
  },
  {
    id: 2,
    lastname: 'Martin',
    firstname: 'Pierre',
    email: 'pierre.martin@exemple.fr',
    role: 'Encadrant',
    statut: 'Actif',
    dateOfbirth: '1985-08-22',
    sexe: 0,
    phone: '+33 6 98 76 54 32',
    courseAccess: true,
  },
  {
    id: 3,
    lastname: 'Bob',
    firstname: 'Pierre',
    email: 'pierre.bob@exemple.fr',
    role: 'Cadet',
    statut: 'Actif',
    dateOfbirth: '2009-08-22',
    sexe: 0,
    phone: '+33 6 98 76 54 32',
    courseAccess: true,
  },
  {
    id: 4,
    lastname: 'Leroy',
    firstname: 'Jean',
    email: 'jean.leroy@exemple.fr',
    role: 'Président',
    statut: 'Actif',
    dateOfbirth: '1975-03-10',
    sexe: 0,
    phone: '+33 6 11 22 33 44',
    courseAccess: false,
  },
  {
    id: 5,
    lastname: 'Bernard',
    firstname: 'Sophie',
    email: 'sophie.bernard@exemple.fr',
    role: 'Trésorier',
    statut: 'Actif',
    dateOfbirth: '1982-11-25',
    sexe: 1,
    phone: '+33 6 55 66 77 88',
    courseAccess: false,
  },
  {
    id: 6,
    lastname: 'Durand',
    firstname: 'Lucas',
    email: 'lucas.durand@exemple.fr',
    role: 'Candidat',
    statut: 'Actif',
    dateOfbirth: '2010-04-18',
    sexe: 0,
    phone: '+33 6 12 34 56 90',
    courseAccess: false,
  }
];
