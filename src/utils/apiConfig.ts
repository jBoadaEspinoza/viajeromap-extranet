import { appConfig } from '../config/appConfig';

// Configuración simple y robusta para API
export const apiConfig = {
  // URL base del backend
  baseURL: appConfig.api.baseUrl,
  
  // Timeout para requests
  timeout: appConfig.api.timeout,
  
  // Headers básicos
  headers: {
    'Content-Type': 'application/json'
  },
  
  // Configuración para cookies HTTP-only
  withCredentials: true,
  
  // Configuración para evitar caché en rutas de auth
  authHeaders: {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }
};

// Función para crear configuración de request
export const createRequestConfig = (options: { headers?: Record<string, string> } = {}) => {
  return {
    withCredentials: apiConfig.withCredentials,
    timeout: apiConfig.timeout,
    headers: {
      ...apiConfig.headers,
      ...(options.headers || {})
    },
    ...options
  };
};

// Función para crear configuración de request con headers de auth
export const createAuthRequestConfig = (options: { headers?: Record<string, string> } = {}) => {
  return createRequestConfig({
    headers: {
      ...apiConfig.authHeaders,
      ...(options.headers || {})
    },
    ...options
  });
};

// Función auxiliar para verificar si un error tiene propiedades específicas
const isAxiosError = (error: unknown): error is { code: string; response?: { status: number }; message: string } => {
  return typeof error === 'object' && error !== null && 'code' in error;
};

// Función para manejar errores de red
export const handleNetworkError = (error: unknown) => {
  console.error('🌐 Network Error:', error);
  
  if (isAxiosError(error)) {
    if (error.code === 'ERR_NETWORK') {
      return {
        type: 'NETWORK_ERROR',
        message: 'No se puede conectar al servidor. Verifica tu conexión a internet.'
      };
    }
    
    if (error.response?.status === 0) {
      return {
        type: 'CORS_ERROR',
        message: 'Error de CORS. El servidor no está configurado correctamente.'
      };
    }
    
    if (error.response?.status === 403) {
      return {
        type: 'FORBIDDEN',
        message: 'Acceso denegado. Verifica tus permisos.'
      };
    }
    
    if (error.response?.status === 401) {
      return {
        type: 'UNAUTHORIZED',
        message: 'No autorizado. Inicia sesión nuevamente.'
      };
    }
    
    return {
      type: 'UNKNOWN_ERROR',
      message: error.message || 'Error desconocido'
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: 'Error desconocido'
  };
}; 