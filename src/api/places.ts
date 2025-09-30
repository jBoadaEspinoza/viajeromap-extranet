import { apiGet } from './apiConfig';

export interface Place {
    id: number;
    cityName: string;
    countryId: string;
    latitude: number;
    longitude: number;
    active: boolean;
    activityCount: number;
    imageUrl?: string;
}

export interface PlaceInfoResponse{
    description: string;
    currentTemperature: String;
    pointsOfInterest: string[];
}

export const placesApi = {
    getPlaces: async (): Promise<Place[]> => {
        try {
            const response = await apiGet<Place[]>('/places');
            
            // Handle different response formats
            if (Array.isArray(response)) {
                return response;
            }
            
            // If response has a data property, extract it
            if (response && typeof response === 'object' && 'data' in response) {
                const data = (response as any).data;
                if (Array.isArray(data)) {
                    return data;
                }
            }
            
            // If response has success property and is false, throw error
            if (response && typeof response === 'object' && 'success' in response && !(response as any).success) {
                throw new Error((response as any).message || 'Error al cargar las ciudades');
            }
            
            // Fallback: return empty array if response format is unexpected
            console.warn('Unexpected response format from places API:', response);
            return [];
            
        } catch (error) {
            console.error('Error fetching places:', error);
            throw new Error('Error al cargar las ciudades disponibles');
        }
    },
    getInfoByIA: async(placeId: number, lang: string): Promise<PlaceInfoResponse> => {
        try {
            const response = await apiGet<PlaceInfoResponse>(`/places/${placeId}/getInfo?lang=${lang}`);
            
            // Handle different response formats
            if (response && typeof response === 'object') {
                // If response has a data property, extract it
                if ('data' in response) {
                    return (response as any).data;
                }
                
                // If response has success property and is false, throw error
                if ('success' in response && !(response as any).success) {
                    throw new Error((response as any).message || 'Error al obtener información de IA');
                }
                
                // Return the response directly if it matches PlaceInfoResponse structure
                if ('description' in response && 'currentTemperature' in response && 'pointsOfInterest' in response) {
                    return response;
                }
            }
            
            // Fallback: return default structure if response format is unexpected
            console.warn('Unexpected response format from getInfoByIA API:', response);
            return {
                description: 'Información no disponible',
                currentTemperature: 'N/A',
                pointsOfInterest: []
            };
            
        } catch (error) {
            console.error('Error fetching place info by IA:', error);
            throw new Error('Error al cargar la información de IA de la ciudad');
        }
    }
}
