import { Document, User, MenuItem } from '../types';

export const initialDocuments: Document[] = [
  { id: 1, nameDoc: 'Rapport_Q1.pdf', length: '2.4 MB', date: '2025-03-15', type: 'PDF' },
  { id: 2, nameDoc: 'Présentation.pptx', length: '5.1 MB', date: '2025-03-10', type: 'PPTX' },
  { id: 3, nameDoc: 'Budget_2025.xlsx', length: '1.2 MB', date: '2025-02-28', type: 'XLSX' }
];

export const initialUtilisateurs: User[] = [
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
  },
  { 
    id: 3, 
    lastname: 'Bob', 
    firstname: 'Pierre',
    email: 'pierre.martin@exemple.fr', 
    role: 'Cadet', 
    statut: 'Actif',
    dateOfbirth: '2009-08-22',
    sexe: 0,
    phone: '+33 6 98 76 54 32',
  }
];

export const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'home', screen: 'Dashboard' },
  { id: 'documents', label: 'Documents', icon: 'folder', screen: 'Documents' },
  { id: 'utilisateurs', label: 'Utilisateurs', icon: 'users', screen: 'Users' },
  { id: 'cadet', label: 'Cadet', icon: 'users', screen: 'Cadet'},
  { id: 'statistiques', label: 'Statistiques', icon: 'bar-chart-2', screen: 'Statistics' },
  { id: 'parametres', label: 'Paramètres', icon: 'settings', screen: 'Settings' },
];