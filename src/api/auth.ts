import { apiClient } from './apiClient';

// Interfaces para las respuestas de autenticación
export interface LoginRequest {
  username: string;
  password: string;
  ruc: string;
  lang: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  tokenType?: string;
  tokenExpirationMessage?: string;
  tokenExpirationInSeg?: string;
}

export interface User {
  id: number;
  username: string;
  nickname: string;
  profileImageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
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

export interface Role {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface TokenInfoResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    company: Company;
    role: Role;
    lang: string;
    currency: string | null;
  };
  errorCode?: string;
}

// Funciones de autenticación
export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error en el inicio de sesión'
      };
    }
  },

  // Validar token
  validateToken: async (lang: string = 'es'): Promise<TokenInfoResponse> => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        return {
          success: false,
          message: 'No hay token almacenado',
          errorCode: 'NO_TOKEN'
        };
      }

      const response = await apiClient.get(`/auth/token/info?lang=${lang}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      // Si el token expiró, limpiarlo del localStorage
      if (error.response?.data?.errorCode === 'TOKEN_EXPIRED') {
        localStorage.removeItem('authToken');
      }
      
      return {
        success: false,
        message: error.response?.data?.message || 'Error validando token',
        errorCode: error.response?.data?.errorCode
      };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
  },

  // Verificar si hay token válido
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('authToken');
    return !!token;
  },

  // Obtener token
  getToken: (): string | null => {
    return localStorage.getItem('authToken');
  },

  // Guardar token
  saveToken: (token: string) => {
    localStorage.setItem('authToken', token);
  },

  // Guardar información del usuario
  saveUserInfo: (userInfo: any) => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
  },

  // Obtener información del usuario
  getUserInfo: () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }
}; 