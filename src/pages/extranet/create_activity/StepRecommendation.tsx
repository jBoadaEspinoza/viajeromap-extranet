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

const StepRecommendation: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  const { company } = useAuth();
  const hasRedirected = useRef(false);
  const [activityData, setActivityData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>(['', '', '']); // Initialize with 3 empty fields
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
        if (activityData && activityData.recommendations) {
          if (Array.isArray(activityData.recommendations)) {
            // Asegurar que siempre tengamos al menos 3 campos
            const loadedRecommendations = [...activityData.recommendations];
            while (loadedRecommendations.length < 3) {
              loadedRecommendations.push('');
            }
            setRecommendations(loadedRecommendations);
          } else {
            setRecommendations(['', '', '']);
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

  const addRecommendation = () => {
    setRecommendations([...recommendations, '']);
  };

  const removeRecommendation = (index: number) => {
    // Only allow removal if we have more than 3 recommendations
    if (recommendations.length > 3) {
      const newRecommendations = recommendations.filter((_, i) => i !== index);
      setRecommendations(newRecommendations);
    }
  };

  const updateRecommendation = (index: number, value: string) => {
    const newRecommendations = [...recommendations];
    newRecommendations[index] = value;
    setRecommendations(newRecommendations);
  };

  const handleSaveAndExit = async () => {
    const validRecommendations = recommendations.filter(rec => rec.trim().length > 0);
    
    if (validRecommendations.length < 3) {
      setError(getTranslation('stepRecommend.error.minimumThreeRequired', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createRecommendations API
        const response = await activitiesApi.createRecommendations({
          id: activityId!,
          recommendations: validRecommendations,
          lang: language
        });
        if (response.success) {
          navigate('/extranet/dashboard');
        } else {
          setError(response.message || getTranslation('stepRecommend.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepRecommend.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleContinue = async () => {
    const validRecommendations = recommendations.filter(rec => rec.trim().length > 0);
    
    if (validRecommendations.length < 3) {
      setError(getTranslation('stepRecommend.error.minimumThreeRequired', language));
      return;
    }

    await withLoading(async () => {
      try {
        // Call createRecommendations API
        const response = await activitiesApi.createRecommendations({
          id: activityId!,
          recommendations: validRecommendations,
          lang: language
        });

        if (response.success) {
          // Navigate to next step (StepRestriction)
          navigateToActivityStep(navigate, '/extranet/activity/createRestrictions', {
            activityId,
            lang,
            currency,
            currentStep:5
          });
        } else {
          setError(response.message || getTranslation('stepRecommend.error.saveFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepRecommend.error.saveFailed', language));
      }
    }, 'save-loading');
  };

  const handleBack = () => {
    navigateToActivityStep(navigate, '/extranet/activity/createDescription', {
      activityId,
      lang,
      currency,
      currentStep:3
    });
  };

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5">
            <h1 className="h3 fw-bold text-primary mb-3">
              {getTranslation('stepRecommend.title', language)}
            </h1>
            <p className="text-muted">
              {getTranslation('stepRecommend.description', language)}
            </p>
          </div>

          {/* Formulario */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {/* Recomendaciones */}
              <div className="mb-4">
                <div className="d-flex align-items-center mb-2">
                  <h6 className="fw-bold mb-0">
                    {getTranslation('stepRecommend.recommendations.label', language)}
                  </h6>
                  <i className="fas fa-question-circle text-primary ms-2"></i>
                </div>
                <p className="text-muted small mb-3">
                  {getTranslation('stepRecommend.recommendations.instructions', language)}
                </p>
                
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex align-items-center">
                      <input
                        type="text"
                        className={`form-control me-2 ${index < 3 && !recommendation.trim() ? 'border-warning' : ''}`}
                        value={recommendation}
                        onChange={(e) => updateRecommendation(index, e.target.value)}
                        placeholder={getTranslation('stepRecommend.recommendations.placeholder', language)}
                        maxLength={100}
                        required={index < 3}
                      />
                      {recommendations.length > 3 && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => removeRecommendation(index)}
                          title={getTranslation('stepRecommend.removeRecommendation', language)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      )}
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {recommendation.length} / 100
                      </small>
                      {index < 3 && (
                        <small className="text-warning">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          {getTranslation('stepRecommend.required', language)}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  className="btn btn-outline-primary btn-sm"
                  onClick={addRecommendation}
                >
                  <i className="fas fa-plus me-2"></i>
                  {getTranslation('stepRecommend.addRecommendation', language)}
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
                {getTranslation('stepRecommend.saveAndExit', language)}
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

export default StepRecommendation;
