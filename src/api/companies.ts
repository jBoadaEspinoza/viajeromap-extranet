import { apiClient } from './apiClient';

export interface CompanyData {
  ruc: number;
  name: string;
  logoUrl: string;
  address: string;
  latitude: number;
  longitude: number;
  linkReviewGoogleMap: string;
  whatsappNumber: string;
  isActive: boolean;
}

export interface CompanyResponse {
  success: boolean;
  message: string;
  data: CompanyData;
}

export const companiesApi = {
  getCompany: async (ruc: string): Promise<CompanyResponse> => {
    const response = await apiClient.get(`/companies/${ruc}`);
    return response.data;
  },
}; 