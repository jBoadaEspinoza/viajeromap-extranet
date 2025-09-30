import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getTranslation } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { activitiesApi, pointOfInterestRequest, pointOfInterestResponse } from '@/api/activities';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';
import { placesApi, type Place } from '@/api/places';
import { googlePlacesService, loadGoogleMapsAPI, type PointOfInterest } from '@/services/googlePlacesService';

const StepDescription: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const [presentation, setPresentation] = useState('');
  const [description, setDescription] = useState('');
  const [activityData, setActivityData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const hasRedirected = useRef(false);
  
  // Location selection states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<PointOfInterest[]>([]);
  const [mainLocation, setMainLocation] = useState<PointOfInterest | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [pointsOfInterest, setPointsOfInterest] = useState<PointOfInterest[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [loadingPOI, setLoadingPOI] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  
  // Points of interest organized by destination
  const [poiByDestination, setPoiByDestination] = useState<Record<number, {
    place: Place;
    selectedPOI: PointOfInterest[];
  }>>({});
  
  // Global main point of interest (only one across all destinations)
  const [globalMainLocation, setGlobalMainLocation] = useState<PointOfInterest | null>(null);
  
  // Loading state for existing POI
  const [loadingExistingPOI, setLoadingExistingPOI] = useState(false);

  // Character limits
  const PRESENTATION_LIMIT = 200;
  const DESCRIPTION_LIMIT = 3000;

  // Load Google Maps API
  useEffect(() => {
    const loadMaps = async () => {
      try {
        await loadGoogleMapsAPI();
        setGoogleMapsLoaded(true);
      } catch (error) {
        console.error('Error loading Google Maps API:', error);
      }
    };
    loadMaps();
  }, []);

  // Load places from API
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        setLoadingPlaces(true);
        const placesData = await placesApi.getPlaces();
        setPlaces(placesData);
      } catch (error) {
        console.error('Error loading places:', error);
      } finally {
        setLoadingPlaces(false);
      }
    };
    loadPlaces();
  }, []);

  // Load points of interest when a place is selected
  useEffect(() => {
    const loadPointsOfInterest = async () => {
      if (!selectedPlace || !googleMapsLoaded) return;

      try {
        setLoadingPOI(true);
        setPointsOfInterest([]);
        
        // Initialize Google Places service
        const mapElement = document.createElement('div');
        mapElement.style.display = 'none';
        document.body.appendChild(mapElement);
        
        await googlePlacesService.initialize(mapElement, {
          lat: selectedPlace.latitude,
          lng: selectedPlace.longitude
        });

        // Search for activities and things to do
        const pois = await googlePlacesService.searchActivities(
          { lat: selectedPlace.latitude, lng: selectedPlace.longitude },
          10000 // 10km radius
        );

        setPointsOfInterest(pois);
        document.body.removeChild(mapElement);
      } catch (error) {
        console.error('Error loading points of interest:', error);
      } finally {
        setLoadingPOI(false);
      }
    };

    loadPointsOfInterest();
  }, [selectedPlace, googleMapsLoaded]);

  // Search for POI when search query changes
  useEffect(() => {
    const searchPOI = async () => {
      if (!searchQuery.trim() || !selectedPlace || !googleMapsLoaded) {
        return;
      }

      try {
        setLoadingPOI(true);
        
        // Initialize Google Places service
        const mapElement = document.createElement('div');
        mapElement.style.display = 'none';
        document.body.appendChild(mapElement);
        
        await googlePlacesService.initialize(mapElement, {
          lat: selectedPlace.latitude,
          lng: selectedPlace.longitude
        });
        
        document.body.removeChild(mapElement);

        // Search by text query
        const searchResults = await googlePlacesService.searchByText(
          searchQuery,
          { lat: selectedPlace.latitude, lng: selectedPlace.longitude },
          10000
        );

        setPointsOfInterest(searchResults);
      } catch (error) {
        console.error('Error searching POI:', error);
      } finally {
        setLoadingPOI(false);
      }
    };

    const timeoutId = setTimeout(searchPOI, 500); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedPlace, googleMapsLoaded]);

  // Obtener parámetros de URL
  const { activityId, lang, currency } = useActivityParams();
  
  //Cargar datos existentes de la actividad
  useEffect(() => {
    const loadActivityData = async () => {
      if (!activityId) return;
      await withLoading(async () => {
        const activityData = await activitiesApi.getById(activityId, lang, currency.toUpperCase());
        setActivityData(activityData);
        
        // Cargar presentation si existe
        if (activityData && activityData.presentation) {
          setPresentation(activityData.presentation || '');
        }
        
        // Cargar description si existe (convertir array a string separado por \n)
        if (activityData && activityData.description) {
          if (Array.isArray(activityData.description)) {
            setDescription(activityData.description.join('\n\n'));
          } else {
            setDescription(activityData.description || '');
          }
        }

        // Cargar pointsOfInterest si existe
        if (activityData && activityData.pointsOfInterest) {
          // Cargar POI existentes usando Google Places API
          await loadExistingPOIFromGoogleMaps(activityData.pointsOfInterest);
        }
      }, 'load-activity-data');
    };


    loadActivityData();
  }, [activityId, lang, currency]);

  // Function to load existing POI from Google Maps using googlePlaceId
  const loadExistingPOIFromGoogleMaps = async (pointsOfInterest: pointOfInterestResponse[]) => {
    if (!googleMapsLoaded) {
      console.log('Google Maps not loaded yet, waiting...');
      return;
    }

    setLoadingExistingPOI(true);
    
    try {
      console.log('Loading existing POI from Google Maps:', pointsOfInterest);
      
      // Crear un mapa temporal para inicializar Google Places
      const mapElement = document.createElement('div');
      mapElement.style.display = 'none';
      document.body.appendChild(mapElement);
      
      // Inicializar Google Places service
      await googlePlacesService.initialize(mapElement, {
        lat: -12.0464, // Lima, Perú por defecto
        lng: -77.0428
      });
      
      // Buscar detalles de cada POI usando googlePlaceId
      const poiDetails: PointOfInterest[] = [];
      const groupedPOI: Record<number, {
        place: Place;
        selectedPOI: PointOfInterest[];
      }> = {};
      let mainPOI: PointOfInterest | null = null;

      for (const poiData of pointsOfInterest) {
        try {
          // Buscar detalles del POI usando googlePlaceId
          const poiDetails = await googlePlacesService.getPlaceDetails(poiData.googlePlaceId);
          
          if (poiDetails) {
            // Crear objeto Place simulado
            const simulatedPlace: Place = {
              id: poiData.destinationId,
              cityName: poiData.destinationName,
              countryId: 'PE',
              latitude: poiData.latitude,
              longitude: poiData.longitude,
              active: true,
              activityCount: 0
            };

            // Crear POI con datos de Google Maps
            const poi: PointOfInterest = {
              place_id: poiData.googlePlaceId, // Usar el googlePlaceId real
              name: poiDetails.name || poiData.name,
              formatted_address: poiDetails.formatted_address || `${poiData.name}, ${poiData.destinationName}`,
              types: poiDetails.types || ['tourist_attraction'],
              rating: poiDetails.rating || 4.5,
              user_ratings_total: poiDetails.user_ratings_total || 1000,
              destinationId: poiData.destinationId,
              geometry: {
                location: {
                  lat: poiDetails.geometry?.location?.lat || poiData.latitude,
                  lng: poiDetails.geometry?.location?.lng || poiData.longitude
                }
              },
              photos: poiDetails.photos
            };

            // Agrupar por destino
            if (!groupedPOI[poiData.destinationId]) {
              groupedPOI[poiData.destinationId] = {
                place: simulatedPlace,
                selectedPOI: []
              };
            }

            groupedPOI[poiData.destinationId].selectedPOI.push(poi);

            // Establecer punto principal
            if (poiData.isMainDestination) {
              mainPOI = poi;
            }

            console.log('Loaded POI from Google Maps:', poi);
          } else {
            console.warn('Could not load details for POI:', poiData.googlePlaceId);
            // Crear POI básico con datos de la API si no se puede cargar de Google Maps
            const simulatedPlace: Place = {
              id: poiData.destinationId,
              cityName: poiData.destinationName,
              countryId: 'PE',
              latitude: poiData.latitude,
              longitude: poiData.longitude,
              active: true,
              activityCount: 0
            };

            const poi: PointOfInterest = {
              place_id: poiData.googlePlaceId,
              name: poiData.name,
              formatted_address: `${poiData.name}, ${poiData.destinationName}`,
              types: ['tourist_attraction'],
              rating: 4.5,
              user_ratings_total: 1000,
              destinationId: poiData.destinationId,
              geometry: {
                location: {
                  lat: poiData.latitude,
                  lng: poiData.longitude
                }
              }
            };

            if (!groupedPOI[poiData.destinationId]) {
              groupedPOI[poiData.destinationId] = {
                place: simulatedPlace,
                selectedPOI: []
              };
            }

            groupedPOI[poiData.destinationId].selectedPOI.push(poi);

            if (poiData.isMainDestination) {
              mainPOI = poi;
            }
          }
        } catch (error) {
          console.error('Error loading POI details from Google Maps:', error);
        }
      }

      // Limpiar elemento temporal
      document.body.removeChild(mapElement);

      // Actualizar estados
      setPoiByDestination(groupedPOI);
      if (mainPOI) {
        setGlobalMainLocation(mainPOI);
      }

      // Si hay solo un destino, seleccionarlo automáticamente
      const destinationIds = Object.keys(groupedPOI);
      if (destinationIds.length === 1) {
        const destinationId = parseInt(destinationIds[0]);
        const destination = groupedPOI[destinationId].place;
        setSelectedPlace(destination);
        setSelectedLocations(groupedPOI[destinationId].selectedPOI);
      }

      console.log('Loaded existing POI from Google Maps:', groupedPOI);
      
    } catch (error) {
      console.error('Error loading existing POI from Google Maps:', error);
    } finally {
      setLoadingExistingPOI(false);
    }
  };

  // Function to load existing points of interest from activity data
  const loadExistingPointsOfInterest = async () => {
    if (!activityData || !activityData.pointsOfInterest) return;
    
    setLoadingExistingPOI(true);
    
    try {
      console.log('Loading existing points of interest from activity data:', activityData);
      
      // Group POI by destination
      const groupedPOI: Record<number, {
        place: Place;
        selectedPOI: PointOfInterest[];
      }> = {};

      // Find main destination POI
      let mainPOI: PointOfInterest | null = null;

      activityData.pointsOfInterest.forEach((poiData: pointOfInterestRequest) => {
        const destinationId = poiData.placeId;
        const destination = places.find(p => p.id === destinationId);
        
        if (destination) {
          // Create POI object with destinationId
          const poi: PointOfInterest = {
            place_id: `existing_${poiData.name.replace(/\s+/g, '_').toLowerCase()}`,
            name: poiData.name,
            formatted_address: `${poiData.name}, ${destination.cityName}`,
            types: ['tourist_attraction'],
            rating: 4.5,
            user_ratings_total: 1000,
            destinationId: destinationId,
            geometry: {
              location: {
                lat: poiData.latitude,
                lng: poiData.longitude
              }
            }
          };

          // Initialize destination group if not exists
          if (!groupedPOI[destinationId]) {
            groupedPOI[destinationId] = {
              place: destination,
              selectedPOI: []
            };
          }

          // Add POI to destination group
          groupedPOI[destinationId].selectedPOI.push(poi);

          // Set main destination POI
          if (poiData.isMainDestination) {
            mainPOI = poi;
          }
        }
      });

      // Update state with loaded data
      setPoiByDestination(groupedPOI);
      if (mainPOI) {
        setGlobalMainLocation(mainPOI);
      }

      // If there's only one destination, set it as selected
      const destinationIds = Object.keys(groupedPOI);
      if (destinationIds.length === 1) {
        const destinationId = parseInt(destinationIds[0]);
        const destination = groupedPOI[destinationId].place;
        setSelectedPlace(destination);
        setSelectedLocations(groupedPOI[destinationId].selectedPOI);
      }

      console.log('Loaded existing points of interest from activity:', groupedPOI);
      
    } catch (error) {
      console.error('Error loading existing points of interest:', error);
    } finally {
      setLoadingExistingPOI(false);
    }
  };

  // Load existing points of interest when activityData is available
  useEffect(() => {
    if (activityData && activityData.pointsOfInterest && googleMapsLoaded) {
      loadExistingPOIFromGoogleMaps(activityData.pointsOfInterest);
    }
  }, [activityData, googleMapsLoaded]);

  useEffect(() => {
    // Solo redirigir si no hay activityId y no se ha redirigido antes
    if (!activityId && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/extranet/login');
    } else if (activityId) {
      // Resetear el flag de redirección si encontramos un activityId
      hasRedirected.current = false;
    }
  }, [activityId, navigate, lang, currency]);

  const handleSaveAndExit = async () => {
    if (!presentation.trim() || !description.trim()) {
      setError(getTranslation('stepDescription.error.bothFieldsRequired', language));
      return;
    }

    if (presentation.length > PRESENTATION_LIMIT) {
      setError(getTranslation('stepDescription.error.presentationTooLong', language));
      return;
    }

    if (description.length > DESCRIPTION_LIMIT) {
      setError(getTranslation('stepDescription.error.descriptionTooLong', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Convert selected POI to the format expected by the API
        const pointOfInterests = Object.values(poiByDestination).flatMap(destinationData => 
          destinationData.selectedPOI.map(poi => ({
            name: poi.name,
            latitude: parseFloat(poi.geometry.location.lat.toFixed(8)), // 8 decimal places for high precision
            longitude: parseFloat(poi.geometry.location.lng.toFixed(8)), // 8 decimal places for high precision
            placeId: poi.destinationId || 0, // placeId represents the destinationId from dropdown
            googlePlaceId: poi.place_id, // Google Places ID for the POI
            isMainDestination: globalMainLocation ? poi.place_id === globalMainLocation.place_id : false
          }))
        );

        // Call createDescription API
        const response = await activitiesApi.createDescription({
          id: activityId!,
          presentation: presentation.trim(),
          description: description.trim(),
          pointOfInterests: pointOfInterests,
          lang: language
        });
        if (response.success) {
          navigate('/extranet/dashboard');
        } else {
          setError(response.message || getTranslation('stepDescription.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepDescription.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleContinue = async () => {
    if (!presentation.trim() || !description.trim()) {
      setError(getTranslation('stepDescription.error.bothFieldsRequired', language));
      return;
    }

    if (presentation.length > PRESENTATION_LIMIT) {
      setError(getTranslation('stepDescription.error.presentationTooLong', language));
      return;
    }

    if (description.length > DESCRIPTION_LIMIT) {
      setError(getTranslation('stepDescription.error.descriptionTooLong', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Convert selected POI to the format expected by the API
        const pointOfInterests = Object.values(poiByDestination).flatMap(destinationData => 
          destinationData.selectedPOI.map(poi => ({
            name: poi.name,
            latitude: parseFloat(poi.geometry.location.lat.toFixed(8)), // 8 decimal places for high precision
            longitude: parseFloat(poi.geometry.location.lng.toFixed(8)), // 8 decimal places for high precision
            placeId: poi.destinationId || 0, // placeId represents the destinationId from dropdown
            googlePlaceId: poi.place_id, // Google Places ID for the POI
            isMainDestination: globalMainLocation ? poi.place_id === globalMainLocation.place_id : false
          }))
        );

        // Call createDescription API
        const response = await activitiesApi.createDescription({
          id: activityId!,
          presentation: presentation.trim(),
          description: description.trim(),
          pointOfInterests: pointOfInterests,
          lang: language
        });

        if (response.success) {
          navigateToActivityStep(navigate, '/extranet/activity/createRecommendations', {
            activityId,
            lang,
            currency,
            currentStep: 4
          });
        } else {
          setError(response.message || getTranslation('stepDescription.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepDescription.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleBack = () => {
    //redirigir a createTitle
    navigateToActivityStep(navigate, '/extranet/activity/createTitle', {
      activityId,
      lang,
      currency,
      currentStep: 2
    });
  };

  // Location selection functions
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
    setSearchQuery('');
    setShowSuggestions(false);
    
    // Load existing POI for this destination if available
    if (poiByDestination[place.id]) {
      setSelectedLocations(poiByDestination[place.id].selectedPOI);
    } else {
      setSelectedLocations([]);
    }
  };

  const handlePOISelect = (poi: PointOfInterest) => {
    if (!selectedLocations.find(loc => loc.place_id === poi.place_id)) {
      // Add destinationId to the POI
      const poiWithDestination = {
        ...poi,
        destinationId: selectedPlace?.id || 0
      };
      
      const newSelectedLocations = [...selectedLocations, poiWithDestination];
      setSelectedLocations(newSelectedLocations);
      
      // Si es el primer punto seleccionado globalmente, marcarlo como principal
      if (!globalMainLocation) {
        setGlobalMainLocation(poiWithDestination);
      }
      
      // Save to destination-specific state
      if (selectedPlace) {
        savePOIToDestination(selectedPlace, newSelectedLocations);
      }
    }
  };

  const handleLocationRemove = (placeId: string) => {
    // Find which destination contains this POI
    let destinationToUpdate: Place | null = null;
    let updatedPOI: PointOfInterest[] = [];
    
    Object.values(poiByDestination).forEach(destinationData => {
      if (destinationData.selectedPOI.find(poi => poi.place_id === placeId)) {
        destinationToUpdate = destinationData.place;
        updatedPOI = destinationData.selectedPOI.filter(poi => poi.place_id !== placeId);
      }
    });
    
    // Update the specific destination
    if (destinationToUpdate) {
      savePOIToDestination(destinationToUpdate, updatedPOI);
    }
    
    // Update current destination view if it matches
    if (selectedPlace && destinationToUpdate) {
      if (selectedPlace.id === (destinationToUpdate as Place).id) {
        setSelectedLocations(updatedPOI);
      }
    }
    
    // Si se elimina el punto principal global, buscar otro en todos los destinos
    if (globalMainLocation && globalMainLocation.place_id === placeId) {
      // Buscar el primer punto disponible en todos los destinos
      const allSelectedPOI = getAllSelectedPOI();
      const remainingPOI = allSelectedPOI.filter(poi => poi.place_id !== placeId);
      
      if (remainingPOI.length > 0) {
        setGlobalMainLocation(remainingPOI[0]);
      } else {
        setGlobalMainLocation(null);
      }
    }
  };

  const handleSetMainLocation = (poi: PointOfInterest) => {
    setGlobalMainLocation(poi);
  };

  // Helper function to get all selected POI from all destinations
  const getAllSelectedPOI = (): PointOfInterest[] => {
    const allPOI: PointOfInterest[] = [];
    Object.values(poiByDestination).forEach(destinationData => {
      allPOI.push(...destinationData.selectedPOI);
    });
    return allPOI;
  };

  // Helper function to save POI data to destination-specific state
  const savePOIToDestination = (place: Place, selectedPOI: PointOfInterest[]) => {
    setPoiByDestination(prev => ({
      ...prev,
      [place.id]: {
        place,
        selectedPOI
      }
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  // Filter POI based on search query and exclude already selected
  const filteredPOI = pointsOfInterest.filter(poi =>
    !selectedLocations.find(loc => loc.place_id === poi.place_id)
  );

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5">
            <h1 className="h3 fw-bold text-primary mb-3">
              {getTranslation('stepDescription.title', language)}
            </h1>
            <p className="text-muted">
              {getTranslation('stepDescription.description', language)}
            </p>
          </div>

          {/* Formulario */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {/* Presentación del producto */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    {getTranslation('stepDescription.presentation.label', language)}
                  </h6>
                  <i className="fas fa-question-circle text-primary ms-2"></i>
                </div>
                <p className="text-muted small mb-3">
                  {getTranslation('stepDescription.presentation.instructions', language)}
                </p>
                <div className="position-relative">
                  <textarea
                    className="form-control"
                    rows={4}
                    value={activityData?.presentation || presentation}
                    onChange={(e) => setPresentation(e.target.value)}
                    placeholder={getTranslation('stepDescription.presentation.placeholder', language)}
                    maxLength={PRESENTATION_LIMIT}
                  />
                  <div className="position-absolute bottom-0 end-0 mb-2 me-2">
                    <small className={`${presentation.length > PRESENTATION_LIMIT * 0.9 ? 'text-warning' : 'text-muted'}`}>
                      {presentation.length} / {PRESENTATION_LIMIT}
                    </small>
                  </div>
                </div>
              </div>

              {/* Descripción completa del producto */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    {getTranslation('stepDescription.fullDescription.label', language)}
                  </h6>
                  <i className="fas fa-question-circle text-primary ms-2"></i>
                </div>
                <p className="text-muted small mb-3">
                  {getTranslation('stepDescription.fullDescription.instructions', language)}
                </p>
                <div className="position-relative">
                  <textarea
                    className="form-control"
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={getTranslation('stepDescription.fullDescription.placeholder', language)}
                    maxLength={DESCRIPTION_LIMIT}
                  />
                  <div className="position-absolute bottom-0 end-0 mb-2 me-2">
                    <small className={`${description.length > DESCRIPTION_LIMIT * 0.9 ? 'text-warning' : 'text-muted'}`}>
                      {description.length} / {DESCRIPTION_LIMIT}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Selection Component */}
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <h6 className="fw-bold mb-0">
                  ¿Qué visitarán los clientes?
                </h6>
                <i className="fas fa-info-circle text-primary ms-2"></i>
              </div>
              <p className="text-muted small mb-4">
                Añade las actividades, atracciones y lugares de interés que los clientes podrán realizar y visitar durante la experiencia. Selecciona actividades específicas como museos, parques, restaurantes, actividades al aire libre, etc.
              </p>
              
              {/* Destination Dropdown */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Seleccionar destino principal</label>
                <select
                  className="form-select"
                  value={selectedPlace?.id || ''}
                  onChange={(e) => {
                    const placeId = parseInt(e.target.value);
                    const place = places.find(p => p.id === placeId);
                    if (place) {
                      handlePlaceSelect(place);
                    }
                  }}
                  disabled={loadingPlaces}
                >
                  <option value="">
                    {loadingPlaces ? 'Cargando destinos...' : 'Selecciona un destino'}
                  </option>
                  {places.map((place) => {
                    const hasSelectedPOI = poiByDestination[place.id];
                    const poiCount = hasSelectedPOI ? hasSelectedPOI.selectedPOI.length : 0;
                    
                    return (
                      <option key={place.id} value={place.id}>
                        {place.cityName} ({place.activityCount} actividades)
                        {poiCount > 0 && ` - ${poiCount} puntos seleccionados`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Search Input for Activities */}
              {selectedPlace && (
                <div className="mb-4">
                  <label className="form-label fw-semibold">Buscar actividades en {selectedPlace.cityName}</label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="fas fa-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar: museos, parques, monumentos, atracciones, experiencias turísticas..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => setShowSuggestions(true)}
                    />
                  </div>
                  
                  {/* Search Status */}
                  {searchQuery && loadingPOI && (
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="fas fa-spinner fa-spin me-1"></i>
                        Buscando actividades...
                      </small>
                    </div>
                  )}
                  
                  {searchQuery && !loadingPOI && filteredPOI.length === 0 && (
                    <div className="mt-2">
                      <small className="text-muted">
                        No se encontraron experiencias turísticas para: "{searchQuery}"
                      </small>
                    </div>
                  )}
                </div>
              )}

              {/* Loading existing POI */}
              {loadingExistingPOI && (
                <div className="mb-4">
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Cargando puntos de interés existentes...
                  </div>
                </div>
              )}

              {/* All Selected Activities with Destination Labels */}
              {Object.keys(poiByDestination).length > 0 && !loadingExistingPOI && (
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-semibold mb-0">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Experiencias Turísticas Seleccionadas
                    </h6>
                    <span className="badge bg-primary">
                      {Object.values(poiByDestination).reduce((total, dest) => total + dest.selectedPOI.length, 0)} puntos
                    </span>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {Object.values(poiByDestination).map((destinationData) => 
                      destinationData.selectedPOI.map((poi) => {
                        const isGlobalMain = globalMainLocation && globalMainLocation.place_id === poi.place_id;
                        return (
                          <div key={poi.place_id} className="position-relative">
                            <span
                              className={`badge d-flex align-items-center gap-2 ${
                                isGlobalMain 
                                  ? 'bg-warning text-dark' 
                                  : 'bg-primary'
                              }`}
                              style={{ fontSize: '0.875rem' }}
                            >
                              <i className="fas fa-map-marker-alt me-1"></i>
                              <div className="d-flex flex-column align-items-start">
                                <span className="fw-semibold">{poi.name}</span>
                                <small className={isGlobalMain ? 'text-dark' : 'text-light'}>
                                  📍 {destinationData.place.cityName}
                                  {poi.destinationId && (
                                    <span className="ms-1">
                                      (ID: {poi.destinationId})
                                    </span>
                                  )}
                                  {isGlobalMain && ' • PRINCIPAL'}
                                </small>
                              </div>
                              <button
                                type="button"
                                className="btn-close btn-close-white"
                                style={{ fontSize: '0.6rem' }}
                                onClick={() => handleLocationRemove(poi.place_id)}
                                aria-label="Eliminar actividad"
                              ></button>
                            </span>
                            {!isGlobalMain && (
                              <button
                                type="button"
                                className="btn btn-warning btn-sm position-absolute top-0 start-100 translate-middle rounded-circle"
                                style={{ width: '20px', height: '20px', fontSize: '10px' }}
                                onClick={() => handleSetMainLocation(poi)}
                                title="Marcar como punto principal"
                              >
                                <i className="fas fa-star"></i>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Points of Interest Results */}
              {selectedPlace && (
                <div>
                  {loadingPOI && !searchQuery ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                  Cargando experiencias turísticas disponibles...
                </div>
                  ) : (
                    <>
                      <h6 className="fw-semibold mb-3">
                        {searchQuery ? `EXPERIENCIAS TURÍSTICAS PARA "${searchQuery.toUpperCase()}"` : `QUÉ HACER EN ${selectedPlace.cityName.toUpperCase()}`}
                      </h6>
                      <div className="row g-2">
                        {filteredPOI.map((poi) => {
                          const isSelected = selectedLocations.find(loc => loc.place_id === poi.place_id);
                          const isGlobalMain = globalMainLocation && globalMainLocation.place_id === poi.place_id;
                          
                          return (
                            <div key={poi.place_id} className="col-auto">
                              <button
                                type="button"
                                className={`btn btn-sm d-flex align-items-center gap-2 ${
                                  isGlobalMain 
                                    ? 'btn-warning' 
                                    : isSelected 
                                      ? 'btn-success' 
                                      : 'btn-outline-primary'
                                }`}
                                onClick={() => handlePOISelect(poi)}
                                disabled={!!isSelected}
                              >
                                {isGlobalMain ? (
                                  <i className="fas fa-star"></i>
                                ) : (
                                  <i className="fas fa-map-marker-alt"></i>
                                )}
                                <div className="d-flex flex-column align-items-start">
                                  <span className="fw-semibold">{poi.name}</span>
                                  {poi.types && poi.types.length > 0 && (
                                    <small className={isGlobalMain ? 'text-dark' : 'text-muted'}>
                                      {poi.types[0].replace(/_/g, ' ')}
                                    </small>
                                  )}
                                </div>
                                {poi.rating && (
                                  <small className={`ms-2 ${isGlobalMain ? 'text-dark' : 'text-muted'}`}>
                                    <i className="fas fa-star text-warning"></i> {poi.rating.toFixed(1)}
                                  </small>
                                )}
                                {isGlobalMain && (
                                  <small className="badge bg-dark ms-2">PRINCIPAL GLOBAL</small>
                                )}
                                {isSelected && !isGlobalMain && (
                                  <small className="badge bg-success ms-2">SELECCIONADO</small>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      {filteredPOI.length === 0 && !loadingPOI && (
                        <div className="text-muted text-center py-3">
                          <i className="fas fa-search fs-1 mb-3"></i>
                          <p>
                            {searchQuery 
                              ? `No se encontraron experiencias turísticas para "${searchQuery}"`
                              : "No se encontraron experiencias turísticas para este destino"
                            }
                          </p>
                          {!searchQuery && (
                            <small>Intenta buscar con términos específicos como museos, parques, monumentos, etc.</small>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}


              {/* Instructions when no destination selected */}
              {!selectedPlace && Object.keys(poiByDestination).length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-map-marker-alt fs-1 mb-3"></i>
                  <p>Selecciona un destino para buscar experiencias turísticas</p>
                  <small>Usa el buscador para encontrar museos, parques, monumentos, atracciones y más</small>
                </div>
              )}
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="alert alert-danger mt-3" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Botones de navegación */}
          <div className="d-flex justify-content-between mt-4">
            <button 
              className="btn btn-outline-secondary" 
              onClick={handleBack}
            >
              <i className="fas fa-arrow-left me-2"></i>
              {getTranslation('common.back', language)}
            </button>
            
            <div>
              <button 
                className="btn btn-outline-primary me-2" 
                onClick={handleSaveAndExit}
              >
                {getTranslation('stepDescription.saveAndExit', language)}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleContinue}
              >
                {getTranslation('common.continue', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ActivityCreationLayout>
  );
};

export default StepDescription;

