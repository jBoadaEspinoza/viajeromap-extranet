import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import OptionSetupLayout from '../../../components/OptionSetupLayout';
import { useAppSelector } from '../../../redux/store';
import { useActivityParams } from '../../../hooks/useActivityParams';
import { navigateToActivityStep } from '../../../utils/navigationUtils';
import { bookingOptionApi, CreateBookingOptionAvailabilityPricingRequest } from '../../../api/bookingOption';

interface AvailabilityPricingData {
  availabilityType: 'timeSlots' | 'openingHours';
  pricingType: 'perPerson' | 'perGroup';
}

export default function StepOptionAvailabilityPrice() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Obtener parámetros de URL
  const { activityId, lang, currency, currentStep } = useActivityParams();
  
  const [formData, setFormData] = useState<AvailabilityPricingData>({
    availabilityType: 'timeSlots',
    pricingType: 'perPerson'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAvailabilityPricingCompleted, setIsAvailabilityPricingCompleted] = useState(false);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState(true);
  const [bookingOptionData, setBookingOptionData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const optionId = searchParams.get('optionId');
  const storageKey = `availabilityPricing_${optionId || 'default'}`;

  // Cargar datos de la opción de reserva existente si hay optionId
  useEffect(() => {
    const loadBookingOption = async () => {
      if (!optionId || !activityId || !lang || !currency) return;
      
      setIsLoadingData(true);
      try {
        const response = await bookingOptionApi.searchBookingOptionById(activityId, optionId, lang, currency);
        
        if (response.success && response.data) {
          setBookingOptionData(response.data);
        }
      } catch (error) {
        console.error('StepOptionAvailabilityPrice: Error al cargar opción de reserva:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadBookingOption();
  }, [optionId, activityId, lang, currency]);

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error('StepOptionAvailabilityPrice: Error al cargar datos desde localStorage:', error);
      }
    }
  }, [storageKey]);

  // Verificar si la disponibilidad y precios están completos
  useEffect(() => {
    const checkAvailabilityPricingCompletion = async () => {
      if (!optionId) {
        setIsCheckingCompletion(false);
        return;
      }

      try {
        setIsCheckingCompletion(true);
        const response = await bookingOptionApi.isBookingOptionAvailabilityPricingCompleted(optionId);
        
        if (response.success && response.data?.isComplete) {
          setIsAvailabilityPricingCompleted(true);
        } else {
          setIsAvailabilityPricingCompleted(false);
        }
      } catch (error) {
        console.error('StepOptionAvailabilityPrice: Error al verificar completitud:', error);
        setIsAvailabilityPricingCompleted(false);
      } finally {
        setIsCheckingCompletion(false);
      }
    };

    checkAvailabilityPricingCompletion();
  }, [optionId]);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
      console.log('StepOptionAvailabilityPrice: Datos guardados en localStorage:', formData);
    }
  }, [formData, storageKey]);

  const handleAddSchedule = async () => {
    if (!optionId || !activityId) {
      alert('Error: Faltan datos requeridos para crear el horario.');
      return;
    }
    if(bookingOptionData && bookingOptionData.schedules && bookingOptionData.schedules.length > 0){
      setShowResetModal(true);
    }else{
      setIsSubmitting(true);
      try {
        const apiRequest: CreateBookingOptionAvailabilityPricingRequest = {
          activityId: activityId,
          bookingOptionId: optionId,
          availabilityMode: formData.availabilityType === 'timeSlots' ? 'TIME_SLOTS' : 'OPENING_HOURS',
          pricingMode: formData.pricingType === 'perPerson' ? 'PER_PERSON' : 'PER_GROUP'
        };

        console.log('StepOptionAvailabilityPrice: Enviando datos a la API:', apiRequest);

        const response = await bookingOptionApi.createBookingOptionAvailabilityPricing(apiRequest);

        if (response && response.success) {
          console.log('StepOptionAvailabilityPrice: Horario creado exitosamente:', response);
          
          // Navegar a la página de creación de horarios con los parámetros requeridos
          const currency = 'PEN'; // Por defecto, se puede obtener del contexto si está disponible
          navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing/create?optionId=${optionId}&step=1`, {
            activityId,
            lang,
            currency,
            currentStep
          });
        } else {
          console.error('StepOptionAvailabilityPrice: Error en la API:', response?.message);
          alert(`Error al crear el horario: ${response?.message || 'Error desconocido'}`);
          setIsSubmitting(false);
        }
      } catch (error) {
        console.error('StepOptionAvailabilityPrice: Error al consumir la API:', error);
        alert('Error inesperado al crear el horario. Por favor, inténtalo de nuevo.');
        setIsSubmitting(false);
      }
    }
  };

  const createAvailabilityPricing = async () => {
    if (!optionId || !activityId) return;

    setIsSubmitting(true);
    try {
      const apiRequest: CreateBookingOptionAvailabilityPricingRequest = {
        activityId: activityId,
        bookingOptionId: optionId,
        availabilityMode: formData.availabilityType === 'timeSlots' ? 'TIME_SLOTS' : 'OPENING_HOURS',
        pricingMode: formData.pricingType === 'perPerson' ? 'PER_PERSON' : 'PER_GROUP'
      };

      const response = await bookingOptionApi.createBookingOptionAvailabilityPricing(apiRequest);

      if (response && response.success) {
        // Navegar a la página de creación de horarios con los parámetros requeridos
        const currency = 'PEN'; // Por defecto, se puede obtener del contexto si está disponible
        navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing/create?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&currentSteps=9`, {
          activityId,
          lang,
          currency,
          currentStep
        });
      } else {
        alert(`Error al crear el horario: ${response?.message || 'Error desconocido'}`);
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('StepOptionAvailabilityPrice: Error al consumir la API:', error);
      alert('Error inesperado al crear el horario. Por favor, inténtalo de nuevo.');
      setIsSubmitting(false);
    }
  };

  const handleResetAvailabilityPricing = async () => {
    if (!optionId || !activityId) return;
    setIsResetting(true);
    try {
      const response = await bookingOptionApi.resetAvailabilityPricing(optionId);
      
      if (response && response.success && response.successCode === 'AVAILABILITY_PRICING_RESET') {
        // Cerrar modal y proceder con la creación
        setShowResetModal(false);
        await createAvailabilityPricing();
      } else {
        alert(`Error al resetear la disponibilidad: ${response?.message || 'Error desconocido'}`);
        setIsResetting(false);
      }
    } catch (error) {
      console.error('StepOptionAvailabilityPrice: Error al resetear disponibilidad:', error);
      alert('Error inesperado al resetear la disponibilidad. Por favor, inténtalo de nuevo.');
      setIsResetting(false);
    }
  };

  const handleCancelReset = () => {
    setShowResetModal(false);
    setIsSubmitting(false);
  };

  const handleContinue = () => {
    //Consume api/activities/createAddBookingOption
    // navega a la página de configuración de corte
    const currency = 'PEN'; // Por defecto, se puede obtener del contexto si está disponible
    navigateToActivityStep(navigate, `/extranet/activity/cutOff?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&currentStep=9`, {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  const handleDeleteAvailabilityPricing = async () => {
    if(!optionId || !activityId){return;}
    setIsResetting(true);
    try{
      const response = await bookingOptionApi.resetAvailabilityPricing(optionId);
      if(response && response.success && response.successCode === 'AVAILABILITY_PRICING_RESET'){
        //Refresca la pagina 
        window.location.reload();
      }else{
        alert(`Error al resetear la disponibilidad: ${response?.message || 'Error desconocido'}`);
        setIsResetting(false);
      }
    }
    catch(error){
      console.error('StepOptionAvailabilityPrice: Error al resetear la disponibilidad:', error);
      alert('Error inesperado al resetear la disponibilidad. Por favor, inténtalo de nuevo.');
      setIsResetting(false);
    }
  };

  const handleEditAvailabilityPricing = () => {
    console.log('StepOptionAvailabilityPrice: Editando horario');
    //redirecciona a la pagina de creacion de horarios con los parametros requeridos
    const currency = 'PEN'; // Por defecto, se puede obtener del contexto si está disponible
    navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing/create?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}&currentStep=9`, {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  const handleBack = () => {
    console.log('StepOptionAvailabilityPrice: Datos mantenidos en localStorage al regresar');
    navigateToActivityStep(navigate, '/extranet/activity/meetingPickup', {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  if (!optionId) {
    return (
      <OptionSetupLayout currentSection="availabilityPricing">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Cargando configuración de disponibilidad y precios...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  if (!activityId) {
    return (
      <OptionSetupLayout currentSection="availabilityPricing">
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
    <OptionSetupLayout currentSection="availabilityPricing">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Header con título */}
                <div className="d-flex align-items-center mb-4">
                  <h4 className="mb-0 me-2">
                    {getTranslation('stepAvailabilityPricing.title', language)}
                  </h4>
                  <i className="fas fa-info-circle text-primary"></i>
                  
                  {/* Indicador de estado de completitud */}
                  {!isCheckingCompletion && (
                    <div className="ms-auto">
                      {isAvailabilityPricingCompleted ? (
                        <span className="badge bg-success">
                          <i className="fas fa-check me-1"></i>
                          {language === 'es' ? 'Completo' : 'Complete'}
                        </span>
                      ) : (
                        <span className="badge bg-warning text-dark">
                          <i className="fas fa-clock me-1"></i>
                          {language === 'es' ? 'Pendiente' : 'Pending'}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Descripción introductoria */}
                <p className="text-muted mb-4">
                  {getTranslation('stepAvailabilityPricing.description', language)}
                </p>

                {/* Indicador de carga inicial */}
                {isCheckingCompletion && (
                  <div className="text-center mb-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Verificando estado...</span>
                    </div>
                    <p className="text-muted mt-2">
                      {language === 'es' 
                        ? 'Verificando estado de la configuración de disponibilidad y precios...'
                        : 'Checking availability and pricing configuration status...'
                      }
                    </p>
                  </div>
                )}

                {/* Sección 1: ¿Cómo estableces tu disponibilidad? */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-3">
                    {getTranslation('stepAvailabilityPricing.availability.title', language)}
                  </h5>
                  
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="availabilityType"
                      id="timeSlots"
                      value="timeSlots"
                      checked={formData.availabilityType === 'timeSlots'}
                      onChange={(e) => setFormData({...formData, availabilityType: e.target.value as 'timeSlots' | 'openingHours'})}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="timeSlots">
                      {getTranslation('stepAvailabilityPricing.availability.timeSlots', language)}
                    </label>
                    <div className="ms-4 mt-2">
                      <small className="text-muted">
                        {getTranslation('stepAvailabilityPricing.availability.timeSlots.example', language)}
                      </small>
                    </div>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="availabilityType"
                      id="openingHours"
                      value="openingHours"
                      checked={formData.availabilityType === 'openingHours'}
                      onChange={(e) => setFormData({...formData, availabilityType: e.target.value as 'timeSlots' | 'openingHours'})}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="openingHours">
                      {getTranslation('stepAvailabilityPricing.availability.openingHours', language)}
                    </label>
                    <div className="ms-4 mt-2">
                      <small className="text-muted">
                        {getTranslation('stepAvailabilityPricing.availability.openingHours.example', language)}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Sección 2: ¿Cómo se fijan los precios? */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-3">
                    {getTranslation('stepAvailabilityPricing.pricing.title', language)}
                  </h5>
                  
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="pricingType"
                      id="perPerson"
                      value="perPerson"
                      checked={formData.pricingType === 'perPerson'}
                      onChange={(e) => setFormData({...formData, pricingType: e.target.value as 'perPerson' | 'perGroup'})}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="perPerson">
                      {getTranslation('stepAvailabilityPricing.pricing.perPerson', language)}
                    </label>
                    <div className="ms-4 mt-2">
                      <small className="text-muted">
                        {getTranslation('stepAvailabilityPricing.pricing.perPerson.description', language)}
                      </small>
                    </div>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="pricingType"
                      id="perGroup"
                      value="perGroup"
                      checked={formData.pricingType === 'perGroup'}
                      onChange={(e) => setFormData({...formData, pricingType: e.target.value as 'perPerson' | 'perGroup'})}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="perGroup">
                      {getTranslation('stepAvailabilityPricing.pricing.perGroup', language)}
                    </label>
                    <div className="ms-4 mt-2">
                      <small className="text-muted">
                        {getTranslation('stepAvailabilityPricing.pricing.perGroup.description', language)}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Botón para añadir nuevo horario */}
                <div className="text-left mb-4">
                  <button 
                    type="button" 
                    className="btn btn-primary btn-lg px-4 py-2"
                    style={{ 
                      backgroundColor: '#007bff', 
                      borderColor: '#007bff',
                      color: 'white',
                      fontWeight: '500'
                    }}
                    onClick={handleAddSchedule}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-plus me-2"></i>
                    )}
                    {getTranslation('stepAvailabilityPricing.addSchedule', language)}
                  </button>
                </div>

                {/* Indicador de carga mientras se cargan los datos */}
                {isLoadingData && (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary mb-3" role="status">
                      <span className="visually-hidden">Cargando horarios...</span>
                    </div>
                    <p className="text-muted">Cargando horarios configurados...</p>
                  </div>
                )}

                {/* Debera mostrarse en un card con borde 1px solid black y padding 1rem y background color grey}
                {/* Mostrar horarios semanales existentes si schedules > 0 */}
                {!isLoadingData && bookingOptionData && bookingOptionData.schedules && bookingOptionData.schedules.length > 0 && (
                  <div className=" card border-0 mb-5" style={{ border: '1px solid black', padding: '1rem', backgroundColor: '#f7fafc' }}>
                    {/* Cabecera con título, información y botón Editar único */}
                    <div className="mb-4">
                      {/* Título y botón Editar */}
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="fw-bold mb-0" style={{ color: '#1a365d' }}>
                          {bookingOptionData.schedules[0]?.title.charAt(0).toUpperCase() + bookingOptionData.schedules[0]?.title.slice(1) || `cruceros`}
                        </h5>
                        <div className="dropdown">
                          <button 
                            className="btn btn-outline-primary btn-sm dropdown-toggle" 
                            type="button" 
                            data-bs-toggle="dropdown"
                            style={{
                              borderRadius: '6px',
                              padding: '4px 12px',
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              borderWidth: '1.5px'
                            }}
                          >
                            Editar
                          </button>
                          <ul className="dropdown-menu">
                            <li><button type="button" className="dropdown-item" onClick={handleEditAvailabilityPricing}>Editar</button></li>
                            <li><button type="button" className="dropdown-item" onClick={handleDeleteAvailabilityPricing}>Eliminar</button></li>
                          </ul>
                        </div>
                      </div>
                      
                      {/* Información básica en la cabecera */}
                      <div className="row">
                        <div className="col-md-4">
                          <div className="mb-2">
                            <span className="fw-bold" style={{ color: '#2d3748' }}>Rango de fechas:</span>
                            <span className="ms-2" style={{ color: '#4a5568' }}>
                              {(() => {
                                if (!bookingOptionData.schedules || bookingOptionData.schedules.length === 0) {
                                  return 'Sin fechas configuradas';
                                }

                                // Función para formatear fecha en Lima/Peru
                                const formatDateInLima = (dateString: string) => {
                                  const date = new Date(dateString);
                                  return date.toLocaleDateString('es-PE', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    timeZone: 'America/Lima'
                                  });
                                };

                                if (bookingOptionData.schedules.length === 1) {
                                  // Un solo schedule
                                  const schedule = bookingOptionData.schedules[0];
                                  const startDate = schedule.seasonStartDate ? formatDateInLima(schedule.seasonStartDate) : '27 jul 2025';
                                  const endDate = schedule.seasonEndDate ? formatDateInLima(schedule.seasonEndDate) : 'Sin fecha de fin';
                                  return `${startDate} - ${endDate}`;
                                } else {
                                  // Múltiples schedules - encontrar el rango completo
                                  const allStartDates = bookingOptionData.schedules
                                    .map((s: any) => s.seasonStartDate)
                                    .filter((date: any) => date)
                                    .map((date: any) => new Date(date!));
                                  
                                  const allEndDates = bookingOptionData.schedules
                                    .map((s: any) => s.seasonEndDate)
                                    .filter((date: any) => date)
                                    .map((date: any) => new Date(date!));

                                  if (allStartDates.length === 0) {
                                    return 'Sin fechas de inicio configuradas';
                                  }

                                  const earliestStart = new Date(Math.min(...allStartDates.map((d: Date) => d.getTime())));
                                  const latestEnd = allEndDates.length > 0 ? 
                                    new Date(Math.max(...allEndDates.map((d: Date) => d.getTime()))) : 
                                    null;

                                  const startFormatted = formatDateInLima(earliestStart.toISOString());
                                  const endFormatted = latestEnd ? formatDateInLima(latestEnd.toISOString()) : 'Sin fecha de fin';
                                  
                                  return `${startFormatted} - ${endFormatted}`;
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <span className="fw-bold" style={{ color: '#2d3748' }}>Participantes:</span>
                            <span className="ms-2" style={{ color: '#4a5568' }}>
                              {bookingOptionData.groupMinSize || 1} - {bookingOptionData.groupMaxSize || 'Ilimitado'}
                            </span>
                          </div>
                        </div>
                        <div className="col-md-4">
                          <div className="mb-2">
                            <span className="fw-bold" style={{ color: '#2d3748' }}>
                              {(() => {
                                if (bookingOptionData.pricingMode === 'PER_PERSON') {
                                  return 'Precio por persona:';
                                } else {
                                  return 'Precios por grupo:';
                                }
                              })()}
                                
                            </span>
                            <span className="ms-2" style={{ color: '#4a5568' }}>
                              {(() => {
                                if (bookingOptionData.pricingMode === 'PER_PERSON') {
                                   if (bookingOptionData.priceTiers && bookingOptionData.priceTiers.length > 1) {
                                      const minPrice = Math.min(...bookingOptionData.priceTiers.map((tier: any) => tier.pricePerParticipant));
                                      const minCurrency = bookingOptionData.priceTiers.find((tier: any) => tier.pricePerParticipant === minPrice)?.currency;
                                      const maxPrice = Math.max(...bookingOptionData.priceTiers.map((tier: any) => tier.pricePerParticipant));
                                      const maxCurrency = bookingOptionData.priceTiers.find((tier: any) => tier.pricePerParticipant === maxPrice)?.currency;
                                      return `${minPrice.toFixed(2)} ${minCurrency.toUpperCase()} - ${maxPrice.toFixed(2)} ${maxCurrency.toUpperCase()}`;
                                   } else if (bookingOptionData.priceTiers && bookingOptionData.priceTiers.length === 1) {
                                     const currency = bookingOptionData.priceTiers[0].currency;
                                     return `${bookingOptionData.priceTiers[0].pricePerParticipant.toFixed(2)} ${currency.toUpperCase()} `;
                                    } else {
                                      return 'No definido';
                                  }
                                } else {
                                  // Para otros modos de pricing (PER_GROUP, etc.)
                                  if (bookingOptionData.priceTiers && bookingOptionData.priceTiers.length > 0) {
                                    const minPrice = Math.min(...bookingOptionData.priceTiers.map((tier: any) => tier.totalPrice));
                                    const minCurrency = bookingOptionData.priceTiers.find((tier: any) => tier.totalPrice === minPrice)?.currency;
                                    const maxPrice = Math.max(...bookingOptionData.priceTiers.map((tier: any) => tier.totalPrice));
                                    const maxCurrency = bookingOptionData.priceTiers.find((tier: any) => tier.totalPrice === maxPrice)?.currency;
                                    return `${minPrice.toFixed(2)} ${minCurrency.toUpperCase()} - ${maxPrice.toFixed(2)} ${maxCurrency.toUpperCase()}`;
                                  } else {
                                    return 'No definido';
                                  }
                                }
                              })()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Días de la semana agrupados con horarios */}
                    <div className="mb-4">
                      <div className="mb-2">
                        <span className="fw-bold" style={{ color: '#2d3748' }}>Horario semanal:</span>
                      </div>
                      <div 
                        className="rounded p-3" 
                        style={{ 
                          backgroundColor: '#f7fafc',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div className="row">
                          {(() => {
                            // Agrupar todos los schedules por día de la semana usando la estructura real del objeto Schedule
                            const allSchedules = bookingOptionData.schedules || [];
                            const dayNames = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
                            const groupedSchedules: { [key: number]: any[] } = {};
                            
                            // Agrupar schedules por día de la semana (cada Schedule ya tiene dayOfWeek)
                            allSchedules.forEach((schedule: any) => {
                              if (schedule.dayOfWeek !== undefined && schedule.isActive) {
                                if (!groupedSchedules[schedule.dayOfWeek]) {
                                  groupedSchedules[schedule.dayOfWeek] = [];
                                }
                                groupedSchedules[schedule.dayOfWeek].push(schedule);
                              }
                            });
                            
                            // Renderizar días de la semana con sus horarios agrupados
                            return dayNames.map((dayName, dayIndex) => {
                              const daySchedules = groupedSchedules[dayIndex] || [];
                              
                                return (
                                  <div key={dayIndex} className="col-12 col-md-12 col-lg-12 mb-1">
                                    <div className="d-flex flex-row bd-highlight mb-1">
                                    <span 
                                      className="fw-semibold text-capitalize" 
                                      style={{ color: '#2d3748', fontSize: '0.9rem', minWidth: '100px' }}
                                    >
                                      {dayName}
                                    </span>
                                    <div className="d-flex align-items-center gap-1 m-2">
                                      {daySchedules.length > 0 ? (
                                        daySchedules.map((schedule: any, scheduleIndex: number) => (
                                          <span 
                                            key={schedule.id || scheduleIndex}
                                            className="badge" 
                                            style={{ 
                                              backgroundColor: '#3182ce',
                                              color: 'white',
                                              fontSize: '0.8rem',
                                              padding: '4px 8px',
                                              marginBottom: '2px'
                                            }}
                                            title={`${schedule.title || 'Horario'} - ${schedule.seasonStartDate ? new Date(schedule.seasonStartDate).toLocaleDateString('es-ES') : ''}${schedule.seasonEndDate ? ` al ${new Date(schedule.seasonEndDate).toLocaleDateString('es-ES')}` : ''}`}
                                          >
                                            {schedule.startTime || '08:00'}
                                            {schedule.endTime && ` - ${schedule.endTime}`}
                                          </span>
                                        ))
                                      ) : (
                                        <span 
                                          className="badge" 
                                          style={{ 
                                            backgroundColor: '#3182ce',
                                            color: 'white',
                                            fontSize: '0.8rem',
                                            padding: '4px 8px'
                                          }}
                                        >
                                          08:00
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Modal de confirmación para resetear disponibilidad */}
                {showResetModal && (
                  <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                      <div className="modal-content">
                        <div className="modal-header">
                          <h5 className="modal-title">
                            <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                            Confirmar eliminación de disponibilidad
                          </h5>
                          <button 
                            type="button" 
                            className="btn-close" 
                            onClick={handleCancelReset}
                            disabled={isResetting}
                          ></button>
                        </div>
                        <div className="modal-body">
                          <p className="mb-3">
                            Ya existen horarios configurados para esta opción de reserva. 
                            ¿Desea eliminar la disponibilidad y precios existentes para crear nuevos horarios?
                          </p>
                          <div className="alert alert-warning">
                            <i className="fas fa-info-circle me-2"></i>
                            <strong>Advertencia:</strong> Esta acción eliminará todos los horarios, precios y disponibilidad configurados anteriormente.
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button 
                            type="button" 
                            className="btn btn-secondary" 
                            onClick={handleCancelReset}
                            disabled={isResetting}
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-danger" 
                            onClick={handleResetAvailabilityPricing}
                            disabled={isResetting}
                          >
                            {isResetting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Eliminando...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-trash me-2"></i>
                                Sí, eliminar y continuar
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
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
                    {getTranslation('stepAvailabilityPricing.buttons.back', language)}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleContinue}
                    disabled={isCheckingCompletion || !isAvailabilityPricingCompleted}
                  >
                    {isCheckingCompletion ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-arrow-right me-2"></i>
                    )}
                    {getTranslation('stepAvailabilityPricing.buttons.continue', language)}
                  </button>
                </div>

                {/* Mensaje informativo sobre el estado del botón Continuar */}
                {!isCheckingCompletion && (
                  <div className="mt-3 text-center">
                    {isAvailabilityPricingCompleted ? (
                      <div className="text-success">
                        <i className="fas fa-check-circle me-2"></i>
                        <small>
                          {language === 'es' 
                            ? 'La configuración de disponibilidad y precios está completa. Puedes continuar al siguiente paso.'
                            : 'Availability and pricing configuration is complete. You can continue to the next step.'
                          }
                        </small>
                      </div>
                    ) : (
                      <div className="text-warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        <small>
                          {language === 'es' 
                            ? 'La configuración de disponibilidad y precios no está completa. Completa la configuración antes de continuar.'
                            : 'Availability and pricing configuration is not complete. Complete the configuration before continuing.'
                          }
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </OptionSetupLayout>
  );
}
