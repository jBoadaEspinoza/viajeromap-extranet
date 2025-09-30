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

const StepRestriction: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const { company } = useAuth();
  const hasRedirected = useRef(false);
  const [activityData, setActivityData] = useState<any>(null);
  const [restrictions, setRestrictions] = useState<string[]>([]); // Start with no restrictions
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
        
        // Cargar recomendaciones si existen
        if (activityData && activityData.restrictions) {
          if (Array.isArray(activityData.restrictions)) {
            // Es opcional, si no hay, se crea un array vacío
            const loadedRestrictions = [...activityData.restrictions];
            if (loadedRestrictions.length === 0) {
              loadedRestrictions.push('');
            }
            setRestrictions(loadedRestrictions);
          } else {
            setRestrictions([]);
          }
        }
      }, 'load-activity-data');
    };
    loadActivityData();
  }, [activityId, lang, currency]);

  useEffect(() => {
    // Solo redirigir si no hay activityId y no se ha redirigido antes
    if (!activityId && !hasRedirected.current){
        hasRedirected.current = true;
        navigate('/extranet/login');
      } else if (activityId) {
        hasRedirected.current = false;
    }
  }, [activityId, navigate, lang, currency]);

  const addRestriction = () => {
    setRestrictions([...restrictions, '']);
  };

  const removeRestriction = (index: number) => {
    const newRestrictions = restrictions.filter((_, i) => i !== index);
    setRestrictions(newRestrictions);
  };

  const updateRestriction = (index: number, value: string) => {
    const newRestrictions = [...restrictions];
    newRestrictions[index] = value;
    setRestrictions(newRestrictions);
  };

  const handleSaveAndExit = async () => {
    const validRestrictions = restrictions.filter(rest => rest.trim().length > 0);
    if (validRestrictions.length === 0) {
      setError(getTranslation('stepRestriction.error.emptyRestrictionsNotAllowed', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createRestrictions API
        const response = await activitiesApi.createRestrictions({
          id: activityId!,
          restrictions: validRestrictions,
          lang: language
        });
        if (response.success) {
          navigate('/extranet/dashboard');
        } else {
          setError(response.message || getTranslation('stepRestriction.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepRestriction.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleContinue = async () => {
    const validRestrictions = restrictions.filter(rest => rest.trim().length > 0);
    
    // Check if there are any restrictions with empty content
    if (restrictions.length > 0 && restrictions.some(rest => rest.trim().length === 0)) {
      setError(getTranslation('stepRestriction.error.emptyRestrictionsNotAllowed', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createRestrictions API only if there are restrictions
        if (validRestrictions.length > 0) {
          const response = await activitiesApi.createRestrictions({
            id: activityId!,
            restrictions: validRestrictions,
            lang: language
          });

          if (!response.success) {
            setError(response.message || getTranslation('stepRestriction.error.saveFailed', language));
            return;
          }
        }

        // Navigate to next step (StepInclude)
        navigateToActivityStep(navigate, '/extranet/activity/createInclude', {
          activityId,
          lang,
          currency,
          currentStep:6
        });
      } catch (error) {
        setError(getTranslation('stepRestriction.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createRecommendations', {
      activityId,
      lang,
      currency,
      currentStep:4
    });
  };

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5">
            <h1 className="h3 fw-bold text-primary mb-3">
              {getTranslation('stepRestriction.title', language)}
            </h1>
            <p className="text-muted">
              {getTranslation('stepRestriction.description', language)}
            </p>
          </div>

          {/* Formulario */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {/* Restricciones */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    {getTranslation('stepRestriction.restrictions.label', language)}
                  </h6>
                  <i className="fas fa-question-circle text-primary ms-2"></i>
                </div>
                <p className="text-muted small mb-3">
                  {getTranslation('stepRestriction.restrictions.instructions', language)}
                </p>
                
                {restrictions.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">
                      {getTranslation('stepRestriction.noRestrictions', language)}
                    </p>
                  </div>
                )}
                
                {restrictions.map((restriction, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex align-items-center">
                      <input
                        type="text"
                        className={`form-control me-2 ${restriction.trim().length === 0 ? 'border-danger' : ''}`}
                        value={restriction}
                        onChange={(e) => updateRestriction(index, e.target.value)}
                        placeholder={getTranslation('stepRestriction.restrictions.placeholder', language)}
                        maxLength={100}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeRestriction(index)}
                        title={getTranslation('stepRestriction.removeRestriction', language)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {restriction.length} / 100
                      </small>
                      {restriction.trim().length === 0 && (
                        <small className="text-danger">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          {getTranslation('stepRestriction.error.emptyNotAllowed', language)}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addRestriction}
                >
                  <i className="fas fa-plus me-2"></i>
                  {getTranslation('stepRestriction.addRestriction', language)}
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
                {getTranslation('stepRestriction.saveAndExit', language)}
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

export default StepRestriction;
