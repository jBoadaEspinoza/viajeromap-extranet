// Constantes de la aplicación
export const APP_NAME = 'Peru Trips & Adventures';

// Rutas de la API
export const API_ENDPOINTS = {
  TRIPS: '/trips',
  BOOKINGS: '/bookings',
  USERS: '/users',
  AUTH: '/auth',
} as const;

// Estados de carga
export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

// Tipos de usuario
export const USER_TYPES = {
  ADMIN: 'admin',
  USER: 'user',
  GUIDE: 'guide',
} as const; 