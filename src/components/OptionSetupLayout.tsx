import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useExtranetAuth } from '../hooks/useExtranetAuth';
import { getTranslation } from '../utils/translations';
import { activitiesApi } from '../api/activities';

const OptionSetupLayout: React.FC<{ 
  children: React.ReactNode;
  currentSection: string;
}> = ({ 
  children, 
  currentSection
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { language, setLanguage } = useLanguage();
  const { currency } = useCurrency();
  const { isAuthenticated, isInitialized, isValidating } = useExtranetAuth();
  
  // Obtener activityId y optionId de la URL
  const activityId = searchParams.get('activityId');
  const optionId = searchParams.get('optionId');
  
  // Estado para el título de la actividad
  const [activityTitle, setActivityTitle] = useState<string>('Nueva Actividad');
  const [isLoadingActivity, setIsLoadingActivity] = useState<boolean>(false);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as 'es' | 'en';
    setLanguage(newLanguage);
  };

  const handleBackToActivity = () => {
    navigate(`/extranet/activity/createOptions?activityId=${activityId}&lang=${language}&currency=${currency}&currentStep=9`);
  };

  // Función para obtener el título de la actividad
  const fetchActivityTitle = async (id: string, lang: string) => {
    if (!id) {
      console.warn('OptionSetupLayout: No hay activityId para cargar');
      setActivityTitle('Nueva Actividad');
      return;
    }
    
    setIsLoadingActivity(true);
    try {
      console.log('OptionSetupLayout: Cargando actividad con ID:', id, 'idioma:', lang);
      const activity = await activitiesApi.getById(id, lang);
      
      if (activity && activity.title) {
        setActivityTitle(activity.title);
        console.log('OptionSetupLayout: Título de actividad obtenido:', activity.title);
      } else {
        console.warn('OptionSetupLayout: Actividad sin título, datos recibidos:', activity);
        setActivityTitle('Actividad sin título');
      }
    } catch (error) {
      console.error('OptionSetupLayout: Error al obtener título de actividad:', error);
      setActivityTitle('Error al cargar actividad');
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Efecto para obtener el título de la actividad cuando cambie el activityId o el idioma
  useEffect(() => {
    if (activityId && isAuthenticated) {
      fetchActivityTitle(activityId, language);
    }
  }, [activityId, language, isAuthenticated]);

  // Solo redirigir si no está autenticado y no hay token válido
  React.useEffect(() => {
    if (isInitialized && !isValidating && !isAuthenticated) {
      // Verificar si hay un token en localStorage antes de redirigir
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        console.log('OptionSetupLayout: No hay token, redirigiendo a login');
        navigate('/extranet/login');
      } else {
        // Si hay token pero no está autenticado, intentar validar una vez más
        console.log('OptionSetupLayout: Hay token pero no autenticado, validando...');
        // No redirigir inmediatamente, dejar que useExtranetAuth maneje la validación
      }
    }
  }, [isAuthenticated, isInitialized, isValidating, navigate]);

  // Efecto adicional para manejar redirección solo cuando el token esté realmente expirado
  React.useEffect(() => {
    if (isInitialized && !isValidating && !isAuthenticated) {
      // Esperar un poco más antes de redirigir para dar tiempo a la validación
      const timeoutId = setTimeout(() => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken && !isAuthenticated) {
          console.log('OptionSetupLayout: Token expirado confirmado, redirigiendo a login');
          navigate('/extranet/login');
        }
      }, 2000); // Esperar 2 segundos antes de redirigir

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isInitialized, isValidating, navigate]);

  // Si está validando o no inicializado, mostrar loading
  if (isValidating || !isInitialized) {
    return (
      <div className="vh-100 bg-light d-flex justify-content-center align-items-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="text-muted">Validando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (se redirigirá)
  if (!isAuthenticated) {
    return null;
  }

  // Pasos para la configuración de opciones
  const optionSteps = [
    { 
      id: 'optionSetup', 
      title: getTranslation('optionSetup.menu.optionSettings', language), 
      path: `/extranet/activity/createOptionSetup?activityId=${activityId}&optionId=${optionId}&lang=${language}&currency=${currency}&currentStep=9`,
      completed: currentSection !== 'optionSettings' && currentSection !== '',
      icon: 'fas fa-cog'
    },
    { 
      id: 'meetingPickup', 
      title: getTranslation('optionSetup.menu.meetingPickup', language), 
      path: `/extranet/activity/createOptionMeetingPickup?activityId=${activityId}&optionId=${optionId}&lang=${language}&currency=${currency}&currentStep=9`,
      completed: ['meetingPickup', 'availabilityPricing', 'timeLimit'].includes(currentSection),
      icon: 'fas fa-map-marker-alt'
    },
    { 
      id: 'availabilityPricing', 
      title: getTranslation('optionSetup.menu.availabilityPricing', language), 
      path: `/extranet/activity/availabilityPricing?activityId=${activityId}&optionId=${optionId}&lang=${language}&currency=${currency}&currentStep=9`,
      completed: ['availabilityPricing', 'timeLimit'].includes(currentSection),
      icon: 'fas fa-calendar-alt'
    },
    { 
      id: 'timeLimit', 
      title: getTranslation('optionSetup.menu.timeLimit', language), 
      path: `/extranet/activity/cutOff?activityId=${activityId}&optionId=${optionId}&lang=${language}&currency=${currency}&currentStep=9`,
      completed: currentSection === 'timeLimit',
      icon: 'fas fa-clock'
    }
  ];

  const isCurrentStep = (stepId: string) => {
    return currentSection === stepId;
  };

  const handleStepClick = (path: string) => {
    navigate(path);
  };

  const getProgressPercentage = () => {
    // Encontrar el índice del paso actual
    const currentStepIndex = optionSteps.findIndex(step => step.id === currentSection);
    
    console.log('Debug Progress:', {
      currentSection,
      currentStepIndex,
      totalSteps: optionSteps.length,
      stepIds: optionSteps.map(s => s.id)
    });
    
    if (currentStepIndex === -1) {
      // Si no se encuentra el paso actual, mostrar 0%
      console.log('Paso actual no encontrado, progreso: 0%');
      return 0;
    }
    
    // Calcular progreso basado en la posición del paso actual
    // El primer paso (índice 0) = 25%, segundo paso = 50%, etc.
    const progressPerStep = 100 / optionSteps.length;
    const currentProgress = (currentStepIndex + 1) * progressPerStep;
    
    console.log('Progreso calculado:', {
      progressPerStep,
      currentProgress,
      finalProgress: Math.round(currentProgress)
    });
    
    return Math.round(currentProgress);
  };

  return (
    <div className="vh-100 bg-light d-flex flex-column">
      {/* Header superior con selector de idioma y barra de progreso */}
      <div className="position-fixed top-0 start-0 end-0 bg-white border-bottom shadow-sm" style={{ height: '80px', zIndex: 1000 }}>
        <div className="d-flex align-items-center justify-content-between h-100 px-4">
          <div className="flex-grow-1 d-flex align-items-center">
            {/* Progress Bar */}
            <div className="flex-grow-1 me-3">
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ 
                    width: `${Math.max(getProgressPercentage(), 5)}%`,
                    minWidth: '5px'
                  }}
                  aria-valuenow={getProgressPercentage()} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                ></div>
              </div>
              <small className="text-muted ms-2">{getProgressPercentage()}%</small>
            </div>
            
            {/* Language Selector */}
            <div className="flex-shrink-0" style={{ minWidth: '120px' }}>
              <select 
                value={language} 
                onChange={handleLanguageChange}
                className="form-select form-select-sm border-0 bg-transparent text-muted"
              >
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-grow-1" style={{ marginTop: '80px' }}>
        {/* Sidebar */}
        <div className="bg-dark text-white border-end d-flex flex-column overflow-auto sticky-top" style={{ width: '400px', minHeight: 'calc(100vh - 80px)', top: '80px' }}>
          <div className="p-4 flex-grow-1">
            {/* Botón Volver a la actividad */}
            <div className="mb-4">
              <button
                type="button"
                className="btn btn-outline-light w-100"
                onClick={handleBackToActivity}
              >
                <i className="fas fa-arrow-left me-2"></i>
                {getTranslation('optionSetup.backToProduct', language)}
              </button>
            </div>
            {/* Titulo de la actividad */}
            <div className="mb-4">
              <h6 className="fw-bold mb-2">
                {isLoadingActivity ? (
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm text-light me-2" role="status">
                      <span className="visually-hidden">Cargando...</span>
                    </div>
                    Cargando actividad...
                  </div>
                ) : (
                  activityTitle
                )}
              </h6>
            </div>
            <nav className="nav flex-column">
              {optionSteps.map((step, index) => (
                <div key={step.id} className="nav-item mb-2">
                  <div 
                    className={`nav-link p-2 rounded cursor-pointer ${isCurrentStep(step.id) ? 'bg-outline-primary text-white' : 'text-white'}`}
                    onClick={() => handleStepClick(step.path)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center">
                     
                      {isCurrentStep(step.id) ? (
                        <i className="fas fa-arrow-right text-white me-2" style={{ width: '16px' }}></i>
                      ) : step.completed ? (
                        <i 
                          className="fas fa-check-circle text-success me-2 step-completed-icon" 
                          style={{ 
                            fontSize: '1.2rem', 
                            opacity: '1', 
                            filter: 'drop-shadow(0 0 2px rgba(40, 167, 69, 0.5))',
                            color: '#28a745'
                          }}
                        ></i>
                      ) : ""}
                      <span className="small">{step.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 bg-light">
        <div className="p-4">
          {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptionSetupLayout; 