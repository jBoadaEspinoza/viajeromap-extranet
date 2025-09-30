import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import OptionSetupLayout from '../../../components/OptionSetupLayout';
import { useActivityParams } from '../../../hooks/useActivityParams';
import { navigateToActivityStep } from '../../../utils/navigationUtils';
import GoogleMapsModal from '../../../components/GoogleMapsModal';
import { placesApi, Place } from '../../../api/places';
import { transportModesApi, TransportMode } from '../../../api/transportModes';
import { bookingOptionApi, CreateBookingOptionMeetingPickupRequest } from '../../../api/bookingOption';

interface MeetingPickupData {
  arrivalMethod: 'meetingPoint' | 'pickupService';
  pickupType: 'zones' | 'specificPlaces';
  pickupAddresses: string[];
  pickupAddressNotes: string[]; // Nuevo: notas para cada dirección de pickup
  pickupDescription: string;
  pickupTimeCommunication: 'activityStart' | 'dayBefore' | 'within24h';
  pickupTiming: string;
  returnLocation: 'samePickup' | 'otherLocation' | 'noReturn';
  returnAddresses: string[]; // Nuevo: direcciones de regreso
  transportMode: string;
  originCity: string;
  meetingPointAddress: string; // Nuevo: dirección del punto de encuentro
  meetingPointLatitude: number; // Nuevo: latitud del punto de encuentro
  meetingPointLongitude: number; // Nuevo: longitud del punto de encuentro
  customPickupTiming: string; // Nuevo: timing personalizado
  meetingPointDescription: string; // Descripción del punto de encuentro
}

