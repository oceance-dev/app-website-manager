import {
    API_CONFIG,
    ApiResponse,
    PaginatedResponse,
    getAuthHeaders,
    handleApiResponse,
  } from './config';
import { RegisterCandidatRequest, RegisterCandidatResponse } from './types';


export class CandidatApi {

    private static baseUrl = `${API_CONFIG.BASE_URL}/candidats`;


    /*static async getAllCandidats(
        params?: CandidatFilterParams,
        //data: RegisterCandidatRequest,
        token?: string
    ): Promise<ApiResponse<RegisterCandidatResponse>> {
        try {

            const queryParams = new URLSearchParams();

            if (params?.page) queryParams.append('page', params.page.toString());
            if (params?.limit) queryParams.append('limit', params.limit.toString());
            if (params?.role) queryParams.append('role', params.role);
            if (params?.statut) queryParams.append('statut', params.statut);
            if (params?.search) queryParams.append('search', params.search);
            const response = await fetch(`${this.baseUrl}`, {
                method: 'GET',
                headers: getAuthHeaders(token),
            });
        }
    } */

    static async registerCandidat(
        data: RegisterCandidatRequest,
    ) : Promise<ApiResponse<RegisterCandidatResponse>> {
        try {
            const response = await fetch(`${this.baseUrl}`, {
                method: 'POST',
                headers: getAuthHeaders(token),
                body: JSON.stringify(data),
            });
        } catch (error) {
            console.error(`Error registering candidat:`, error);
            throw error;
        }
    }
}