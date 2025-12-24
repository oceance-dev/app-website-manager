// ============================================
// Types pour les réponses API - Cadets
// ============================================

import { PaginationParams } from "../types";

export interface CadetResponse {
    id: string | number;  // Le backend envoie string, on accepte les deux
    lastname: string;
    firstname: string;
    email: string;
    role: 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet';
    status: 'Actif' | 'Inactif';  // Backend utilise "status" au lieu de "statut"
    dateOfBirth: string;  // Backend utilise "dateOfBirth" (format: DD/MM/YYYY)
    sexe?: number;
    phone: string;
    phoneParent?: string;  // Téléphone du parent
    courseAccess?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  export interface GetAllCadetsResponse {
    cadets: CadetResponse[];
    total: number;
  }
  
  export interface GetCadetByIdResponse {
    cadet: CadetResponse;
  }
  
  export interface UpdateCadetRoleRequest {
    role: 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet';
  }
  
  export interface UpdateCadetRoleResponse {
    cadet: CadetResponse;
    message: string;
  }
  
  export interface CadetsFilterParams extends PaginationParams {
    role?: 'Cadet' | 'Cadet Breveté' | 'Ancien Cadet';
    statut?: 'Actif' | 'Inactif';
    search?: string;
  }