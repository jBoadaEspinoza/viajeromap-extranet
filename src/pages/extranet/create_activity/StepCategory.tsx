import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { getTranslation } from '@/utils/translations';
import ActivityCreationLayout from '@/components/ActivityCreationLayout';
import { useExtranetLoading } from '@/hooks/useExtranetLoading';
import { useAppDispatch } from '@/redux/store';
import { setSelectedCategory } from '@/redux/activityCreationSlice';
import { activitiesApi } from '@/api/activities';
import { categoriesApi } from '@/api/categories';
import type { Category } from '@/api/categories';
import { useActivityParams } from '@/hooks/useActivityParams';
import { navigateToActivityStep } from '@/utils/navigationUtils';

const StepCategory: React.FC = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { withLoading } = useExtranetLoading();
  const dispatch = useAppDispatch();
  
  // Obtener parámetros de URL
  const { activityId, lang, currency, currentStep } = useActivityParams();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cargar categorías desde la API
  useEffect(() => {
    const fetchCategories = async () => {
      await withLoading(async () => {
        setError(null);
        const response = await categoriesApi.getCategories({ lang: language });
        
        if (response.success && response.data && response.data.length > 0) {
          setCategories(response.data);
        } else {
          setError(getTranslation('categories.error.noCategories', language));
        }
      }, 'categories-loading');
    };

    fetchCategories();
  }, [language, withLoading]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategoryId(category.id);
  };

  const handleContinue = async () => {
    if (!selectedCategoryId) {
      setError(getTranslation('stepCategory.error.noCategorySelected', language));
      return;
    }

    await withLoading(async () => {
      try {
        const response = await activitiesApi.createCategory({
          categoryId: selectedCategoryId
        });
        
        if (response && response.success && response.idCreated) {
          const newActivityId = response.idCreated;
          const selectedCat = categories.find(cat => cat.id === selectedCategoryId);
          
          if (selectedCat) {
            // Guardar solo la categoría seleccionada en Redux
            dispatch(setSelectedCategory({ id: selectedCat.id, name: selectedCat.name }));
            
            // Navegar al siguiente paso con parámetros de URL
            navigateToActivityStep(navigate, '/extranet/activity/createTitle', {
              activityId: newActivityId,
              lang,
              currency,
              currentStep: 2
            });
          }
        } else {
          setError(getTranslation('stepCategory.error.createFailed', language));
        }
      } catch (error) {
        setError(getTranslation('stepCategory.error.createFailed', language));
      }
    }, 'create-loading');
  };

  const handleBack = () => {
    navigate('/extranet/list-activities');
  };



  if (error) {
    return (
      <div className="container mt-5">
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-danger" role="alert">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
            <button className="btn btn-outline-secondary" onClick={handleBack}>
              <i className="fas fa-arrow-left me-2"></i>
              {getTranslation('common.back', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ActivityCreationLayout totalSteps={10}>
      <div className="row justify-content-center">
        <div className="col-md-8">
          {/* Header */}
          <div className="mb-5 text-center">
            <h5 className="h3 fw-bold text-primary mb-3">{getTranslation('stepCategory.title', language)}</h5>
            <p className="text-muted">
              <small>{getTranslation('stepCategory.description', language)}</small>
            </p>
          </div>

          {/* Categorías */}
          <div className="card border-0 shadow-sm">
            <div className="card-body p-0">
              {categories.map((category, index) => (
                <div key={category.id}>
                  <div className="p-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="category"
                        id={`category-${category.id}`}
                        value={category.id}
                        checked={selectedCategoryId === category.id}
                        onChange={() => handleCategorySelect(category)}
                      />
                      <label className="form-check-label w-100" htmlFor={`category-${category.id}`}>
                        <div className="d-flex">
                          <div className="flex-grow-1">
                            <h6 className="fw-bold mb-1">{category.name}</h6>
                            <p className="text-muted mb-0 small">{category.description}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                  {index < categories.length - 1 && <hr className="my-0" />}
                </div>
              ))}
            </div>
          </div>
          
          {/* Banner informativo */}
          <div className="alert alert-info mt-4" role="alert">
            <div className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1"></i>
              <div>
                <strong>{getTranslation('stepCategory.warning.title', language)}</strong>
                <br />
                <small>{getTranslation('stepCategory.warning.description', language)}</small>
              </div>
            </div>
          </div>
          
          {/* Botones de navegación */}
          <div className="d-flex justify-content-end mt-4">   
            <button 
              className="btn btn-primary" 
              onClick={handleContinue}
              disabled={!selectedCategoryId}
            >
              {getTranslation('common.continue', language)}
              <i className="fas fa-arrow-right ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    </ActivityCreationLayout>
  );
};

export default StepCategory;
