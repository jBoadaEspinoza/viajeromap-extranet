import { apiGet } from './apiConfig';
import { apiPost } from './apiConfig';
import { ActivityImage } from './activities';

export interface DeleteImageResponse {
    success: boolean;
    message: string;
}

export interface ImageResponse {
    success: boolean;
    message: string;
    data: ActivityImage | null;
}

export const imagesApi = {
    deleteImage: async (imageId: number): Promise<DeleteImageResponse> => {
        try {
            const response = await apiPost<DeleteImageResponse>(`/images/${imageId}/delete`);
            if (response && typeof response === 'object') {
                if ('success' in response && 'message' in response) {
                    return response as DeleteImageResponse;
                }
                const responseAny = response as any;
                if (responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data) {
                    return responseAny.data as DeleteImageResponse;
                }
            }
            return response;
        } catch (error: any) {
            console.error('Images API: Error deleting image:', error);
            return {
                success: false,
                message: 'Error deleting image'
            };
        }
    },
    getImageById: async (imageId: number): Promise<ImageResponse> => {
        try {
            const response = await apiGet<ImageResponse>(`/images/${imageId}`);
            if (response && typeof response === 'object') {
                if ('success' in response && 'message' in response) {
                    return response as ImageResponse;
                }
                const responseAny = response as any;
                if (responseAny && typeof responseAny === 'object' && 'data' in responseAny && responseAny.data) {
                    return responseAny.data as ImageResponse;
                }
            }
            return response;
        } catch (error: any) {
            console.error('Images API: Error getting image by id:', error);
            return {
                success: false,
                message: 'Error getting image by id',
                data: null
            };
        }
    }
};
