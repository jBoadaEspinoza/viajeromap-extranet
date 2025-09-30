// Tipos principales de la aplicación

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guide';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  duration: number; // en días
  price: number;
  location: string;
  maxParticipants: number;
  images: string[];
  highlights: string[];
  itinerary: DayItinerary[];
  included: string[];
  notIncluded: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DayItinerary {
  day: number;
  title: string;
  description: string;
  activities: string[];
}

export interface Booking {
  id: string;
  userId: string;
  tripId: string;
  startDate: string;
  endDate: string;
  participants: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Estados de carga
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

// Errores
export interface ApiError {
  message: string;
  status: number;
  code?: string;
} 