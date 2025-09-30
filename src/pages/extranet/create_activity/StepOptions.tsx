import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getTranslation } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';
import CreateOptionModal from '@/components/CreateOptionModal';
import { bookingOptionApi } from '@/api/bookingOption';
import { activitiesApi } from '@/api/activities';
import { useCurrency } from '@/context/CurrencyContext';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';

interface BookingOption {
  id: string;
  title: string;
  duration?: string;
  groupSize?: string;
  language?: string;
  inclusions?: string[];
  startType?: string;
  price?: number;
  isActive: boolean;
}

const StepOptions: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const { activityId, lang, currency: urlCurrency, currentStep } = useActivityParams();
  const hasRedirected = useRef(false);
  const [options, setOptions] = useState<BookingOption[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newOption, setNewOption] = useState<Partial<BookingOption>>({
    title: '',
    duration: '',
    groupSize: '',
    language: '',
    inclusions: [],
    startType: '',
    price: 0,
    isActive: true
  });

  // No need to set current step in Redux anymore, it comes from URL

  useEffect(() => {
    // Verificar que tenemos activityId antes de continuar
    if (!activityId && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/extranet/login');
    } else if (activityId) {
      hasRedirected.current = false;
    }
  }, [activityId, navigate]);

  useEffect(() => {
    if (activityId) {
      const fetchBookingOptions = async () => {
        try {
          setIsLoading(true);
          const response = await bookingOptionApi.searchBookingOptions(activityId, language, currency);
          if(response.success && response.data){
            setOptions(response.data);
          }
        } catch (error) {
          console.error('Error fetching booking options:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchBookingOptions();
    }
  }, [activityId, language, currency]);

  const handleCreateOption = async () => {
    if (newOption.title?.trim()) {
      const option: BookingOption = {
        id: Date.now().toString(),
        title: newOption.title!,
        duration: newOption.duration,
        groupSize: newOption.groupSize,
        language: newOption.language,
        inclusions: newOption.inclusions || [],
        startType: newOption.startType,
        price: newOption.price || 0,
        isActive: true
      };
      
      setOptions([...options, option]);
      setNewOption({
        title: '',
        duration: '',
        groupSize: '',
        language: '',
        inclusions: [],
        startType: '',
        price: 0,
        isActive: true
      });
      setShowCreateForm(false);
    }
  };

  const handleModalCreateOption = async (useTemplate: boolean, templateOption?: string) => {
    if (useTemplate && templateOption) {
      // Usar plantilla existente
      const template = options.find(opt => opt.id === templateOption);
      if (template) {
        setNewOption({
          title: template.title,
          duration: template.duration,
          groupSize: template.groupSize,
          language: template.language,
          inclusions: template.inclusions,
          startType: template.startType,
          price: template.price,
          isActive: true
        });
        setShowCreateForm(true);
      }
    } else {
      // Crear nueva opción desde cero usando la API
      try {
        setIsCreating(true);
        
        if (!activityId) {
          console.error('No se encontró activityId');
          return;
        }

        const response = await bookingOptionApi.create({
          activityId: activityId
        });

        if (response.success && response.idCreated) {
          // Navegar a StepOptionSetup con el optionId en la URL
          navigateToActivityStep(navigate, `/extranet/activity/createOptionSetup?activityId=${activityId}&optionId=${response.idCreated}&lang=${lang}&currency=${urlCurrency}&currentStep=${currentStep}`, {
            activityId,
            lang,
            currency: urlCurrency,
            currentStep:9
          });
        } else {
          console.error('Error al crear la opción:', response.message);
          // Aquí podrías mostrar un mensaje de error al usuario
        }
      } catch (error) {
        console.error('Error al crear la opción de reserva:', error);
        // Aquí podrías mostrar un mensaje de error al usuario
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleDeleteOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const handleEditOption = (id: string) => {
     // Redirigir a la pagina StepOptionSetup con el optionId en la URL
     navigateToActivityStep(navigate, `/extranet/activity/createOptionSetup?activityId=${activityId}&optionId=${id}&lang=${lang}&currency=${urlCurrency}&currentStep=${currentStep}`, {
      activityId,
      lang,
      currency: urlCurrency,
      currentStep: 9
    });
  };

  const handleContinue = async () => {
    const activeOptions = options.filter(option => option.isActive);
    if (activeOptions.length === 0) {
      alert('No hay opciones activas para procesar');
      return;
    }
    
    // Si hay opciones activas, procesar cada una
    if (!activityId) {
      console.error('No se encontró activityId');
      return;
    }
    await withLoading(async () => {
      try {
        for (const option of activeOptions) {
          const response = await activitiesApi.createAddBookingOption({
            id: activityId,
            optionId: option.id
          });
          if (!response || !response.success) {
            console.error('Error al agregar opción de reserva:', response?.message);
          }
        }
        
        navigateToActivityStep(navigate, '/extranet/activity/createItinerary', {
          activityId,
          lang,
          currency: urlCurrency,
          currentStep: 10
        });
      } catch (error) {
        console.error('Error al procesar opciones de reserva:', error);
      }
    }, 'process-booking-options');
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createImages', {
      activityId,
      lang,
      currency: urlCurrency,
      currentStep
    });
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
                    {getTranslation('stepOptions.title', language)}
                  </h5>
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
                       style={{ width: '24px', height: '24px' }}>
                    <i className="fas fa-question" style={{ fontSize: '12px' }}></i>
                  </div>
                </div>

                <p className="text-muted mb-4">
                  {getTranslation('stepOptions.description', language)}
                </p>

                {/* Ejemplos de opciones */}
                <div className="mb-4">
                  <p className="text-muted mb-3">
                    {getTranslation('stepOptions.examples.intro', language)}
                  </p>
                  <ul className="text-muted">
                    <li>{getTranslation('stepOptions.examples.duration', language)}</li>
                    <li>{getTranslation('stepOptions.examples.groupSize', language)}</li>
                    <li>{getTranslation('stepOptions.examples.language', language)}</li>
                    <li>{getTranslation('stepOptions.examples.inclusions', language)}</li>
                    <li>{getTranslation('stepOptions.examples.startType', language)}</li>
                  </ul>
                </div>

                <p className="text-muted mb-4">
                  {getTranslation('stepOptions.explanation', language)}
                </p>

                {/* Botón crear nueva opción */}
                <div className="mb-4">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setShowCreateModal(true)}
                    disabled={options.some(option => option.isActive)}
                    title={options.some(option => option.isActive) ? 
                      getTranslation('stepOptions.button.disabledTitle', language) : 
                      getTranslation('stepOptions.button.enabledTitle', language)
                    }
                  >
                    <i className="fas fa-plus me-2"></i>
                    {getTranslation('stepOptions.createNewOption', language)}
                  </button>
                  {options.some(option => option.isActive) && (
                    <div className="form-text text-warning mt-1">
                      <i className="fas fa-info-circle me-1"></i>
                      {getTranslation('stepOptions.warning.activeOption', language)}
                    </div>
                  )}
                </div>

                {/* Formulario para crear opción */}
                {showCreateForm && (
                  <div className="card border mb-4">
                    <div className="card-body">
                      <h6 className="card-title mb-3">
                        {getTranslation('stepOptions.createForm.title', language)}
                      </h6>
                      
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            {getTranslation('stepOptions.createForm.titleLabel', language)}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newOption.title}
                            onChange={(e) => setNewOption({...newOption, title: e.target.value})}
                            placeholder={getTranslation('stepOptions.createForm.titlePlaceholder', language)}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            {getTranslation('stepOptions.createForm.durationLabel', language)}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newOption.duration}
                            onChange={(e) => setNewOption({...newOption, duration: e.target.value})}
                            placeholder={getTranslation('stepOptions.createForm.durationPlaceholder', language)}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            {getTranslation('stepOptions.createForm.groupSizeLabel', language)}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newOption.groupSize}
                            onChange={(e) => setNewOption({...newOption, groupSize: e.target.value})}
                            placeholder={getTranslation('stepOptions.createForm.groupSizePlaceholder', language)}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            {getTranslation('stepOptions.createForm.languageLabel', language)}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newOption.language}
                            onChange={(e) => setNewOption({...newOption, language: e.target.value})}
                            placeholder={getTranslation('stepOptions.createForm.languagePlaceholder', language)}
                          />
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            {getTranslation('stepOptions.createForm.startTypeLabel', language)}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={newOption.startType}
                            onChange={(e) => setNewOption({...newOption, startType: e.target.value})}
                            placeholder={getTranslation('stepOptions.createForm.startTypePlaceholder', language)}
                          />
                        </div>
                        
                        <div className="col-md-6 mb-3">
                          <label className="form-label">
                            {getTranslation('stepOptions.createForm.priceLabel', language)}
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            value={newOption.price}
                            onChange={(e) => setNewOption({...newOption, price: parseFloat(e.target.value) || 0})}
                            placeholder={getTranslation('stepOptions.createForm.pricePlaceholder', language)}
                          />
                        </div>
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleCreateOption}
                        >
                          {getTranslation('stepOptions.createForm.create', language)}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setShowCreateForm(false)}
                        >
                          {getTranslation('stepOptions.createForm.cancel', language)}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de opciones existentes */}
                {options.length > 0 && (
                  <div className="mb-4">
                    <h6 className="mb-3">
                      {getTranslation('stepOptions.existingOptions', language)} ({options.length})
                    </h6>
                    
                    {options.map((option) => (
                      <div key={option.id} className="card border mb-3">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <h6 className="mb-2">{option.title}</h6>
                              <div className="row text-muted small">
                                {option.duration && (
                                  <div className="col-md-3">
                                    <i className="fas fa-clock me-1"></i>
                                    {option.duration}
                                  </div>
                                )}
                                {option.groupSize && (
                                  <div className="col-md-3">
                                    <i className="fas fa-users me-1"></i>
                                    {option.groupSize}
                                  </div>
                                )}
                                {option.language && (
                                  <div className="col-md-3">
                                    <i className="fas fa-language me-1"></i>
                                    {option.language}
                                  </div>
                                )}
                                {option.startType && (
                                  <div className="col-md-3">
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    {option.startType}
                                  </div>
                                )}
                              </div>
                              {option.price && option.price > 0 && (
                                <div className="mt-2">
                                  <span className="badge bg-success">
                                    ${option.price}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className={`btn btn-sm btn-success`}
                                onClick={() => handleEditOption(option.id)}
                                title={getTranslation('stepOptions.actions.edit', language)}
                              >
                                <i className="fas fa-pencil"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteOption(option.id)}
                                title={getTranslation('stepOptions.actions.delete', language)}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mensaje si no hay opciones */}
                {options.length === 0 && (
                  <div className="text-center py-4">
                    <i className="fas fa-list-ul fa-3x text-muted mb-3"></i>
                    <p className="text-muted">
                      {getTranslation('stepOptions.noOptions', language)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="row mt-4">
          <div className="col-12 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleBack}
            >
              <i className="fas fa-arrow-left me-2"></i>
              {getTranslation('common.back', language)}
            </button>
            {/* Botón continuar habilitado solo si hay opciones activas */}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleContinue}
              disabled={isLoading || options.filter(option => option.isActive).length === 0}
            >
              {getTranslation('common.continue', language)}
              <i className="fas fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Modal para crear nueva opción */}
      <CreateOptionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateOption={handleModalCreateOption}
        existingOptions={options}
        isCreating={isCreating}
      />
    </ActivityCreationLayout>
  );
};

export default StepOptions;
