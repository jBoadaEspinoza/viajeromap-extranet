import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { GOOGLE_MAPS_CONFIG, getGoogleMapsApiUrl } from '../config/googleMaps';

interface Location {
  address: string;
  lat: number;
  lng: number;
  placeName?: string; // Nombre del lugar (ej: "Plaza Mayor", "Museo Larco")
}

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveLocation: (location: Location) => void;
  originCity: string;
  locationType: string;
  cityCoordinates?: { lat: number; lng: number }; // Nuevo: coordenadas de la ciudad
}

const GoogleMapsModal: React.FC<GoogleMapsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSaveLocation, 
  originCity, 
  locationType,
  cityCoordinates 
}) => {
  const { language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchRadius, setSearchRadius] = useState(50); // Radio de búsqueda en km
  const [isFilteringSuggestions, setIsFilteringSuggestions] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);

  // Función para calcular distancia entre dos puntos (fórmula de Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Función para determinar si una sugerencia es una zona/barrio
  const isZoneSuggestion = (description: string): boolean => {
    const descriptionLower = description.toLowerCase();
    
    // Patrones que indican que es una zona/barrio
    const zonePatterns = [
      'barrio', 'zona', 'distrito', 'urbanización', 'residencial',
      'colonia', 'sector', 'área', 'complejo', 'conjunto',
      'neighborhood', 'district', 'area', 'zone', 'residential',
      'miraflores', 'san isidro', 'barranco', 'surco', 'chorrillos',
      'pueblo libre', 'magdalena', 'san miguel', 'breña', 'la victoria'
    ];
    
    // Patrones que indican que es una dirección específica
    const addressPatterns = [
      'calle', 'avenida', 'jirón', 'pasaje', 'plaza', 'número',
      'street', 'avenue', 'road', 'square', 'plaza', 'number',
      'km', 'kilómetro', 'kilometer'
    ];
    
    // Si contiene números específicos (como direcciones), probablemente no es zona
    if (/\d+/.test(description)) {
      return false;
    }
    
    // Contar coincidencias
    const zoneMatches = zonePatterns.filter(pattern => descriptionLower.includes(pattern)).length;
    const addressMatches = addressPatterns.filter(pattern => descriptionLower.includes(pattern)).length;
    
    // Si tiene más patrones de zona que de dirección, considerarlo zona
    return zoneMatches > addressMatches;
  };

  // Cargar Google Maps API
  useEffect(() => {
    if (!isOpen) return;
    // 🔹 Resetear buscador y ubicación seleccionada
    setSearchQuery('');
    setSelectedLocation(null);
    setSearchRadius(50); // Resetear radio a 50km
    setSuggestions([]); // Limpiar sugerencias
    setShowSuggestions(false); // Ocultar lista de sugerencias
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    
    const loadGoogleMaps = async () => {
      try {
        if ((window as any).google && (window as any).google.maps) {
          initializeServices();
          initializeMap(); // inicializar directamente al abrir
          return;
        }

        const apiKey = GOOGLE_MAPS_CONFIG.API_KEY;
        if (!apiKey) {
          alert(`❌ ${getTranslation('googleMaps.error.apiKey', language)}`);
          return;
        }
        
        const script = document.createElement('script');
        script.src = getGoogleMapsApiUrl();
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          initializeServices();
          initializeMap(); // inicializar al cargar script
        };
        
        script.onerror = () => {
          alert(`❌ ${getTranslation('googleMaps.error.loading', language)}`);
        };
        
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error en loadGoogleMaps:', error);
      }
    };

    loadGoogleMaps();
  }, [isOpen]);

  // Actualizar mapa cuando cambien las coordenadas de la ciudad
  useEffect(() => {
    if (map && cityCoordinates) {
      const newCenter = new (window as any).google.maps.LatLng(cityCoordinates.lat, cityCoordinates.lng);
      map.setCenter(newCenter);
      map.setZoom(12);
    }
  }, [cityCoordinates, map]);

  // Actualizar círculo de radio cuando cambie el radio de búsqueda
  useEffect(() => {
    if (map && cityCoordinates) {
      // Remover círculos existentes
      const circles = map.get('searchRadiusCircle');
      if (circles) {
        circles.forEach((circle: any) => circle.setMap(null));
      }
      
      // Crear nuevo círculo con el radio actualizado
      const newCircle = new (window as any).google.maps.Circle({
        strokeColor: '#4285F4',
        strokeOpacity: 0.3,
        strokeWeight: 2,
        fillColor: '#4285F4',
        fillOpacity: 0.1,
        map: map,
        center: new (window as any).google.maps.LatLng(cityCoordinates.lat, cityCoordinates.lng),
        radius: searchRadius * 1000,
      });
      
      // Guardar referencia al círculo
      if (!map.get('searchRadiusCircle')) {
        map.set('searchRadiusCircle', []);
      }
      map.get('searchRadiusCircle').push(newCircle);
    }
  }, [searchRadius, map, cityCoordinates]);

  // Inicializar servicios básicos
  const initializeServices = () => {
    if ((window as any).google?.maps?.places) {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
    }
  };

  // Inicializar mapa
  const initializeMap = () => {
    if (!mapRef.current) return;
    if (!(window as any).google || !(window as any).google.maps) return;

    try {
      // Usar coordenadas de la ciudad si están disponibles, sino usar Lima como fallback
      const defaultCoordinates = { lat: -12.0464, lng: -77.0428 };
      const mapCenter = cityCoordinates || defaultCoordinates;
      const cityName = cityCoordinates ? originCity : 'Lima, Perú';

      const mapInstance = new (window as any).google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: 12,
        mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      setMap(mapInstance);

      // Marcador de la ciudad de origen
      new (window as any).google.maps.Marker({
        position: mapCenter,
        map: mapInstance,
        title: `${cityName} (Centro de la ciudad)`,
        icon: {
          url:
            'data:image/svg+xml;charset=UTF-8,' +
            encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#4285F4" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
                <text x="12" y="20" text-anchor="middle" fill="white" font-size="8" font-weight="bold">C</text>
              </svg>
            `),
          scaledSize: new (window as any).google.maps.Size(24, 24),
        },
      });

      // Círculo de radio de búsqueda (solo si tenemos coordenadas de ciudad)
      if (cityCoordinates) {
        const searchCircle = new (window as any).google.maps.Circle({
          strokeColor: '#4285F4',
          strokeOpacity: 0.3,
          strokeWeight: 2,
          fillColor: '#4285F4',
          fillOpacity: 0.1,
          map: mapInstance,
          center: mapCenter,
          radius: searchRadius * 1000, // Radio configurable en metros
        });
        
        // Guardar referencia al círculo para poder actualizarlo después
        mapInstance.set('searchRadiusCircle', [searchCircle]);
      }

      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
    } catch (error) {
      console.error('❌ Error al inicializar mapa:', error);
    }
  };

  // Buscar sugerencias
  const searchSuggestions = async (query: string) => {
    if (!autocompleteService.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const request: any = {
        input: query,
        componentRestrictions: { country: 'PE' }
      };

      // Si es zona, configurar para buscar solo zonas/barrios/distritos
      if (locationType === 'zone') {
        // Configurar tipos de lugar para zonas en lugar de direcciones específicas
        request.types = ['sublocality', 'sublocality_level_1', 'administrative_area_level_2', 'administrative_area_level_3'];
      }

      // Si tenemos coordenadas de la ciudad, usar búsqueda por radio
      if (cityCoordinates) {
        // Radio de búsqueda configurable desde el estado
        const radiusInMeters = searchRadius * 1000; // Convertir km a metros
        
        request.location = new (window as any).google.maps.LatLng(cityCoordinates.lat, cityCoordinates.lng);
        request.radius = radiusInMeters;
        
        console.log(`🔍 Búsqueda con radio: ${searchRadius}km desde ${cityCoordinates.lat}, ${cityCoordinates.lng}`);
      }

      autocompleteService.current.getPlacePredictions(request, async (predictions: any, status: string) => {
        if (status === 'OK' && predictions) {
          let filteredSuggestions = predictions;
          
          // Si tenemos coordenadas de la ciudad, filtrar por distancia real
          if (cityCoordinates) {
            setIsFilteringSuggestions(true);
            
            // Filtrar sugerencias que estén dentro del radio especificado
            const suggestionsWithDistance = await Promise.all(
              predictions.map(async (suggestion: any) => {
                try {
                  // Obtener detalles del lugar para calcular la distancia
                  const placesService = new (window as any).google.maps.places.PlacesService(map || document.createElement('div'));
                  const placeRequest = {
                    placeId: suggestion.place_id,
                    fields: ['geometry']
                  };
                  
                  return new Promise((resolve) => {
                    placesService.getDetails(placeRequest, (place: any, placeStatus: string) => {
                      if (placeStatus === 'OK' && place?.geometry?.location) {
                        const placeLat = place.geometry.location.lat();
                        const placeLng = place.geometry.location.lng();
                        const distance = calculateDistance(
                          cityCoordinates.lat, 
                          cityCoordinates.lng, 
                          placeLat, 
                          placeLng
                        );
                        
                        resolve({
                          ...suggestion,
                          distance,
                          coordinates: { lat: placeLat, lng: placeLng }
                        });
                      } else {
                        // Si no podemos obtener coordenadas, asumir que está fuera del radio
                        resolve({
                          ...suggestion,
                          distance: Infinity,
                          coordinates: null
                        });
                      }
                    });
                  });
                } catch (error) {
                  return {
                    ...suggestion,
                    distance: Infinity,
                    coordinates: null
                  };
                }
              })
            );
            
            // Filtrar por distancia y ordenar por relevancia
            filteredSuggestions = suggestionsWithDistance
              .filter((suggestion: any) => suggestion.distance <= searchRadius)
              .filter((suggestion: any) => {
                // Si es zona, filtrar solo sugerencias que parezcan zonas/barrios
                if (locationType === 'zone') {
                  return isZoneSuggestion(suggestion.description);
                }
                return true;
              })
              .sort((a: any, b: any) => {
                // Si es zona, priorizar sugerencias que parezcan zonas/barrios
                if (locationType === 'zone') {
                  const aIsZone = isZoneSuggestion(a.description);
                  const bIsZone = isZoneSuggestion(b.description);
                  
                  // Prioridad 1: Zonas sobre direcciones específicas
                  if (aIsZone && !bIsZone) return -1;
                  if (!aIsZone && bIsZone) return 1;
                }
                
                // Prioridad 2: Lugares que contengan el nombre de la ciudad
                const cityNameLower = originCity.toLowerCase();
                const aHasCity = a.description.toLowerCase().includes(cityNameLower);
                const bHasCity = b.description.toLowerCase().includes(cityNameLower);
                
                if (aHasCity && !bHasCity) return -1;
                if (!aHasCity && bHasCity) return 1;
                
                // Prioridad 3: Si ambos tienen o no tienen ciudad, ordenar por distancia
                if (aHasCity === bHasCity) {
                  return a.distance - b.distance;
                }
                
                return 0;
              });
            setIsFilteringSuggestions(false);
          }
          
          setSuggestions(filteredSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Manejar cambios en el input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (selectedLocation) {
      setSelectedLocation(null);
      if (marker) {
        marker.setMap(null);
        setMarker(null);
      }
    }
    searchSuggestions(value);
  };

  // Seleccionar sugerencia
  const selectSuggestion = async (suggestion: any) => {
    try {
      setShowSuggestions(false);
      setSuggestions([]);
      setIsMapLoading(true);
  
      const placesService = new (window as any).google.maps.places.PlacesService(map);
      const request = {
        placeId: suggestion.place_id,
        fields: ['geometry', 'formatted_address', 'name']
      };
  
      placesService.getDetails(request, (place: any, status: string) => {
        setIsMapLoading(false);
  
        if (status === 'OK' && place?.geometry) {
          const location = {
            address: place.formatted_address || place.name || suggestion.description,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeName: place.name || suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0],
          };
  
          if (map) {
            const newPosition = new (window as any).google.maps.LatLng(location.lat, location.lng);
            map.setCenter(newPosition);
            map.setZoom(16);
  
            if (marker) marker.setMap(null);
  
            const newMarker = new (window as any).google.maps.Marker({
              position: newPosition,
              map: map,
              title: location.address,
              icon: {
                url:
                  'data:image/svg+xml;charset=UTF-8,' +
                  encodeURIComponent(`
                    <svg width="24" height="24" viewBox="0 0 24 24" 
                         fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#EA4335" stroke="white" stroke-width="2"/>
                      <circle cx="12" cy="12" r="4" fill="white"/>
                    </svg>
                  `),
                scaledSize: new (window as any).google.maps.Size(24, 24),
              },
            });
  
            setMarker(newMarker);
          }
  
          setSelectedLocation(location);
          setSearchQuery(location.address);
        }
      });
    } catch {
      setIsMapLoading(false);
    }
  };

  const handleSaveLocation = () => {
    if (selectedLocation) {
      // Mostrar confirmación con el nombre del lugar si está disponible
      if (selectedLocation.placeName && selectedLocation.placeName !== selectedLocation.address) {
        console.log(`📍 Ubicación guardada: ${selectedLocation.placeName} - ${selectedLocation.address}`);
      } else {
        console.log(`📍 Ubicación guardada: ${selectedLocation.address}`);
      }
      
      onSaveLocation(selectedLocation);
      onClose();
    } else {
      alert(`❌ ${getTranslation('googleMaps.error.selectLocation', language)}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xs">
        <div className="modal-content">
            <div className="modal-header">
             <h5 className="modal-title">
               {getTranslation('googleMaps.title', language)} - {locationType}
             </h5>
             <button
               type="button"
               className="btn-close"
               onClick={onClose}
               aria-label="Close"
             ></button>
           </div>
          
          <div className="modal-body">
            <div className="mb-3">
                               <label className="form-label fw-bold">
                  {getTranslation('googleMaps.search.label', language).replace('{city}', originCity)}:
                                    {cityCoordinates && (
                     <span className="badge bg-info ms-2">
                       <i className="fas fa-map-marker-alt me-1"></i>
                       {getTranslation('googleMaps.search.radius', language)}: {searchRadius}km
                       {isFilteringSuggestions && (
                         <span className="ms-1">
                           <i className="fas fa-filter text-warning"></i>
                         </span>
                       )}
                     </span>
                   )}
               </label>
               
               {/* Mensaje informativo según el tipo de búsqueda */}
               <div className="mb-2">
                 <small className="text-info">
                   <i className="fas fa-info-circle me-1"></i>
                   {locationType === 'zone' 
                     ? getTranslation('googleMaps.search.zoneInfo', language)
                     : getTranslation('googleMaps.search.addressInfo', language)
                   }
                 </small>
               </div>
               
               {/* Control de radio de búsqueda */}
               {cityCoordinates && (
                 <div className="mb-2">
                   <div className="d-flex align-items-center gap-2">
                     <input
                       type="range"
                       className="form-range flex-grow-1"
                       min="5"
                       max="100"
                       step="5"
                       value={searchRadius}
                       onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                       style={{ height: '6px' }}
                     />
                     <span className="badge bg-secondary">{searchRadius}km</span>
                   </div>
                   <small className="text-muted">
                     {getTranslation('googleMaps.search.currentRadius', language).replace('{radius}', searchRadius.toString()).replace('{city}', originCity)}
                   </small>
                 </div>
               )}
              
              <div className="position-relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  className="form-control"
                  placeholder={
                    locationType === 'zone' 
                      ? getTranslation('googleMaps.search.placeholderZone', language)
                      : getTranslation('googleMaps.search.placeholderAddress', language)
                  }
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(suggestions.length > 0)}
                />
                
                                 {(isMapLoading || isFilteringSuggestions) && (
                   <div className="position-absolute top-50 end-0 translate-middle-y me-3">
                     <div className="spinner-border spinner-border-sm text-primary" role="status">
                                            <span className="visually-hidden">
                       {isFilteringSuggestions ? getTranslation('googleMaps.search.filtering', language) : getTranslation('googleMaps.search.searching', language)}
                     </span>
                     </div>
                   </div>
                 )}

                                 {showSuggestions && (
                   <div className="position-absolute top-100 start-0 end-0 bg-white border rounded shadow-sm" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                     {suggestions.length > 0 ? (
                       suggestions.map((suggestion, index) => (
                         <div
                           key={suggestion.place_id}
                           className="p-2 border-bottom cursor-pointer hover-bg-light"
                           style={{ cursor: 'pointer' }}
                           onClick={() => selectSuggestion(suggestion)}
                           onMouseEnter={(e) => {
                             e.currentTarget.style.backgroundColor = '#f8f9fa';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.backgroundColor = 'white';
                           }}
                         >
                           <div className="fw-bold small">{suggestion.structured_formatting?.main_text || suggestion.description}</div>
                           <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                             {suggestion.structured_formatting?.secondary_text || ''}
                           </div>
                           {cityCoordinates && suggestion.distance !== undefined && (
                             <div className="text-info" style={{ fontSize: '0.7rem' }}>
                               <i className="fas fa-map-marker-alt me-1"></i>
                               {getTranslation('googleMaps.search.distanceFrom', language).replace('{distance}', suggestion.distance.toFixed(1)).replace('{city}', originCity)}
                             </div>
                           )}
                         </div>
                       ))
                     ) : (
                       <div className="p-3 text-center text-muted">
                         <i className="fas fa-search me-2"></i>
                         {cityCoordinates ? (
                           <>{getTranslation('googleMaps.search.noResults', language).replace('{radius}', searchRadius.toString()).replace('{city}', originCity)}</>
                         ) : (
                           <>{getTranslation('googleMaps.search.noResultsGeneric', language)}</>
                         )}
                         <br />
                         <small>{getTranslation('googleMaps.search.tryExpand', language)}</small>
                       </div>
                     )}
                   </div>
                 )}
              </div>
              
                             <div className="alert alert-light py-2 mt-2 small">
                 <i className="fas fa-lightbulb me-2 text-warning"></i>
                 <strong>Tip:</strong> 
                 {cityCoordinates ? (
                   <>{getTranslation('googleMaps.tip.withRadius', language).replace('{radius}', searchRadius.toString()).replace('{city}', originCity)}</>
                 ) : (
                   <>{getTranslation('googleMaps.tip.withoutRadius', language)}</>
                 )}
               </div>
            </div>

            <div className="mb-3">
              <div
                ref={mapRef}
                style={{ height: '150px', width: '100%' }}
                className="border rounded"
              ></div>
              
              {isMapLoading && (
                <div className="position-absolute top-50 start-50 translate-middle">
                  <div className="spinner-border text-primary" role="status">
                                         <span className="visually-hidden">{getTranslation('googleMaps.loading', language)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className='d-flex justify-content-center'>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {getTranslation('googleMaps.buttons.cancel', language)}
              </button>&nbsp;
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleSaveLocation}
                disabled={!selectedLocation}
              >
                {getTranslation('googleMaps.buttons.saveLocation', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsModal;
