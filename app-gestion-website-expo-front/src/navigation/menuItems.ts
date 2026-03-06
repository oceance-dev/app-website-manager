import { MenuItem } from "../types";


// Menu items avec permissions par rôle
export const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'home', screen: 'Dashboard', roles: ['Super Administrateur', 'Administrateur', 'Président', 'Directeur de Formation', 'Trésorier', 'Encadrant'] },
  { id: 'documents', label: 'Documents', icon: 'folder', screen: 'Documents', roles: ['Super Administrateur', 'Administrateur', 'Président', 'Directeur de Formation', 'Trésorier', 'Encadrant'] },
  { id: 'mes-documents', label: 'Mes documents', icon: 'folder', screen: 'CandidatDocuments', roles: ['Candidat'] },
  // { id: 'cours', label: 'Cours', icon: 'book-open', screen: 'Courses', roles: ['Super Administrateur', 'Administrateur', 'Président', 'Directeur de Formation', 'Encadrant'] },
  { id: 'organisation', label: 'Mon Association', icon: 'building-2', screen: 'Organization', roles: ['Super Administrateur', 'Administrateur', 'Président'] },
  // { id: 'utilisateurs', label: 'Utilisateurs', icon: 'users', screen: 'Users', roles: ['Super Administrateur', 'Administrateur', 'Président'] },
  // { id: 'cadet', label: 'Cadets', icon: 'users', screen: 'Cadet', roles: ['Super Administrateur', 'Administrateur', 'Président', 'Directeur de Formation', 'Encadrant'] },
  // { id: 'parametres', label: 'Paramètres', icon: 'settings', screen: 'Settings', roles: ['Super Administrateur', 'Administrateur', 'Président', 'Directeur de Formation', 'Trésorier', 'Encadrant', 'Candidat'] },
];