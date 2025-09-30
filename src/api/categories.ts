import { apiGet } from './apiConfig';

export interface Category {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
}

export interface CategoriesResponse {
    success: boolean;
    totalElements: number;
    totalPages: number;
    pageSize: number;
    currentPage: number;
    data: Category[];
}

export interface CategoryParams {
    lang?: string;
    page?: number;
    size?: number;
    
}


export const categoriesApi = {
    getCategories: async (params: CategoryParams): Promise<CategoriesResponse> => {
        try{ 
            const categoryParams = {
                ...params
            }
            const response = await apiGet<CategoriesResponse>('/categories', {params: categoryParams});
            return response;
        } catch (error: any) {
            console.error('Activities API: Error fetching categories:', error);
            
            // Retornar una respuesta de error en lugar de lanzar la excepción
            return {
              success: false,
              data: [],
              totalElements: 0,
              totalPages: 0,
              pageSize: params.size || 10,
              currentPage: params.page || 0
            };
          }
    }
}