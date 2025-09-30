import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getTranslation } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';
import { useAppSelector, useAppDispatch } from '@/redux/store';
import { activitiesApi } from '@/api/activities';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';

const StepInclude: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const hasRedirected = useRef(false);
  const [activityData, setActivityData] = useState<any>(null);
  const [inclusions, setInclusions] = useState<string[]>(['', '', '']); // Initialize with 3 empty fields
  const [error, setError] = useState<string | null>(null);

  // Obtener parámetros de URL
  const { activityId, lang, currency, currentStep } = useActivityParams();
 
  //Cargar datos existentes de la actividad
  useEffect(() => {
    const loadActivityData = async () => {
      if (!activityId) return;
      await withLoading(async () => {
        const activityData = await activitiesApi.getById(activityId, lang, currency.toUpperCase());
        setActivityData(activityData);

        // Cargar inclusions si existen
        if (activityData && activityData.includes) {
          if (Array.isArray(activityData.includes)) {
            // Asegurar que siempre tengamos al menos 3 campos
            const loadedInclusions = [...activityData.includes];
            while (loadedInclusions.length < 3) {
              loadedInclusions.push('');
            }
            setInclusions(loadedInclusions);
          } else {
            setInclusions([]);
          }
        }
      }, 'load-activity-data');
    };
    loadActivityData();
  }, [activityId, lang, currency]);

  useEffect(() => {
    // Verificar que tenemos activityId antes de continuar
    if (!activityId && !hasRedirected.current) {
      hasRedirected.current = true;
      navigate('/extranet/login');
    } else if (activityId) {
      hasRedirected.current = false;
    }
  }, [activityId, navigate]);

  const addInclusion = () => {
    setInclusions([...inclusions, '']);
  };

  const removeInclusion = (index: number) => {
    // Only allow removal if we have more than 3 inclusions
    if (inclusions.length > 3) {
      const newInclusions = inclusions.filter((_, i) => i !== index);
      setInclusions(newInclusions);
    }
  };

  const updateInclusion = (index: number, value: string) => {
    const newInclusions = [...inclusions];
    newInclusions[index] = value;
    setInclusions(newInclusions);
  };

  const handleSaveAndExit = async () => {
    const validInclusions = inclusions.filter(inc => inc.trim().length > 0);
    if (validInclusions.length === 0) {
      setError(getTranslation('stepInclude.error.emptyInclusionsNotAllowed', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createIncludes API
        const response = await activitiesApi.createIncludes({
          id: activityId!,
          inclusions: validInclusions,
          lang: language
        });
        if (response.success) {
          navigate('/extranet/dashboard');
        } else {
          setError(response.message || getTranslation('stepInclude.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepInclude.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleContinue = async () => {
    const validInclusions = inclusions.filter(inc => inc.trim().length > 0);
    
    if (validInclusions.length < 3) {
      setError(getTranslation('stepInclude.error.minimumThreeRequired', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createIncludes API
        const response = await activitiesApi.createIncludes({
          id: activityId!,
          inclusions: validInclusions,
          lang: language
        });

        if (response.success) {
          // Navigate to next step (StepNotInclude)
          navigateToActivityStep(navigate, '/extranet/activity/createNotIncluded', {
            activityId,
            lang,
            currency,
            currentStep:7
          });
        } else {
          setError(response.message || getTranslation('stepInclude.error.saveFailed', language));
        }
      } catch (error) {
        console.error('Error saving inclusions:', error);
        setError(getTranslation('stepInclude.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createRestrictions', {
      activityId,
      lang,
      currency,
      currentStep:5
    });
  };

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5">
            <h1 className="h3 fw-bold text-primary mb-3">
              {getTranslation('stepInclude.title', language)}
            </h1>
            <p className="text-muted">
              {getTranslation('stepInclude.description', language)}
            </p>
          </div>

          {/* Formulario */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {/* Inclusiones */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    {getTranslation('stepInclude.inclusions.label', language)}
                  </h6>
                  <i className="fas fa-question-circle text-primary ms-2"></i>
                </div>
                <p className="text-muted small mb-3">
                  {getTranslation('stepInclude.inclusions.instructions', language)}
                </p>
                
                {inclusions.map((inclusion, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex align-items-center">
                      <input
                        type="text"
                        className={`form-control me-2 ${index < 3 && !inclusion.trim() ? 'border-warning' : ''}`}
                        value={inclusion}
                        onChange={(e) => updateInclusion(index, e.target.value)}
                        placeholder={getTranslation('stepInclude.inclusions.placeholder', language)}
                        maxLength={100}
                        required={index < 3}
                      />
                      {inclusions.length > 3 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeInclusion(index)}
                          title={getTranslation('stepInclude.removeInclusion', language)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {inclusion.length} / 100
                      </small>
                      {index < 3 && (
                        <small className="text-warning">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          {getTranslation('stepInclude.required', language)}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addInclusion}
                >
                  <i className="fas fa-plus me-2"></i>
                  {getTranslation('stepInclude.addInclusion', language)}
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
                {getTranslation('stepInclude.saveAndExit', language)}
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

export default StepInclude;
