// Configuración de Google Maps
export const GOOGLE_MAPS_CONFIG = {
  // IMPORTANTE: Reemplaza con tu API key real de Google Maps
  API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBnFtKI9V4eU_Dwi5HzNyQftsxNKomvUYY',
  
  // Configuración por defecto del mapa
  DEFAULT_CENTER: { lat: -12.0464, lng: -77.0428 }, // Lima, Perú
  DEFAULT_ZOOM: 12,
  
  // Límites de búsqueda (en grados)
  SEARCH_BOUNDS_OFFSET: 0.1,
  
  // Estilos del mapa
  MAP_STYLES: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

// Función para obtener la URL de la API de Google Maps
export const getGoogleMapsApiUrl = () => {
  return `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_CONFIG.API_KEY}&libraries=places`;
}; 