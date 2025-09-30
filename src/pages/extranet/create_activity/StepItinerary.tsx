import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { getTranslation, getTranslationWithParams } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import ItinerarySchedule from '@/components/ItinerarySchedule';
import { useAppDispatch, useAppSelector } from '@/redux/store';
import { addItineraryDay, updateItineraryDay, removeItineraryDay, addItineraryItem } from '@/redux/activityCreationSlice';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';
import { activitiesApi } from '@/api/activities';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';

const StepItinerary: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { company } = useAuth();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const { activityId, lang, currency, currentStep } = useActivityParams();
  const { selectedCategory, itinerary } = useAppSelector((state: any) => state.activityCreation);
  const [activity, setActivity] = useState<any>(null);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [itineraryData, setItineraryData] = useState<any>(null);
  const [hideButtonCreateItinerary, setHideButtonCreateItinerary] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [showItineraryTypeSelection, setShowItineraryTypeSelection] = useState(false);
  const [selectedItineraryType, setSelectedItineraryType] = useState<'activity' | 'transfer' | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // No need to set current step in Redux anymore, it comes from URL

  useEffect(() => {
    if (!activityId) {
      navigate('/extranet/activity/createCategory');
    }
  }, [activityId, navigate]);

  // Fetch activity data to check if it's active
  useEffect(() => {
    if (activityId) {
      const fetchActivity = async () => {
        try {
          setIsLoadingActivity(true);
          const activityData = await activitiesApi.getById(activityId, language, currency,company?.ruc?.toString());
          setActivity(activityData);
        } catch (error) {
          console.error('Error fetching activity:', error);
        } finally {
          setIsLoadingActivity(false);
        }
      };
      
      fetchActivity();
    }
  }, [activityId, language, currency]);

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createOptions', {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  const handleContinue = () => {
    navigateToActivityStep(navigate, '/extranet/activity/review', {
      activityId,
      lang,
      currency,
      currentStep
    });
  };

  const handleSkipItinerary = async () => {
    if (!activityId) {
      console.error('No activityId available for skipping itinerary');
      return;
    }

    await withLoading(async () => {
      try {
        const response = await activitiesApi.skipItinerary({
          activityId,
          lang
        });

        if(response.success){
          // Mostrar mensaje de éxito en modal
          // El mensaje enviado cuando success = true es 'Actividad creada exitosamente'
          setSuccessMessage(response.message || 'Actividad creada exitosamente');
          setShowSuccessModal(true);
        } else {
          // Debe mostrar el error en el modal
          setSuccessMessage(response.message || 'Error al saltar el itinerario');
          setShowSuccessModal(true);
        }
      } catch (error) {
        console.error('Error calling skipItinerary API:', error);
        // En caso de error, navegar al paso de revisión por defecto
        navigateToActivityStep(navigate, '/extranet/activity/review', {
          activityId,
          lang,
          currency,
          currentStep
        });
      }
    }, 'skip-itinerary');
  };

  const handleCreateItinerary = () => {
    // Configurar datos del itinerario con solo Start y End (sin items)
    const newItineraryData = {
      title: 'Crear tu itinerario',
      start: {
        id: 'start',
        type: 'start' as const,
        title: 'Lugar de salida:',
        description: 'Marina Turistica de Paracas'
      },
      end: {
        id: 'end',
        type: 'end' as const,
        title: 'Regresa a:',
        description: 'Marina Turistica de Paracas'
      },
      items: [] // Array vacío para que aparezca automáticamente el flujo de selección
    };
    
    setItineraryData(newItineraryData);
    setHideButtonCreateItinerary(true);
    setIsEditable(true);
  };

  const handleItineraryTypeSelection = (type: 'activity' | 'transfer') => {
    setSelectedItineraryType(type);
  };

  const handleAddItem = (item: { id: string; title: string; description: string; time: string; type: string }) => {
    if (itineraryData) {
      const updatedItineraryData = {
        ...itineraryData,
        items: [...itineraryData.items, item]
      };
      setItineraryData(updatedItineraryData);
    }
  };

  const handleBackToTypeSelection = () => {
    setShowItineraryTypeSelection(true);
    setSelectedItineraryType(null);
    setItineraryData(null);
    setIsEditable(false);
  };

  const handleSuccessModalAccept = () => {
    setShowSuccessModal(false);
    // Navegar al listado de actividades
    navigate(`/extranet/list-activities?lang=${lang}&currency=${currency}`);
  };
  
  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="container-fluid">
        {/* Contenido principal */}
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                {/* Título y descripción */}
                <div className="d-flex align-items-center mb-4">
                  <h5 className="mb-0 me-3">
                    {getTranslation('stepItinerary.title', language)}
                  </h5>
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '24px', height: '24px' }}>
                    <i className="fas fa-question" style={{ fontSize: '12px' }}></i>
                  </div>
                </div>

                <p className="text-muted mb-4">
                  {getTranslation('stepItinerary.description', language)}
                </p>


                {/* Contenido principal con ItinerarySchedule y botón */}
                <div className="row">
                  {/* Left side - ItinerarySchedule */}
                  <div className="col-md-8">
                    <ItinerarySchedule 
                      editable={isEditable} 
                      data={itineraryData}
                    />
                  </div>
                    
                    {/* Right side - Action Button */}
                  <div className="col-md-4">
                      <div className="h-100 d-flex flex-column justify-content-center">
                      <div className="d-flex justify-content-center">
                        {/* Botón condicional basado en si hay booking options y si se ha seleccionado un tipo */}
                        {(!activity?.bookingOptions || activity.bookingOptions.length === 0) ? (
                          /* Si hideButtonCreateItinerary es true, no mostrar el botón de crear itinerario */
                          !hideButtonCreateItinerary && (
                            <button
                              type="button"
                              className="btn btn-primary btn-lg"
                              onClick={handleCreateItinerary}
                              disabled={isLoadingActivity}
                            >
                              {getTranslation('stepItinerary.createItinerary', language)}
                            </button>
                          )
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-lg"
                            onClick={selectedItineraryType ? handleBackToTypeSelection : handleCreateItinerary}
                            disabled={isLoadingActivity}
                          >
                            {selectedItineraryType 
                              ? getTranslation('stepItinerary.continueCreatingItinerary', language)
                              : getTranslation('stepItinerary.createItinerary', language)
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="row mt-4">
          <div className="col-12 d-flex justify-content-end">
            {/* Si hideButtonCreateItinerary es true, no mostrar los botones de navegación */}
            {!hideButtonCreateItinerary && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBack}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  {getTranslation('common.back', language)}
                </button> 
                <button
                  type="button"
                  className="btn btn-secondary ms-2"
                  onClick={handleSkipItinerary}
                >
                  {getTranslation('stepItinerary.skip', language)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary ms-2"
                  onClick={handleContinue}
                  disabled={!activity?.isActive || activity.bookingOptions.length === 0 || hideButtonCreateItinerary}
                >
                  {getTranslation('stepItinerary.publish', language)}
                  <i className="fas fa-arrow-right ms-2"></i>
                </button>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Modal de Éxito */}
        {showSuccessModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title text-success">
                    <i className="fas fa-check-circle me-2"></i>
                    {getTranslation('common.success', language)}
                  </h5>
                </div>
                <div className="modal-body pt-0">
                  <p className="mb-0">{successMessage}</p>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleSuccessModalAccept}
                  >
                    <i className="fas fa-check me-2"></i>
                    {getTranslation('common.accept', language)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

    </ActivityCreationLayout>
  );
};

export default StepItinerary;
