import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getTranslation } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { activitiesApi } from '@/api/activities';
import { useAuth } from '@/context/AuthContext';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';

const StepNotInclude: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const hasRedirected = useRef(false);
  const { company } = useAuth();
  const [activityData, setActivityData] = useState<any>(null);
  const [exclusions, setExclusions] = useState<string[]>([]); // Initialize empty - this step is optional
  
  // Debug: Log exclusions state
  useEffect(() => {
    console.log('StepNotInclude - exclusions state:', exclusions);
  }, [exclusions]);
  const [error, setError] = useState<string | null>(null);

  // Obtener parámetros de URL
  const { activityId, lang, currency, currentStep } = useActivityParams();
  //Cargar datos existentes de la actividad
  useEffect(() => {
    const loadActivityData = async () => {
      if (!activityId) return;
      await withLoading(async () => {
        const activityData = await activitiesApi.getById(activityId, lang, currency.toUpperCase(),company?.ruc?.toString());
        setActivityData(activityData);
        
        // Cargar exclusions si existen (solo si hay datos reales)
        if (activityData && activityData.notIncludes) {
          if (Array.isArray(activityData.notIncludes) && activityData.notIncludes.length > 0) {
            // Solo cargar si hay datos reales, no inicializar con campos vacíos
            const loadedExclusions = activityData.notIncludes.filter(item => item && item.trim().length > 0);
            console.log('StepNotInclude - loaded exclusions:', loadedExclusions);
            setExclusions(loadedExclusions);
          } else {
            // Asegurar que esté vacío si no hay datos
            console.log('StepNotInclude - no exclusions found, setting empty array');
            setExclusions([]);
          }
        } else {
          // Asegurar que esté vacío si no hay activityData
          console.log('StepNotInclude - no activityData, setting empty array');
          setExclusions([]);
        }
      }, 'load-activity-data');
    };
    loadActivityData();
  }, [activityId, lang, currency]);

  useEffect(() => {
    // Solo redirigir si no hay activityId y no se ha redirigido antes
    if (!activityId && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/extranet/login');
    } else if (activityId) {
      hasRedirected.current = false;
    }
  }, [activityId, navigate]);

  const addExclusion = () => {
    setExclusions([...exclusions, '']);
  };

  const removeExclusion = (index: number) => {
    const newExclusions = exclusions.filter((_, i) => i !== index);
      setExclusions(newExclusions);
  };

  const updateExclusion = (index: number, value: string) => {
    const newExclusions = [...exclusions];
    newExclusions[index] = value;
    setExclusions(newExclusions);
  };


  const handleSaveAndExit = async () => {
    const validExclusions = exclusions.filter(exc => exc.trim().length > 0);
    if (validExclusions.length === 0) {
      setError(getTranslation('stepNotInclude.error.emptyExclusionsNotAllowed', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createNotIncludes API
        const response = await activitiesApi.createNotIncludes({
          id: activityId!,
          notInclusions: validExclusions,
          lang: language
        });
        if (response.success) {
          navigate('/extranet/dashboard');
        } else {
          setError(response.message || getTranslation('stepNotInclude.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepNotInclude.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleContinue = async () => {
    const validExclusions = exclusions.filter(exc => exc.trim().length > 0);
    
    // Check if there are any exclusions with empty content
    if (exclusions.length > 0 && exclusions.some(exc => exc.trim().length === 0)) {
      setError(getTranslation('stepNotInclude.error.emptyExclusionsNotAllowed', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createNotIncludes API
        const response = await activitiesApi.createNotIncludes({
          id: activityId!,
          notInclusions: validExclusions,
          lang: language
        });

        // If there are no exclusions, continue to next step (StepImages)
        if (validExclusions.length === 0) {
          navigateToActivityStep(navigate, '/extranet/activity/createImages', {
            activityId,
            lang,
            currency,
            currentStep:8
          });
        }
        
        if (response.success) {
          // Navigate to next step (StepImages)
          navigateToActivityStep(navigate, '/extranet/activity/createImages', {
            activityId,
            lang,
            currency,
            currentStep:8
          });
        } else {
          setError(response.message || getTranslation('stepNotInclude.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepNotInclude.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createInclude', {
      activityId,
      lang,
      currency,
      currentStep:6
    });
  };

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5">
            <h1 className="h3 fw-bold text-primary mb-3">
              {getTranslation('stepNotInclude.title', language)}
            </h1>
            <p className="text-muted">
              {getTranslation('stepNotInclude.description', language)}
            </p>
          </div>

          {/* Formulario */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {/* Exclusiones */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    {getTranslation('stepNotInclude.exclusions.label', language)}
                  </h6>
                  <i className="fas fa-question-circle text-primary ms-2"></i>
                </div>
                <p className="text-muted small mb-3">
                  {getTranslation('stepNotInclude.exclusions.instructions', language)}
                </p>
                
                {exclusions.map((exclusion, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex align-items-center">
                      <input
                        type="text"
                        className="form-control me-2"
                        value={exclusion}
                        onChange={(e) => updateExclusion(index, e.target.value)}
                        placeholder={getTranslation('stepNotInclude.exclusions.placeholder', language)}
                        maxLength={100}
                      />
                      {exclusions.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeExclusion(index)}
                          title={getTranslation('stepNotInclude.removeExclusion', language)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {exclusion.length} / 100
                      </small>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addExclusion}
                >
                  <i className="fas fa-plus me-2"></i>
                  {getTranslation('stepNotInclude.addExclusion', language)}
                </button>
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
                {getTranslation('stepNotInclude.saveAndExit', language)}
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

export default StepNotInclude;
