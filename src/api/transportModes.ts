import { apiGet } from './apiConfig';

export interface TransportMode {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

// Constantes para modos de transporte comunes
export const TRANSPORT_MODE_IDS = {
    CAR: 1,
    VAN: 2,
    BUS: 3,
    MINIBUS: 4,
    MOTORCYCLE: 5,
    BICYCLE: 6,
    WALKING: 7,
    OTHER: 8
} as const;

export type TransportModeId = typeof TRANSPORT_MODE_IDS[keyof typeof TRANSPORT_MODE_IDS];

export interface TransportModesParams {
    lang?: string;
    sortBy?: string;
    sortDirection?: string;
}

export interface GetTransportModesResponse {
    success: boolean;
    data: TransportMode[];
    totalElements: number;
    totalPages: number;
    pageSize: number;
    currentPage: number;
}

export const transportModesApi = {
    getTransportModes: async (params: TransportModesParams = {}): Promise<GetTransportModesResponse> => {
        const { lang, sortBy, sortDirection } = params;
        
        // Construir los parámetros de consulta
        const queryParams: Record<string, string> = {};
        if (lang) queryParams.lang = lang;
        if (sortBy) queryParams.sortBy = sortBy;
        if (sortDirection) queryParams.sortDirection = sortDirection;
        
        try {
            const response = await apiGet<GetTransportModesResponse>('/transport-modes', { 
                params: queryParams 
            });
            
            if (response && response.success && Array.isArray(response.data)) {
                return response;
            } else {
                throw new Error('Respuesta inválida del servidor al obtener modos de transporte');
            }
        } catch (error) {
            console.error('Error en getTransportModes:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Error desconocido al obtener modos de transporte'
            );
        }
    },

    getTransportModeById: async (id: number): Promise<TransportMode> => {
        try {
            const response = await apiGet<{ success: boolean; data: TransportMode }>(`/transport-modes/${id}`);
            
            if (response && response.success && response.data) {
                return response.data;
            } else {
                throw new Error(`Modo de transporte con ID ${id} no encontrado`);
            }
        } catch (error) {
            console.error(`Error en getTransportModeById(${id}):`, error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : `Error al obtener el modo de transporte con ID ${id}`
            );
        }
    }
};