export default function StepOptionMeetingPickup() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Obtener parámetros de URL
  const { activityId, lang, currency, currentStep } = useActivityParams();
  
  const [formData, setFormData] = useState<MeetingPickupData>({
    arrivalMethod: 'meetingPoint',
    pickupType: 'zones',
    pickupAddresses: [],
    pickupAddressNotes: [], // Inicializar con un array vacío
    pickupDescription: '',
    pickupTimeCommunication: 'dayBefore',
    pickupTiming: '0-30',
    returnLocation: 'samePickup',
    returnAddresses: [],
    transportMode: 'car',
    originCity: 'lima', // Ciudad de origen por defecto
    meetingPointAddress: '', // Dirección del punto de encuentro
    meetingPointLatitude: 0, // Latitud del punto de encuentro
    meetingPointLongitude: 0, // Longitud del punto de encuentro
    customPickupTiming: '', // Timing personalizado
    meetingPointDescription: '' // Descripción del punto de encuentro
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newReturnAddress, setNewReturnAddress] = useState('');
  const [showGoogleMapsModal, setShowGoogleMapsModal] = useState(false);
  const [modalLocationType, setModalLocationType] = useState<'address' | 'zone'>('address');
  const [showReturnGoogleMapsModal, setShowReturnGoogleMapsModal] = useState(false);
  const [showMeetingPointGoogleMapsModal, setShowMeetingPointGoogleMapsModal] = useState(false);
  
  // Estado para el modal de notas de direcciones
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(-1);
  const [currentNoteText, setCurrentNoteText] = useState<string>('');
  
  // Estado para las ciudades disponibles desde la API
  const [availableCities, setAvailableCities] = useState<Place[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [citiesError, setCitiesError] = useState<string | null>(null);

  // Estado para los modos de transporte disponibles desde la API
  const [availableTransportModes, setAvailableTransportModes] = useState<TransportMode[]>([]);
  const [isLoadingTransportModes, setIsLoadingTransportModes] = useState(true);
  const [transportModesError, setTransportModesError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasRedirected = useRef(false);

  const optionId = searchParams.get('optionId');
  const storageKey = `meetingPickup_${optionId || 'default'}`;

  // Cargar datos de la opción de reserva existente si hay optionId
  useEffect(() => {
    const loadBookingOption = async () => {
      if (!optionId || !activityId || !lang || !currency) return;
      
      setIsLoading(true);
      try {
        const response = await bookingOptionApi.searchBookingOptionById(activityId, optionId, lang, currency);
        
        if (response.success && response.data) {
          // Mapear los datos de la API al formato del formulario
          const optionData = response.data;
          
          setFormData({
            arrivalMethod: optionData.meetingType === 'MEETING_POINT' ? 'meetingPoint' : 'pickupService',
            pickupType: optionData.pickupPoints && optionData.pickupPoints.length > 0 ? 'specificPlaces' : 'zones',
            pickupAddresses: optionData.pickupPoints?.map(point => point.address) || [],
            pickupAddressNotes: optionData.pickupPoints?.map(point => point.name) || [],
            pickupDescription: '', // No disponible en BookingOption
            pickupTimeCommunication: optionData.pickupNotificationWhen === 'ACTIVITY_START' ? 'activityStart' : 
                                   optionData.pickupNotificationWhen === 'DAY_BEFORE' ? 'dayBefore' : 'within24h',
            pickupTiming: optionData.pickupTimeOption || '0-30',
            returnLocation: optionData.dropoffType === 'SAME_PICKUP' ? 'samePickup' : 
                          optionData.dropoffType === 'OTHER_LOCATION' ? 'otherLocation' : 'noReturn',
            returnAddresses: [], // No disponible en BookingOption
            transportMode: optionData.transportModeId?.toString() || 'car',
            originCity: optionData.pickupPoints && optionData.pickupPoints.length > 0 
              ? optionData.pickupPoints[0].city.cityName.toLowerCase() 
              : (optionData.meetingPointCity?.toLowerCase() || 'lima'),
            meetingPointAddress: optionData.meetingPointAddress || '',
            meetingPointLatitude: optionData.meetingPointLatitude || 0,
            meetingPointLongitude: optionData.meetingPointLongitude || 0,
            customPickupTiming: '', // No disponible en BookingOption
            meetingPointDescription: optionData.meetingPointDescription || ''
          });
        }
      } catch (error) {
        console.error('StepOptionMeetingPickup: Error al cargar opción de reserva:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingOption();
  }, [optionId, activityId, lang, currency]);

  // Redireccionar a extranet/login si no hay activityId
  useEffect(() => {
    if (!activityId && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/extranet/login');
    }else{
      hasRedirected.current = false;
    }
  }, [activityId, navigate]);

  // Función para obtener las coordenadas de la ciudad seleccionada
  const getCityCoordinates = () => {
    const selectedCity = availableCities.find(city => city.cityName.toLowerCase() === formData.originCity);
    if (selectedCity) {
      return { lat: selectedCity.latitude, lng: selectedCity.longitude };
    }
    return undefined;
  };

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error('StepOptionMeetingPickup: Error al cargar datos desde localStorage:', error);
      }
    }
  }, [storageKey]);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, storageKey]);

  // Cargar ciudades disponibles desde la API
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoadingCities(true);
        setCitiesError(null);
        const cities = await placesApi.getPlaces();
        setAvailableCities(cities);
        
        // Si no hay ciudad seleccionada o la ciudad seleccionada no existe en la lista, seleccionar la primera
        if (!formData.originCity || !cities.find(city => city.cityName.toLowerCase() === formData.originCity)) {
          if (cities.length > 0) {
            setFormData(prev => ({ ...prev, originCity: cities[0].cityName.toLowerCase() }));
          }
        }
      } catch (error) {
        console.error('Error al cargar ciudades:', error);
        setCitiesError('Error al cargar las ciudades disponibles. Por favor, recarga la página.');
      } finally {
        setIsLoadingCities(false);
      }
    };

    fetchCities();
  }, [formData.originCity]);

  // Cargar modos de transporte disponibles desde la API
  useEffect(() => {
    const fetchTransportModes = async () => {
      try {
        setIsLoadingTransportModes(true);
        setTransportModesError(null);
        const response = await transportModesApi.getTransportModes({ lang: language });
        setAvailableTransportModes(response.data);
        
        // Si no hay modo de transporte seleccionado o el seleccionado no existe en la lista, seleccionar el primero
        if (!formData.transportMode || !response.data.find(mode => mode.name.toLowerCase() === formData.transportMode)) {
          if (response.data.length > 0) {
            setFormData(prev => ({ ...prev, transportMode: response.data[0].name.toLowerCase() }));
          }
        }
      } catch (error) {
        console.error('Error al cargar modos de transporte:', error);
        setTransportModesError('Error al cargar los modos de transporte disponibles. Por favor, recarga la página.');
      } finally {
        setIsLoadingTransportModes(false);
      }
    };

    fetchTransportModes();
  }, [language, formData.transportMode]);

  const handleAddAddress = (address: string) => {
    if (address.trim() && !formData.pickupAddresses.includes(address.trim())) {
      setFormData(prev => ({
        ...prev,
        pickupAddresses: [...prev.pickupAddresses, address.trim()],
        pickupAddressNotes: [...prev.pickupAddressNotes, ''] // Inicializar nota vacía
      }));
    }
  };

  const handleRemoveAddress = (index: number) => {
    const newAddresses = formData.pickupAddresses.filter((_, i) => i !== index);
    const newNotes = formData.pickupAddressNotes.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      pickupAddresses: newAddresses,
      pickupAddressNotes: newNotes
    });
  };

  // Función para abrir el modal de notas
  const handleOpenNotesModal = (index: number) => {
    setCurrentNoteIndex(index);
    setCurrentNoteText(formData.pickupAddressNotes[index] || '');
    setShowNotesModal(true);
  };

  // Función para guardar la nota
  const handleSaveNote = () => {
    if (currentNoteIndex >= 0) {
      const newNotes = [...formData.pickupAddressNotes];
      newNotes[currentNoteIndex] = currentNoteText;
      setFormData({
        ...formData,
        pickupAddressNotes: newNotes
      });
    }
    setShowNotesModal(false);
    setCurrentNoteIndex(-1);
    setCurrentNoteText('');
  };

  // Función para cerrar el modal de notas
  const handleCloseNotesModal = () => {
    setShowNotesModal(false);
    setCurrentNoteIndex(-1);
    setCurrentNoteText('');
  };

  const handleAddReturnAddress = () => {
    if (newReturnAddress.trim() && !formData.returnAddresses.includes(newReturnAddress.trim())) {
      setFormData(prev => ({
        ...prev,
        returnAddresses: [...prev.returnAddresses, newReturnAddress.trim()]
      }));
      setNewReturnAddress('');
    }
  };

  const handleRemoveReturnAddress = (index: number) => {
    setFormData(prev => ({
      ...prev,
      returnAddresses: prev.returnAddresses.filter((_, i) => i !== index)
    }));
  };

  const handleOpenGoogleMapsModal = (type: 'address' | 'zone') => {
    setModalLocationType(type);
    setShowGoogleMapsModal(true);
  };

  const handleOpenReturnGoogleMapsModal = () => {
    setShowReturnGoogleMapsModal(true);
  };

  const handleOpenMeetingPointGoogleMapsModal = () => {
    setShowMeetingPointGoogleMapsModal(true);
  };

  const handleSaveLocation = (location: { address: string; lat: number; lng: number; placeName?: string }) => {
    // Crear texto de ubicación que incluya el nombre del lugar si está disponible
    let locationText = location.address;
    
    if (location.placeName && location.placeName !== location.address) {
      locationText = `${location.placeName} - ${location.address}`;
    }
    
    locationText += ` (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
    
    if (!formData.pickupAddresses.includes(locationText)) {
      setFormData(prev => ({
        ...prev,
        pickupAddresses: [...prev.pickupAddresses, locationText]
      }));
    }
  };

  const handleSaveReturnLocation = (location: { address: string; lat: number; lng: number; placeName?: string }) => {
    // Crear texto de ubicación que incluya el nombre del lugar si está disponible
    let locationText = location.address;
    
    if (location.placeName && location.placeName !== location.address) {
      locationText = `${location.placeName} - ${location.address}`;
    }
    
    locationText += ` (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
    
    if (!formData.returnAddresses.includes(locationText)) {
      setFormData(prev => ({
        ...prev,
        returnAddresses: [...prev.returnAddresses, locationText]
      }));
    }
  };

  const handleSaveMeetingPointLocation = (location: { address: string; lat: number; lng: number; placeName?: string }) => {
    // Crear texto de ubicación que incluya el nombre del lugar si está disponible
    let locationText = location.address;
    
    if (location.placeName && location.placeName !== location.address) {
      locationText = `${location.placeName} - ${location.address}`;
    }
    
    locationText += ` (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`;
    
    setFormData(prev => ({
      ...prev,
      meetingPointAddress: locationText,
      meetingPointLatitude: location.lat,
      meetingPointLongitude: location.lng
    }));
  };

  const handleContinue = async () => {
    if (isSubmitting) return;
    
    // Validar campos obligatorios
    let isValid = true;
    let errorMessage = '';

    if (formData.arrivalMethod === 'meetingPoint') {
      if (!formData.meetingPointAddress.trim()) {
        isValid = false;
        errorMessage = 'Debes añadir la dirección del punto de encuentro.';
      }
    } else if (formData.arrivalMethod === 'pickupService') {
      if (formData.pickupAddresses.length === 0) {
        isValid = false;
        errorMessage = 'Debes añadir al menos una dirección o zona de recogida.';
      }
      
      if (formData.pickupTiming === 'custom' && !formData.customPickupTiming.trim()) {
        isValid = false;
        errorMessage = 'Debes especificar el horario personalizado de recogida.';
      }
      
      if (formData.returnLocation === 'otherLocation' && formData.returnAddresses.length === 0) {
        isValid = false;
        errorMessage = 'Debes añadir al menos una dirección de regreso.';
      }
    }

    if (!isValid) {
      alert(errorMessage);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Preparar datos para la API
      const apiRequest: CreateBookingOptionMeetingPickupRequest = {
        activityId: activityId!,
        bookingOptionId: optionId!,
        lang: language,
        meetingType: formData.arrivalMethod === 'meetingPoint' ? 'MEETING_POINT' : 'REFERENCE_CITY_WITH_LIST',
        
        // Meeting Point
        meetingPointId: formData.arrivalMethod === 'meetingPoint' ? 
          availableCities.find(city => city.cityName.toLowerCase() === formData.originCity)?.id || undefined : undefined,
        meetingPointAddress: formData.arrivalMethod === 'meetingPoint' ? formData.meetingPointAddress || undefined : undefined,
        meetingPointDescription: formData.arrivalMethod === 'meetingPoint' ? formData.meetingPointDescription || undefined : 
                                 formData.arrivalMethod === 'pickupService' ? formData.pickupDescription || undefined : undefined,
        meetingPointLatitude: formData.arrivalMethod === 'meetingPoint' ? formData.meetingPointLatitude : undefined,
        meetingPointLongitude: formData.arrivalMethod === 'meetingPoint' ? formData.meetingPointLongitude : undefined,
        
        // Pickup Points (solo si es pickup service - REFERENCE_CITY_WITH_LIST)
        pickupPoints: formData.arrivalMethod === 'pickupService' ? formData.pickupAddresses.map((address, index) => {
          // Extraer coordenadas del formato "address (lat, lng)"
          const coordsMatch = address.match(/\(([-\d.]+),\s*([-\d.]+)\)/);
          const lat = coordsMatch ? parseFloat(coordsMatch[1]) : 0;
          const lng = coordsMatch ? parseFloat(coordsMatch[2]) : 0;
          
          // Extraer nombre del lugar si existe
          const nameMatch = address.match(/^([^-]+)/);
          const name = nameMatch ? nameMatch[1].trim() : `Punto de recogida ${index + 1}`;
          
          // Limpiar dirección (mantener la dirección completa guardada)
          const cleanAddress = address.replace(/^[^-]+-\s*/, '').replace(/\s*\([-\d.,\s]+\)$/, '');
          
          return {
            cityId: availableCities.find(city => city.cityName.toLowerCase() === formData.originCity)?.id || 0,
            name: name,
            address: cleanAddress, // Dirección guardada en el grupo
            latitude: lat,
            longitude: lng,
            notes: formData.pickupAddressNotes[index] || '' // Usar notas de la lista
          };
        }) : undefined,
        
        // Pickup Config
        pickupNotificationWhen: formData.pickupTimeCommunication === 'activityStart' ? 'AT_START_TIME' :
                               formData.pickupTimeCommunication === 'dayBefore' ? 'DAY_BEFORE' : '24H_BEFORE',
        pickupTimeOption: formData.pickupTiming === '0-30' ? '30_MIN_BEFORE' :
                         formData.pickupTiming === '30-60' ? '60_MIN_BEFORE' :
                         formData.pickupTiming === '60-90' ? '90_MIN_BEFORE' :
                         formData.pickupTiming === '90-120' ? '120_MIN_BEFORE' :
                         formData.pickupTiming === 'custom' ? 'CUSTOM' : 'SAME_AS_START',
        customPickupMinutes: formData.pickupTiming === 'custom' ? parseInt(formData.customPickupTiming) || 0 : undefined,
        
        // Dropoff Config
        dropoffType: formData.returnLocation === 'samePickup' ? 'SAME_AS_PICKUP' :
                    formData.returnLocation === 'otherLocation' ? 'DIFFERENT_LOCATION' : 'NO_DROPOFF',
        
        // Transport
        transportModeId: formData.arrivalMethod === 'pickupService' ? 
          availableTransportModes.find(mode => mode.name.toLowerCase() === formData.transportMode)?.id || undefined : undefined
      };
      
      
      
      // Consumir la API
      const response = await bookingOptionApi.createBookingOptionMeetingPickup(apiRequest);
      
      if (response.success) {
        
        // Guardar el ID creado en localStorage para uso posterior
        localStorage.setItem(`meetingPickupId_${optionId}`, response.idCreated);
        
        // Navegar a la siguiente página
        navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing?optionId=${response.idCreated}`, {
          activityId,
          lang,
          currency,
          currentStep
        });
      } else {
        console.error('StepOptionMeetingPickup: Error en la API:', response.message);
        alert(`Error al guardar la configuración: ${response.message}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('StepOptionMeetingPickup: Error al consumir la API:', error);
      alert('Error inesperado al guardar la configuración. Por favor, inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createOptionSettings', {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  if (!optionId) {
    return (
      <OptionSetupLayout currentSection="meetingPickup">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Cargando configuración del punto de encuentro...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  // Si está cargando los datos de la opción de reserva
  if (isLoading) {
    return (
      <OptionSetupLayout currentSection="meetingPickup">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando configuración de encuentro y pickup...</span>
                </div>
                <p className="text-muted">Cargando configuración de encuentro y pickup...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  // Mostrar loading mientras se cargan las ciudades
  if (isLoadingCities && availableCities.length === 0) {
    return (
      <OptionSetupLayout currentSection="meetingPickup">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando ciudades...</span>
                </div>
                <p className="text-muted">Cargando ciudades disponibles...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  if (!activityId) {
    return (
      <OptionSetupLayout currentSection="meetingPickup">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <h6 className="alert-heading">Actividad no encontrada</h6>
                  <p className="mb-0">
                    {language === 'es' 
                      ? 'No se encontró información de la actividad. Por favor, regresa al paso anterior para continuar.'
                      : 'Activity information not found. Please go back to the previous step to continue.'
                    }
                  </p>
                  <hr />
                  <button 
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => navigateToActivityStep(navigate, '/extranet/activity/createCategory', {
                      activityId,
                      lang,
                      currency,
                      currentStep
                    })}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    {language === 'es' ? 'Ir a Categoría' : 'Go to Category'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  return (
    <OptionSetupLayout currentSection="meetingPickup">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Header con título y badges */}
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <h5 className="fw-bold text-primary mb-0">
                    {getTranslation('stepMeetingPickup.title', language)}
                  </h5>
                </div>

                {/* ¿Cómo llegan los clientes a la actividad? */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.howToArrive', language)}</h6>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="arrivalMethod"
                      id="meetingPoint"
                      value="meetingPoint"
                      checked={formData.arrivalMethod === 'meetingPoint'}
                      onChange={(e) => setFormData({...formData, arrivalMethod: e.target.value as 'meetingPoint' | 'pickupService'})}
                    />
                    <label className="form-check-label" htmlFor="meetingPoint">
                      {getTranslation('stepMeetingPickup.arrivalMethod.meetingPoint.description', language)}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="arrivalMethod"
                      id="pickupService"
                      value="pickupService"
                      checked={formData.arrivalMethod === 'pickupService'}
                      onChange={(e) => setFormData({...formData, arrivalMethod: e.target.value as 'meetingPoint' | 'pickupService'})}
                    />
                    <label className="form-check-label" htmlFor="pickupService">
                      {getTranslation('stepMeetingPickup.arrivalMethod.pickupService.description', language)}
                    </label>
                  </div>
                </div>

                {/* Ciudad de Origen - Siempre visible */}
                <div className="mb-4">
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">{getTranslation('stepMeetingPickup.originCity.label', language)}</label>
                      {isLoadingCities ? (
                        <div className="d-flex align-items-center">
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">{getTranslation('stepMeetingPickup.originCity.loading', language)}</span>
                          </div>
                          <span className="text-muted">{getTranslation('stepMeetingPickup.originCity.loading', language)}</span>
                        </div>
                      ) : citiesError ? (
                        <div className="alert alert-danger">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          <div className="d-flex justify-content-between align-items-center">
                                                          <span>{getTranslation('stepMeetingPickup.originCity.error', language)}</span>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setCitiesError(null);
                                setIsLoadingCities(true);
                                placesApi.getPlaces()
                                  .then(cities => {
                                    setAvailableCities(cities);
                                    if (cities.length > 0 && (!formData.originCity || !cities.find(city => city.cityName.toLowerCase() === formData.originCity))) {
                                      setFormData(prev => ({ ...prev, originCity: cities[0].cityName.toLowerCase() }));
                                    }
                                  })
                                  .catch(error => {
                                    console.error('Error al reintentar cargar ciudades:', error);
                                    setCitiesError('Error al cargar las ciudades disponibles. Por favor, recarga la página.');
                                  })
                                  .finally(() => setIsLoadingCities(false));
                              }}
                            >
                              <i className="fas fa-redo me-1"></i>
                              {getTranslation('stepMeetingPickup.originCity.retry', language)}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <select
                            className="form-select"
                            value={formData.originCity}
                            onChange={(e) => setFormData({...formData, originCity: e.target.value})}
                            disabled={availableCities.length === 0}
                          >
                            {availableCities.length === 0 ? (
                              <option value="">{getTranslation('stepMeetingPickup.originCity.noCities', language)}</option>
                            ) : (
                              availableCities.map((city) => (
                                <option key={city.id} value={city.cityName.toLowerCase()}>
                                  {city.cityName.charAt(0).toUpperCase() + city.cityName.slice(1)}
                                </option>
                              ))
                            )}
                          </select>
                          <small className="text-muted">
                            {getTranslation('stepMeetingPickup.originCity.filterInfo', language)}
                          </small>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Punto de encuentro - Solo visible si se selecciona meetingPoint */}
                {formData.arrivalMethod === 'meetingPoint' && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.meetingPoint.title', language)}</h6>
                    <p className="text-muted mb-3">
                      {getTranslation('stepMeetingPickup.meetingPoint.description', language)}
                    </p>
                    
                    {/* Dirección del punto de encuentro */}
                    {formData.meetingPointAddress ? (
                      <div className="mb-3">
                        <div className="alert alert-success">
                          <i className="fas fa-map-marker-alt me-2"></i>
                          <strong>{getTranslation('stepMeetingPickup.meetingPoint.current', language)}</strong><br />
                          <span className="text-break">{formData.meetingPointAddress}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={() => setFormData(prev => ({ ...prev, meetingPointAddress: '', meetingPointLatitude: 0, meetingPointLongitude: 0 }))}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <button 
                          className="btn btn-primary"
                          onClick={handleOpenMeetingPointGoogleMapsModal}
                        >
                          <i className="fas fa-plus me-2"></i>
                          {getTranslation('stepMeetingPickup.meetingPoint.addAddress', language)}
                        </button>
                        <small className="text-muted d-block mt-2">
                          {getTranslation('stepMeetingPickup.meetingPoint.help', language)}
                        </small>
                      </div>
                    )}

                    {/* Descripción del punto de encuentro - Solo visible si hay punto de encuentro */}
                    <div className="mt-4">
                      <h6 className="fw-bold mb-3">
                        {getTranslation('stepMeetingPickup.meetingPointDescription.title', language)}
                        <span className="text-muted ms-2">({getTranslation('stepMeetingPickup.meetingPointDescription.optional', language)})</span>
                      </h6>
                      
                      {/* Preguntas guía */}
                      <div className="mb-3">
                        <p className="text-muted mb-2">
                          {getTranslation('stepMeetingPickup.meetingPointDescription.question1', language)}
                        </p>
                      <p className="text-muted mb-3">
                          {getTranslation('stepMeetingPickup.meetingPointDescription.question2', language)}
                      </p>
                      </div>
                      
                      <textarea
                        className="form-control"
                        rows={4}
                        value={formData.meetingPointDescription}
                        onChange={(e) => setFormData({...formData, meetingPointDescription: e.target.value})}
                        placeholder={getTranslation('stepMeetingPickup.meetingPointDescription.placeholder', language)}
                        maxLength={1000}
                      />
                      <div className="text-end mt-2">
                        <small className="text-muted">
                          {formData.meetingPointDescription.length} / 1000
                        </small>
                      </div>
                    </div>
                  </div>
                )}

                {/* Servicio de recogida - Solo visible si se selecciona pickupService */}
                {formData.arrivalMethod === 'pickupService' && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.pickupService.title', language)}</h6>
                                          <p className="text-muted mb-3">
                        {getTranslation('stepMeetingPickup.pickupService.description', language)}
                      </p>
                    
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="pickupType"
                        id="zones"
                        value="zones"
                        checked={formData.pickupType === 'zones'}
                        onChange={(e) => setFormData({...formData, pickupType: e.target.value as 'zones' | 'specificPlaces'})}
                      />
                      <label className="form-check-label" htmlFor="zones">
                        {getTranslation('stepMeetingPickup.pickupType.zones.description', language)}
                      </label>
                    </div>
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="pickupType"
                        id="specificPlaces"
                        value="specificPlaces"
                        checked={formData.pickupType === 'specificPlaces'}
                        onChange={(e) => setFormData({...formData, pickupType: e.target.value as 'zones' | 'specificPlaces'})}
                      />
                      <label className="form-check-label" htmlFor="specificPlaces">
                        {getTranslation('stepMeetingPickup.pickupType.specificPlaces.description', language)}
                      </label>
                    </div>

                    <div className="mb-3">
                      <p className="text-muted mb-2">
                        {formData.pickupType === 'zones' 
                          ? getTranslation('stepMeetingPickup.pickupType.zones.addMessage', language)
                          : getTranslation('stepMeetingPickup.pickupType.specificPlaces.addMessage', language)
                        }
                      </p>
                      
                      {/* Input para añadir dirección */}
                      <div className="d-flex gap-2 mb-2">
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleOpenGoogleMapsModal(formData.pickupType === 'zones' ? 'zone' : 'address')}
                        >
                          <i className="fas fa-plus me-2"></i>
                          {formData.pickupType === 'zones' ? getTranslation('stepMeetingPickup.pickupType.zones', language) : getTranslation('stepMeetingPickup.pickupType.specificPlaces', language)}
                        </button>
                      </div>
                      
                      {formData.pickupType === 'zones' && (
                        <small className="text-muted d-block mb-2">
                          {getTranslation('stepMeetingPickup.pickupType.zones.mapDescription', language)}
                        </small>
                      )}

                      {/* Lista de direcciones/zonas */}
                      {formData.pickupAddresses.length > 0 && (
                        <div className="mb-3">
                          <h6 className="fw-bold mb-2">
                            {formData.pickupType === 'zones' ? getTranslation('stepMeetingPickup.pickupType.zones.added', language) : getTranslation('stepMeetingPickup.pickupType.specificPlaces.added', language)}
                          </h6>
                          {formData.pickupAddresses.map((address, index) => (
                            <div key={index} className="d-flex align-items-center gap-2 mb-2">
                              <span className="badge bg-light text-dark">{address}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-info"
                                onClick={() => handleOpenNotesModal(index)}
                                title={getTranslation('stepMeetingPickup.notes.button', language)}
                              >
                                <i className="fas fa-sticky-note"></i>
                                {formData.pickupAddressNotes[index] && (
                                  <span className="ms-1 text-success">✓</span>
                                )}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveAddress(index)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Descripción del servicio de recogida */}
                {formData.arrivalMethod !== 'pickupService' && formData.arrivalMethod !== 'meetingPoint' && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.pickupDescription.optional', language)}</h6>
                                          <p className="text-muted mb-3">
                        {getTranslation('stepMeetingPickup.pickupDescription.help', language)}
                      </p>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={formData.pickupDescription}
                      onChange={(e) => setFormData({...formData, pickupDescription: e.target.value})}
                      placeholder={getTranslation('stepMeetingPickup.pickupDescription.placeholder', language)}
                      maxLength={1000}
                    />
                    <div className="text-end mt-2">
                      <small className="text-muted">
                        {formData.pickupDescription.length} / 1000
                      </small>
                    </div>
                  </div>
                )}

                {/* ¿Cuándo le comunicas al cliente la hora de recogida? */}
                {formData.arrivalMethod === 'pickupService' && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">
                      {getTranslation('stepMeetingPickup.pickupTimeCommunication.title', language)}
                    </h6>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="pickupTimeCommunication"
                        id="activityStart"
                        value="activityStart"
                        checked={formData.pickupTimeCommunication === 'activityStart'}
                        onChange={(e) => setFormData({...formData, pickupTimeCommunication: e.target.value as 'activityStart' | 'dayBefore' | 'within24h'})}
                      />
                      <label className="form-check-label" htmlFor="activityStart">
                        {getTranslation('stepMeetingPickup.pickupTimeCommunication.activityStart', language)}
                      </label>
                    </div>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="pickupTimeCommunication"
                        id="dayBefore"
                        value="dayBefore"
                        checked={formData.pickupTimeCommunication === 'dayBefore'}
                        onChange={(e) => setFormData({...formData, pickupTimeCommunication: e.target.value as 'activityStart' | 'dayBefore' | 'within24h'})}
                      />
                      <label className="form-check-label" htmlFor="dayBefore">
                        {getTranslation('stepMeetingPickup.pickupTimeCommunication.dayBefore', language)}
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="pickupTimeCommunication"
                        id="within24h"
                        value="within24h"
                        checked={formData.pickupTimeCommunication === 'within24h'}
                        onChange={(e) => setFormData({...formData, pickupTimeCommunication: e.target.value as 'activityStart' | 'dayBefore' | 'within24h'})}
                      />
                      <label className="form-check-label" htmlFor="within24h">
                        {getTranslation('stepMeetingPickup.pickupTimeCommunication.within24h', language)}
                      </label>
                    </div>
                  </div>
                )}

                {/* ¿Cuándo sueles recoger a los clientes? */}
                {formData.arrivalMethod === 'pickupService' && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.pickupTiming.title', language)}</h6>
                    <p className="text-muted mb-3">
                      {getTranslation('stepMeetingPickup.pickupTiming.description', language)}
                    </p>
                    <select
                      className="form-select"
                      value={formData.pickupTiming}
                      onChange={(e) => setFormData({...formData, pickupTiming: e.target.value})}
                    >
                      <option value="0-30">{getTranslation('stepMeetingPickup.pickupTiming.0-30', language)}</option>
                      <option value="30-60">{getTranslation('stepMeetingPickup.pickupTiming.30-60', language)}</option>
                      <option value="60-90">{getTranslation('stepMeetingPickup.pickupTiming.60-90', language)}</option>
                      <option value="90-120">{getTranslation('stepMeetingPickup.pickupTiming.90-120', language)}</option>
                      <option value="custom">{getTranslation('stepMeetingPickup.pickupTiming.custom', language)}</option>
                    </select>
                    
                    {/* Input para timing personalizado */}
                    {formData.pickupTiming === 'custom' && (
                      <div className="mt-3">
                        <label className="form-label fw-bold">{getTranslation('stepMeetingPickup.pickupTiming.customLabel', language)}</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.customPickupTiming}
                          onChange={(e) => setFormData({...formData, customPickupTiming: e.target.value})}
                          placeholder={getTranslation('stepMeetingPickup.pickupTiming.customPlaceholder', language)}
                          maxLength={100}
                        />
                        <small className="text-muted">
                          {getTranslation('stepMeetingPickup.pickupTiming.customHelp', language)}
                        </small>
                      </div>
                    )}
                  </div>
                )}

                {/* Regreso */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.return.title', language)}</h6>
                  <p className="text-muted mb-3">
                    {getTranslation('stepMeetingPickup.return.description', language)}
                  </p>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="returnLocation"
                      id="samePickup"
                      value="samePickup"
                      checked={formData.returnLocation === 'samePickup'}
                      onChange={(e) => setFormData({...formData, returnLocation: e.target.value as 'samePickup' | 'otherLocation' | 'noReturn'})}
                    />
                    <label className="form-check-label" htmlFor="samePickup">
                      {formData.arrivalMethod === 'pickupService' 
                        ? getTranslation('stepMeetingPickup.return.samePickup.pickupService', language)
                        : getTranslation('stepMeetingPickup.return.samePickup.meetingPoint', language)
                      }
                    </label>
                  </div>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="returnLocation"
                      id="otherLocation"
                      value="otherLocation"
                      checked={formData.returnLocation === 'otherLocation'}
                      onChange={(e) => setFormData({...formData, returnLocation: e.target.value as 'samePickup' | 'otherLocation' | 'noReturn'})}
                    />
                    <label className="form-check-label" htmlFor="otherLocation">
                      {getTranslation('stepMeetingPickup.return.otherLocation', language)}
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="returnLocation"
                      id="noReturn"
                      value="noReturn"
                      checked={formData.returnLocation === 'noReturn'}
                      onChange={(e) => setFormData({...formData, returnLocation: e.target.value as 'samePickup' | 'otherLocation' | 'noReturn'})}
                    />
                    <label className="form-check-label" htmlFor="noReturn">
                      {getTranslation('stepMeetingPickup.return.noReturn', language)}
                    </label>
                  </div>

                  {/* Añadir dirección de regreso - Solo visible si se selecciona "En otro lugar" */}
                  {formData.returnLocation === 'otherLocation' && (
                    <div className="ms-4">
                      <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.return.addAddress.title', language)}</h6>
                      <p className="text-muted mb-3">
                        {getTranslation('stepMeetingPickup.return.addAddress.description', language)}
                      </p>
                      
                      {/* Botón para añadir dirección de regreso */}
                      <div className="d-flex gap-2 mb-3">
                        <button 
                          className="btn btn-outline-primary"
                          onClick={handleOpenReturnGoogleMapsModal}
                        >
                          <i className="fas fa-map-marker-alt me-2"></i>
                          {getTranslation('googleMaps.buttons.addAddress', language)}
                        </button>
                      </div>

                      {/* Lista de direcciones de regreso */}
                      {formData.returnAddresses.length > 0 && (
                        <div className="mb-3">
                          <h6 className="fw-bold mb-2">{getTranslation('stepMeetingPickup.return.addresses.added', language)}</h6>
                          {formData.returnAddresses.map((address, index) => (
                            <div key={index} className="d-flex align-items-center gap-2 mb-2">
                              <span className="badge bg-light text-dark">{address}</span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveReturnAddress(index)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Transporte - Solo visible si hay servicio de recogida */}
                {formData.arrivalMethod === 'pickupService' && (
                  <div className="mb-4">
                    <h6 className="fw-bold mb-3">{getTranslation('stepMeetingPickup.transport.title', language)}</h6>
                    <p className="text-muted mb-3">
                      {getTranslation('stepMeetingPickup.transport.description', language)}
                    </p>
                    {isLoadingTransportModes ? (
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">{getTranslation('stepMeetingPickup.transport.loading', language)}</span>
                        </div>
                        <span className="text-muted">{getTranslation('stepMeetingPickup.transport.loading', language)}</span>
                      </div>
                    ) : transportModesError ? (
                      <div className="alert alert-danger">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{getTranslation('stepMeetingPickup.transport.error', language)}</span>
                          <button 
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => {
                              setTransportModesError(null);
                              setIsLoadingTransportModes(true);
                              transportModesApi.getTransportModes({ lang: language })
                                .then(response => {
                                  setAvailableTransportModes(response.data);
                                  if (response.data.length > 0 && (!formData.transportMode || !response.data.find(mode => mode.name.toLowerCase() === formData.transportMode))) {
                                    setFormData(prev => ({ ...prev, transportMode: response.data[0].name.toLowerCase() }));
                                  }
                                })
                                .catch(error => {
                                  console.error('Error al reintentar cargar modos de transporte:', error);
                                  setTransportModesError('Error al cargar los modos de transporte disponibles. Por favor, recarga la página.');
                                })
                                .finally(() => setIsLoadingTransportModes(false));
                            }}
                          >
                            <i className="fas fa-redo me-1"></i>
                            {getTranslation('stepMeetingPickup.transport.retry', language)}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <select
                        className="form-select"
                        value={formData.transportMode}
                        onChange={(e) => setFormData({...formData, transportMode: e.target.value})}
                      >
                        {availableTransportModes.map((mode) => (
                          <option key={mode.id} value={mode.name.toLowerCase()}>
                            {mode.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                {/* Botones de navegación */}
                <div className="d-flex justify-content-between mt-5">
                  <button 
                    type="button" 
                    className="btn btn-outline-primary"
                    onClick={handleBack}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    {getTranslation('stepMeetingPickup.buttons.back', language)}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleContinue}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-arrow-right ms-2"></i>
                    )}
                    {getTranslation('stepMeetingPickup.buttons.continue', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Google Maps para direcciones de recogida */}
      <GoogleMapsModal
        isOpen={showGoogleMapsModal}
        onClose={() => setShowGoogleMapsModal(false)}
        onSaveLocation={handleSaveLocation}
        originCity={formData.originCity}
        locationType={modalLocationType}
        cityCoordinates={getCityCoordinates()}
      />

      {/* Modal de Google Maps para punto de encuentro */}
      <GoogleMapsModal
        isOpen={showMeetingPointGoogleMapsModal}
        onClose={() => setShowMeetingPointGoogleMapsModal(false)}
        onSaveLocation={handleSaveMeetingPointLocation}
        originCity={formData.originCity}
        locationType="address"
        cityCoordinates={getCityCoordinates()}
      />

      {/* Modal de Google Maps para direcciones de regreso */}
      <GoogleMapsModal
        isOpen={showReturnGoogleMapsModal}
        onClose={() => setShowReturnGoogleMapsModal(false)}
        onSaveLocation={handleSaveReturnLocation}
        originCity={formData.originCity}
        locationType="address"
        cityCoordinates={getCityCoordinates()}
      />

      {/* Modal de notas para direcciones */}
      {showNotesModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {getTranslation('stepMeetingPickup.notes.modal.title', language)}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseNotesModal}
                ></button>
              </div>
              <div className="modal-body">
                <p className="text-muted mb-3">
                  {getTranslation('stepMeetingPickup.notes.modal.description', language)}
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  value={currentNoteText}
                  onChange={(e) => setCurrentNoteText(e.target.value)}
                  placeholder={getTranslation('stepMeetingPickup.notes.modal.placeholder', language)}
                  maxLength={500}
                />
                <div className="text-end mt-2">
                  <small className="text-muted">
                    {currentNoteText.length} / 500
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseNotesModal}
                >
                  {getTranslation('stepMeetingPickup.notes.modal.cancel', language)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveNote}
                >
                  {getTranslation('stepMeetingPickup.notes.modal.save', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OptionSetupLayout>
  );
} 