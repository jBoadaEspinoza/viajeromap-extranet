import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import OptionSetupLayout from '../../../components/OptionSetupLayout';
import { useAppSelector } from '../../../redux/store';
import { useActivityParams } from '../../../hooks/useActivityParams';
import { navigateToActivityStep } from '../../../utils/navigationUtils';
import { bookingOptionApi } from '../../../api/bookingOption';

interface CutOffData {
  defaultCutOffTime: string;
  enableLastMinuteBookings: boolean;
  differentCutOffTimes: boolean;
}

interface TimeSlotCutOff {
  id: string;
  departureTime: string;
  cutOffTime: string;
}

interface BookingOptionTimeSlot {
  id: string;
  name: string;
  date: string;
  timeSlots: TimeSlotCutOff[];
}

interface BookingOption {
  id: string;
  name: string;
  date: string;
  timeSlots: TimeSlotCutOff[];
}

interface ApiTimeSlot {
  id: string;
  departureTime: string;
  cutOffTime: string;
  isActive: boolean;
}

export default function StepOptionCutOff() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Obtener parámetros de URL
  const { activityId, lang, currency, currentStep } = useActivityParams();
  
  const [formData, setFormData] = useState<CutOffData>({
    defaultCutOffTime: '30',
    enableLastMinuteBookings: false,
    differentCutOffTimes: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInfoAlert, setShowInfoAlert] = useState(true);
  
  // Estado para las opciones de reserva y franjas horarias
  const [bookingOptionTimeSlots, setBookingOptionTimeSlots] = useState<BookingOption[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  const [timeSlotsError, setTimeSlotsError] = useState<string | null>(null);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const optionId = searchParams.get('optionId');
  const storageKey = `cutOff_${optionId || 'default'}`;

  // Cargar datos guardados al inicializar
  useEffect(() => {
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(prev => ({ ...prev, ...parsedData }));
      } catch (error) {
        console.error('StepOptionCutOff: Error al cargar datos desde localStorage:', error);
      }
    }
    // Marcar que los datos iniciales se han cargado (incluso si no hay datos guardados)
    setIsInitialDataLoaded(true);
  }, [storageKey]);

  // Estado para controlar si los datos iniciales ya se cargaron
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);

  // Cargar franjas horarias desde la API
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!optionId) return;
      
      setIsLoadingTimeSlots(true);
      setTimeSlotsError(null);
      setIsTokenExpired(false);
      
             try {
         const response = await bookingOptionApi.getListOfTimeSlots(optionId);
         
         // Log para debug: ver la estructura real de la respuesta
         console.log('StepOptionCutOff: Respuesta de API:', response);
         console.log('StepOptionCutOff: timeSlots:', response.data?.timeSlots);
         
         if (response.success && response.data?.timeSlots) {
           // Verificar si hay franjas horarias
           if (response.data.timeSlots.length === 0) {
             setBookingOptionTimeSlots([]);
             return;
           }
           
           // Convertir la respuesta de la API al formato local
           // Si timeSlots es un array simple de strings (horas), crear objetos con estructura
           const timeSlots = response.data.timeSlots.map((slot: any, index: number) => {
             console.log(`StepOptionCutOff: Procesando slot ${index}:`, slot, 'tipo:', typeof slot);
             
             // Si slot es un string (hora), crear objeto con estructura
             if (typeof slot === 'string') {
               return {
                 id: `slot_${index + 1}`,
                 departureTime: slot, // La hora directamente
                 cutOffTime: formData.defaultCutOffTime || '30'
               };
             }
             // Si slot es un objeto con propiedades, usar la estructura existente
             if (typeof slot === 'object' && slot !== null) {
               return {
                 id: slot.id || `slot_${index + 1}`,
                 departureTime: slot.departureTime || slot.toString(),
                 cutOffTime: formData.defaultCutOffTime || '30'
               };
             }
             // Fallback para cualquier otro tipo
             return {
               id: `slot_${index + 1}`,
               departureTime: String(slot),
               cutOffTime: formData.defaultCutOffTime || '30'
             };
           });
           
           console.log('StepOptionCutOff: timeSlots procesados:', timeSlots);
           
           // Crear una opción de reserva con las franjas horarias obtenidas
           const newBookingOptionTimeSlots: BookingOptionTimeSlot = {
             id: optionId,
             name:  response.data.title, // Nombre por defecto
             date: new Date(response.data.startDate).toLocaleDateString('es-ES', { 
               day: 'numeric', 
               month: 'short', 
               year: 'numeric' 
             }),
             timeSlots: timeSlots
           };
           
           setBookingOptionTimeSlots([newBookingOptionTimeSlots]);
         } else {
           setTimeSlotsError(response.message || 'Error al cargar las franjas horarias');
         }
      } catch (error: any) {
        // Distinguir entre errores de autenticación y otros errores
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          // Token expirado - marcar como expirado pero no redirigir
          console.log('StepOptionCutOff: Token expirado detectado');
          setIsTokenExpired(true);
          setTimeSlotsError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        } else {
          // Otros errores - mostrar mensaje de error
          const errorMessage = error instanceof Error ? error.message : 'Error inesperado al cargar las franjas horarias';
          setTimeSlotsError(errorMessage);
        }
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };

    // Solo ejecutar cuando tengamos tanto optionId como formData cargado, y los datos iniciales se hayan cargado
    if (optionId && formData.defaultCutOffTime && isInitialDataLoaded) {
      fetchTimeSlots();
    }
  }, [optionId, formData.defaultCutOffTime, isInitialDataLoaded]); // Ejecutar cuando cambie optionId, formData, o cuando se carguen los datos iniciales

  // Efecto separado para actualizar las horas límite cuando cambie la hora límite por defecto
  useEffect(() => {
    if (bookingOptionTimeSlots.length > 0) {
      setBookingOptionTimeSlots(prev => prev.map(option => ({
        ...option,
          timeSlots: option.timeSlots.map(slot => ({
          ...slot,
          cutOffTime: formData.defaultCutOffTime
        }))
      })));
    }
  }, [formData.defaultCutOffTime]);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, storageKey]);

  // Efecto para sincronizar las horas límite cuando se cambie la selección de horas límite diferentes
  useEffect(() => {
    if (!formData.differentCutOffTimes && bookingOptionTimeSlots.length > 0) {
      // Si se selecciona "No", resetear todas las franjas horarias a la hora límite por defecto
      setBookingOptionTimeSlots(prev => prev.map(option => ({
        ...option,
        timeSlots: option.timeSlots.map(slot => ({
          ...slot,
          cutOffTime: formData.defaultCutOffTime
        }))
      })));
    }
  }, [formData.differentCutOffTimes, formData.defaultCutOffTime, bookingOptionTimeSlots.length]);

  const handleSaveAndContinue = async () => {
    if (!optionId || !activityId) {
      alert('Error: Faltan datos requeridos para guardar la configuración.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Preparar datos para la API
      const cutOffTimesRequest = formData.differentCutOffTimes 
        ? bookingOptionTimeSlots.flatMap(option => 
            option.timeSlots.map(slot => ({
              timeSlot: slot.departureTime,
              cutOffMinutes: parseInt(slot.cutOffTime)
            }))
          )
        : [];

      const requestData = {
        activityId: activityId,
        bookingOptionId: optionId,
        defaultCutOffMinutes: parseInt(formData.defaultCutOffTime),
        isLastMinutesAfterFirst: formData.enableLastMinuteBookings,
        cutOffTimesRequest: cutOffTimesRequest
      };

      // Llamar a la API
      const response = await bookingOptionApi.createCutOffRequest(requestData);
      
      if (response.success) {
        // Guardar datos en localStorage
        const dataToSave = {
          ...formData,
          bookingOptionTimeSlots: formData.differentCutOffTimes ? bookingOptionTimeSlots : []
        };
        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        
        // Redirigir al siguiente paso
        navigateToActivityStep(navigate, `/extranet/activity/createOptions`, {
          activityId,
          lang,
          currency,
          currentStep
        });
      } else {
        alert(`Error al guardar la configuración: ${response.message}`);
      }
    } catch (error: any) {
      console.error('Error al guardar la configuración de hora límite:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Error inesperado al guardar la configuración. Por favor, inténtalo de nuevo.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, `/extranet/activity/availabilityPricing?activityId=${activityId}&optionId=${optionId}&lang=${lang}&currency=${currency}`, {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  // Función para cambiar la hora límite de una franja horaria específica
  const handleTimeSlotCutOffChange = (optionId: string, timeSlotId: string, cutOffTime: string) => {
    setBookingOptionTimeSlots(prev => prev.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          timeSlots: option.timeSlots.map(slot => {
            if (slot.id === timeSlotId) {
              return { ...slot, cutOffTime };
            }
            return slot;
          })
        };
      }
      return option;
    }));
  };

  // Función para aplicar la misma hora límite a todas las franjas horarias de una opción
  const handleApplyToAll = (optionId: string, cutOffTime: string) => {
    setBookingOptionTimeSlots(prev => prev.map(option => {
      if (option.id === optionId) {
        return {
          ...option,
          timeSlots: option.timeSlots.map(slot => ({
            ...slot,
            cutOffTime
          }))
        };
      }
      return option;
    }));
  };

  if (!optionId) {
    return (
      <OptionSetupLayout currentSection="timeLimit">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Cargando configuración de hora límite...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  // Mostrar loading mientras se cargan los datos iniciales
  if (!isInitialDataLoaded) {
    return (
      <OptionSetupLayout currentSection="timeLimit">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Inicializando configuración...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  if (!activityId) {
    return (
      <OptionSetupLayout currentSection="timeLimit">
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

  // Mostrar loading mientras se cargan las franjas horarias
  if (isLoadingTimeSlots) {
    return (
      <OptionSetupLayout currentSection="timeLimit">
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="text-muted">Cargando franjas horarias...</p>
              </div>
            </div>
          </div>
        </div>
      </OptionSetupLayout>
    );
  }

  return (
    <OptionSetupLayout currentSection="timeLimit">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Header con título */}
                <div className="d-flex align-items-center mb-4">
                  <h4 className="mb-0 me-2 fw-bold text-primary">
                    {getTranslation('stepCutOff.title', language)}
                  </h4>
                  <i className="fas fa-clock text-primary"></i>
                </div>

                {/* Descripción introductoria */}
                <p className="text-muted mb-4">
                  {getTranslation('stepCutOff.description', language)}{' '}
                  <a href="#" className="text-primary text-decoration-none">{getTranslation('stepCutOff.learnMore', language)}</a>
                </p>

                {/* Sección 1: Hora límite por defecto */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-3">
                    {getTranslation('stepCutOff.defaultCutOff.title', language)}
                  </h5>
                  
                  <div className="row">
                    <div className="col-md-6">
                      <select
                        className="form-select form-select-lg"
                        value={formData.defaultCutOffTime}
                        onChange={(e) => setFormData({...formData, defaultCutOffTime: e.target.value})}
                      >
                        <option value="0">0 minutos</option>
                        <option value="5">5 minutos</option>
                        <option value="10">10 minutos</option>
                        <option value="15">15 minutos</option>
                        <option value="20">20 minutos</option>
                        <option value="25">25 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="35">35 minutos</option>
                        <option value="40">40 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="50">50 minutos</option>
                        <option value="55">55 minutos</option>
                        <option value="60">60 minutos</option>
                        <option value="65">65 minutos</option>
                        <option value="70">70 minutos</option>
                        <option value="75">75 minutos</option>
                        <option value="80">80 minutos</option>
                        <option value="85">85 minutos</option>
                        <option value="90">90 minutos</option>
                        <option value="120">2 horas</option>
                        <option value="180">3 horas</option>
                        <option value="240">4 horas</option>
                        <option value="300">5 horas</option>
                        <option value="360">6 horas</option>
                        <option value="420">7 horas</option>
                        <option value="480">8 horas</option>
                        <option value="540">9 horas</option>
                        <option value="600">10 horas</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <small className="text-muted">
                      {getTranslation('stepCutOff.defaultCutOff.example', language)}
                    </small>
                  </div>
                </div>

                {/* Alerta informativa */}
                {showInfoAlert && (
                  <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
                    <i className="fas fa-info-circle me-2"></i>
                    {getTranslation('stepCutOff.infoAlert.message', language)}
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => setShowInfoAlert(false)}
                      aria-label="Close"
                    ></button>
                  </div>
                )}

                {/* Sección 2: Reservas de última hora */}
                <div className="mb-5">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="enableLastMinuteBookings"
                      checked={formData.enableLastMinuteBookings}
                      onChange={(e) => setFormData({...formData, enableLastMinuteBookings: e.target.checked})}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="enableLastMinuteBookings">
                      {getTranslation('stepCutOff.lastMinuteBookings.title', language)}
                    </label>
                  </div>
                  
                  <div className="ms-4 mt-2">
                    <small className="text-muted">
                      {getTranslation('stepCutOff.lastMinuteBookings.description', language)}
                    </small>
                  </div>
                </div>

                {/* Sección 3: Horas límite diferentes para franjas horarias */}
                <div className="mb-5">
                  <h5 className="fw-bold mb-3">
                    {getTranslation('stepCutOff.differentCutOff.title', language)}
                  </h5>
                  
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="differentCutOffTimes"
                      id="noDifferentCutOff"
                      value="false"
                      checked={!formData.differentCutOffTimes}
                      onChange={() => setFormData({...formData, differentCutOffTimes: false})}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="noDifferentCutOff">
                      {getTranslation('stepCutOff.differentCutOff.no', language)}
                    </label>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="differentCutOffTimes"
                      id="yesDifferentCutOff"
                      value="true"
                      checked={formData.differentCutOffTimes}
                      onChange={() => setFormData({...formData, differentCutOffTimes: true})}
                    />
                    <label className="form-check-label fw-semibold" htmlFor="yesDifferentCutOff">
                      {getTranslation('stepCutOff.differentCutOff.yes', language)}
                    </label>
                  </div>
                  
                  <div className="ms-4 mt-2">
                    <small className="text-muted">
                      {getTranslation('stepCutOff.differentCutOff.description', language)}
                    </small>
                  </div>
                </div>

                {/* Sección 4: Configuración específica por franja horaria */}
                {formData.differentCutOffTimes && (
                  <div className="mb-5">
                    <h5 className="fw-bold mb-4">
                      {getTranslation('stepCutOff.timeSlots.title', language)}
                    </h5>
                    
                                         {/* Mostrar error si hay problema cargando las franjas horarias */}
                     {timeSlotsError && (
                       <div className="alert alert-danger mb-4">
                         <i className="fas fa-exclamation-triangle me-2"></i>
                         <strong>Error:</strong> {timeSlotsError}
                         {isTokenExpired ? (
                           <button 
                             type="button" 
                             className="btn btn-outline-danger btn-sm ms-3"
                             onClick={() => navigate('/extranet/login')}
                           >
                             <i className="fas fa-sign-in-alt me-1"></i>
                             Ir al Login
                           </button>
                         ) : (
                           <button 
                             type="button" 
                             className="btn btn-outline-danger btn-sm ms-3"
                             onClick={() => window.location.reload()}
                           >
                             <i className="fas fa-redo me-1"></i>
                             Reintentar
                           </button>
                         )}
                       </div>
                     )}
                    
                    {/* Mostrar mensaje si no hay franjas horarias */}
                    {!timeSlotsError && bookingOptionTimeSlots.length === 0 && (
                      <div className="alert alert-info mb-4">
                        <i className="fas fa-info-circle me-2"></i>
                        No se encontraron franjas horarias para esta opción de reserva.
                      </div>
                    )}
                    
                    {bookingOptionTimeSlots.map((option) => (
                      <div key={option.id} className="card border mb-4">
                        <div className="card-body p-4">
                          {/* Header de la opción de reserva */}
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fw-bold mb-0">
                              {option.name} - {option.date}
                            </h6>
                            <i className="fas fa-chevron-down text-muted"></i>
                          </div>
                          
                          {/* Franjas horarias */}
                          <div className="row">
                            {option.timeSlots.map((timeSlot, index) => (
                              <div key={timeSlot.id} className="mb-3">
                                <div className="d-flex align-items-start">
                                   <div className="me-3">
                                     <span className="fw-semibold">{timeSlot.departureTime}</span>
                                   </div>
                                  
                                  <div className="col-4 me-3">
                                    <select
                                      className="form-select"
                                      value={timeSlot.cutOffTime}
                                      onChange={(e) => handleTimeSlotCutOffChange(option.id, timeSlot.id, e.target.value)}
                                    >
                                      <option value="0">0 minutos</option>
                                      <option value="5">5 minutos</option>
                                      <option value="10">10 minutos</option>
                                      <option value="15">15 minutos</option>
                                      <option value="20">20 minutos</option>
                                      <option value="25">25 minutos</option>
                                      <option value="30">30 minutos</option>
                                      <option value="35">35 minutos</option>
                                      <option value="40">40 minutos</option>
                                      <option value="45">45 minutos</option>
                                      <option value="50">50 minutos</option>
                                      <option value="55">55 minutos</option>
                                      <option value="60">60 minutos</option>
                                      <option value="65">65 minutos</option>
                                      <option value="70">70 minutos</option>
                                      <option value="75">75 minutos</option>
                                      <option value="80">80 minutos</option>
                                      <option value="85">85 minutos</option>
                                      <option value="90">90 minutos</option>
                                      <option value="120">2 horas</option>
                                      <option value="180">3 horas</option>
                                      <option value="240">4 horas</option>
                                      <option value="300">5 horas</option>
                                      <option value="360">6 horas</option>
                                      <option value="420">7 horas</option>
                                      <option value="480">8 horas</option>
                                      <option value="540">9 horas</option>
                                      <option value="600">10 horas</option>
                                    </select>
                                  </div>
                                  
                                  {/* Botón "Aplicar a todas" solo para la primera franja */}
                                  {index === 0 && (
                                    <div className="flex-shrink-0">
                                      <button
                                        type="button"
                                        className="btn btn-link text-primary p-0 text-decoration-none"
                                        onClick={() => handleApplyToAll(option.id, timeSlot.cutOffTime)}
                                      >
                                        <i className="fas fa-square me-1"></i>
                                        {getTranslation('stepCutOff.timeSlots.applyToAll', language)}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
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
                    {getTranslation('stepCutOff.buttons.back', language)}
                  </button>
                  
                  <button 
                    type="button" 
                    className="btn btn-primary btn-lg px-4"
                    onClick={handleSaveAndContinue}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="fas fa-save me-2"></i>
                    )}
                    {getTranslation('stepCutOff.buttons.saveAndContinue', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OptionSetupLayout>
  );
}
