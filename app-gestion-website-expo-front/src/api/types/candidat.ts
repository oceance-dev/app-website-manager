
///
// Types pour les réponses API - Candidats
// ============================================

export interface RegisterCandidatRequest {
    lastname: string;
    firstname: string;
    email: string;
    emailParent?: string;
    password: string;
    phone?: string;
    cityCode?: string;
    dateOfbirth?: string;
    sexe?: number;
}

export interface RegisterCandidatResponse {
    candidat: RegisterCandidatRequest;
    message: string;
}

export interface GetAllCandidatsResponse {
    candidats: RegisterCandidatRequest[];
    total: number;
}