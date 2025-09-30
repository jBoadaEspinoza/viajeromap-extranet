import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { appConfig } from '../config/appConfig';

// Configuración de reintentos
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 segundo
  timeout: appConfig.api.timeout, // Usar timeout de la configuración centralizada
};

// Función para esperar
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Crear instancia de axios con configuración mejorada
const apiClient: AxiosInstance = axios.create({
  baseURL: appConfig.api.baseUrl + '/v1',
  timeout: RETRY_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores de token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el token expiró y no es una petición de login
    if (error.response?.status === 401 && 
        error.response?.data?.errorCode === 'TOKEN_EXPIRED' &&
        !originalRequest._retry &&
        !originalRequest.url?.includes('/auth/login')) {
      
      originalRequest._retry = true;
      
      // Limpiar token expirado
      localStorage.removeItem('authToken');
      localStorage.removeItem('userInfo');
      
      // Redirigir al login
      window.location.href = '/extranet/login';
      
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

// Función para hacer peticiones con reintentos
export const apiRequest = async <T>(
  config: AxiosRequestConfig,
  retryCount = 0
): Promise<T> => {
  try {
    const response = await apiClient(config);
    return response.data;
  } catch (error: any) {
    // Solo reintentar en caso de errores de red o timeout
    const shouldRetry = (
      error.code === 'ECONNABORTED' ||
      error.code === 'NETWORK_ERROR' ||
      error.message?.includes('timeout') ||
      !error.response
    );

    if (shouldRetry && retryCount < RETRY_CONFIG.maxRetries) {
      console.log(`Reintentando petición (${retryCount + 1}/${RETRY_CONFIG.maxRetries})...`);
      await delay(RETRY_CONFIG.retryDelay * (retryCount + 1));
      return apiRequest(config, retryCount + 1);
    }

    throw error;
  }
};

// Función para hacer peticiones GET con reintentos
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  return apiRequest<T>({
    method: 'GET',
    url,
    ...config,
  });
};

// Función para hacer peticiones POST con reintentos
export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  return apiRequest<T>({
    method: 'POST',
    url,
    data,
    ...config,
  });
};

export { apiClient }; 