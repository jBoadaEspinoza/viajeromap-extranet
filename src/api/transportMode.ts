import { apiGet } from './apiConfig';

export interface TransportMode {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

export interface TransportModeResponse {
    success: boolean;
    data: TransportMode[];
    totalElements: number;
    totalPages: number;
    pageSize: number;
    currentPage: number;
    nextPage?: number;
}

export const transportModeApi = {
    getTransportModes: async (
        lang: string = 'es',
        sortBy: string = 'name',
        sortOrder: string = 'asc'
    ): Promise<TransportModeResponse> => {
        try {
            const url = '/transport-modes';
            const params = { lang, sortBy, sortOrder };
            const response = await apiGet<TransportModeResponse>(url, { params });
            
            if (response && response.success && Array.isArray(response.data)) {
                return response;
            } else {
                throw new Error('Respuesta inválida del servidor al obtener modos de transporte');
            }
        } catch (error) {
            console.error('Error al obtener los modos de transporte:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Error desconocido al obtener modos de transporte'
            );
        }
    },
};   