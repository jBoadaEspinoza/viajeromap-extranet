import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getTranslation } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { activitiesApi } from '@/api/activities';
import { useAuth } from '@/context/AuthContext';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';

interface StepTitleProps {
  activityId?: string;
}

const StepTitle: React.FC<StepTitleProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const { company } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [activityData, setActivityData] = useState<any>(null);
  const hasRedirected = useRef(false);
  const { activityId, lang, currency } = useActivityParams();
  
  // Usar activityId de URL
  const currentActivityId = activityId;

  // Cargar datos existentes de la actividad
  useEffect(() => {
    const loadActivityData = async () => {
      if (!currentActivityId) return;
      await withLoading(async () => {
        try {
          const activityData = await activitiesApi.getById(currentActivityId, language, currency.toUpperCase(),company?.ruc?.toString());
          console.log('activityData', activityData);
          setActivityData(activityData);
          // Siempre cargar el título si existe, incluso si está vacío
          if (activityData) {
            setTitle(activityData.title || '');
          }
        } catch (error) {
          console.error('Error loading activity data:', error);
          // No mostrar error al usuario, solo log para debugging
        }
      }, 'load-activity-data');
    };

    loadActivityData();
  }, [currentActivityId, language, currency]);

  // Validar el límite de caracteres del título
  useEffect(() => {
    if (title.length > 80) {
      // Solo mostrar error cuando excede el límite
      const errorMessage = getTranslation('stepTitle.error.titleTooLong', language);
      setTitleError(errorMessage);
    } else {
      // Limpiar error cuando está dentro del límite
      setTitleError(null);
    }
  }, [title, language]);

  // Función para manejar cambios en el título
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Si el nuevo valor excede 80 caracteres, truncar y mostrar error
    if (newValue.length > 80) {
      const truncatedValue = newValue.substring(0, 80);
      setTitle(truncatedValue);
      const errorMessage = getTranslation('stepTitle.error.titleTooLong', language);
      setTitleError(errorMessage);
    } else {
      // Si está dentro del límite, actualizar normalmente
      setTitle(newValue);
      setTitleError(null);
    }
  };

  useEffect(() => {
    // Solo redirigir si no hay activityId y no se ha redirigido antes
    if (!currentActivityId && !hasRedirected.current) {
      hasRedirected.current = true;
      navigateToActivityStep(navigate, '/extranet/activity/createCategory', {
        activityId,
        lang,
        currency,
        currentStep: 1
      });
    } else if (currentActivityId) {
      // Resetear el flag de redirección si encontramos un activityId
      hasRedirected.current = false;
    }
  }, [currentActivityId, navigate, lang, currency]);

  const handleSaveAndExit = async () => {
    if (!title.trim()) {
      setError(getTranslation('stepTitle.error.titleRequired', language));
      return;
    }

    if (title.length > 80) {
      setError(getTranslation('stepTitle.error.titleTooLong', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createTitle API before navigating
        const response = await activitiesApi.createTitle({
          id: currentActivityId!,
          title: title.trim(),
          lang: language
        });

        if (response.success) {
          // Navigate to dashboard after successful save
          navigate('/extranet/dashboard');
        } else {
          setError(response.message || getTranslation('stepTitle.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepTitle.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleContinue = async () => {
    if (!title.trim()) {
      setError(getTranslation('stepTitle.error.titleRequired', language));
      return;
    }

    if (title.length > 80) {
      setError(getTranslation('stepTitle.error.titleTooLong', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createTitle API before navigating
        const response = await activitiesApi.createTitle({
          id: currentActivityId!,
          title: title.trim(),
          lang: language
        });

        if (response.success) {
          navigateToActivityStep(navigate, '/extranet/activity/createDescription', {
            activityId,
            lang,
            currency,
            currentStep: 3
          });
        } else {
          setError(response.message || getTranslation('stepTitle.error.saveFailed', language));
        }
      } catch (error) {
        console.error('Error saving title:', error);
        setError(getTranslation('stepTitle.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5">
            <h1 className="h3 fw-bold text-primary mb-3">
              {getTranslation('stepTitle.title', language)}
            </h1>
            <p className="text-muted">
              {getTranslation('stepTitle.description', language)}
            </p>
          </div>

          {/* Formulario */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {/* Título del producto */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    {getTranslation('stepTitle.activityTitle.label', language)}
                  </h6>
                  <i className="fas fa-question-circle text-primary ms-2"></i>
                </div>
                <p className="text-muted small mb-3">
                  {getTranslation('stepTitle.activityTitle.instructions', language)}
                </p>
                <div className="position-relative">
                  <input
                    type="text"
                    className={`form-control ${titleError ? 'is-invalid' : ''}`}
                    value={title}
                    onChange={handleTitleChange}
                    placeholder={getTranslation('stepTitle.activityTitle.placeholder', language)}
                    maxLength={80}
                  />
                  <div className="position-absolute top-0 end-0 mt-2 me-2">
                    <small className="text-muted">
                      {title.length} / 80
                    </small>
                  </div>
                </div>
                
                {/* Error message for title character limit */}
                {titleError && (
                  <div className="invalid-feedback d-block mt-2">
                    <i className="fas fa-exclamation-triangle text-danger me-2"></i>
                    {titleError}
                  </div>
                )}
              </div>
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
          <div className="d-flex justify-content-end mt-4">  
            <div>
              <button 
                className="btn btn-outline-primary me-2" 
                onClick={handleSaveAndExit}
              >
                {getTranslation('stepTitle.saveAndExit', language)}
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

export default StepTitle;
