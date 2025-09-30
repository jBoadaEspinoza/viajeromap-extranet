import React from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { useActivityParams } from '../hooks/useActivityParams';

interface ActivityCreationLayoutProps {
  children: React.ReactNode;
  totalSteps: number;
}

const ActivityCreationLayout: React.FC<ActivityCreationLayoutProps> = ({
  children,
  totalSteps
}) => {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  
  // Obtener currentStep desde URL
  const { currentStep = 1 } = useActivityParams();

  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value as 'es' | 'en';
    setLanguage(newLanguage);
  };

  const { activityId, lang, currency } = useActivityParams();
  
  const steps = [
    { id: 'category', title: getTranslation('activityCreation.steps.category', language), path: '/extranet/activity/createCategory', completed: currentStep > 1 },
    { id: 'title', title: getTranslation('activityCreation.steps.title', language), path: '/extranet/activity/createTitle', completed: currentStep > 2 },
    { id: 'description', title: getTranslation('activityCreation.steps.description', language), path: '/extranet/activity/createDescription', completed: currentStep > 3 },
    { id: 'recommendations', title: getTranslation('activityCreation.steps.recommendations', language), path: '/extranet/activity/createRecommendation', completed: currentStep > 4 },
    { id: 'restrictions', title: getTranslation('activityCreation.steps.restrictions', language), path: '/extranet/activity/createRestrictions', completed: currentStep > 5 },
    { id: 'included', title: getTranslation('activityCreation.steps.included', language), path: '/extranet/activity/createInclude', completed: currentStep > 6 },
    { id: 'not_included', title: getTranslation('activityCreation.steps.not_included', language), path: '/extranet/activity/createNotIncluded', completed: currentStep > 7 },
    { id: 'images', title: getTranslation('activityCreation.steps.images', language), path: '/extranet/activity/addImages', completed: currentStep > 8 },
    { id: 'options', title: getTranslation('activityCreation.steps.options', language), path: '/extranet/activity/addOptions', completed: currentStep > 9 },
    { id: 'itineraries', title: getTranslation('activityCreation.steps.itineraries', language), path: '/extranet/activity/addItinerary', completed: currentStep > 10 }
  ];

  const isCurrentStep = (stepPath: string) => {
    return location.pathname === stepPath;
  };

  const createStepUrl = (stepPath: string) => {
    const url = new URL(stepPath, window.location.origin);
    if (activityId) {
      url.searchParams.set('activityId', activityId);
    }
    url.searchParams.set('lang', lang);
    url.searchParams.set('currency', currency);
    url.searchParams.set('currentStep', currentStep.toString());
    return url.pathname + url.search;
  };

  return (
    <div className="activity-creation-layout">
      {/* Progress Bar */}
      <div className="progress-bar-container bg-white border-bottom">
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col">
              <div className="progress" style={{ height: '8px' }}>
                <div 
                  className="progress-bar bg-success" 
                  role="progressbar" 
                  style={{ width: `${progressPercentage}%` }}
                  aria-valuenow={progressPercentage} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            <div className="col-auto d-flex align-items-center gap-3">
              <span className="text-muted fw-bold">{progressPercentage}%</span>
              
              {/* Language Selector */}
              <div className="language-selector">
                <select 
                  value={language} 
                  onChange={handleLanguageChange}
                  className="form-select form-select-sm border-0 bg-transparent text-muted"
                  style={{ minWidth: '80px' }}
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex">
        {/* Sidebar */}
        <div className="sidebar bg-primary text-white border-end" style={{ width: '280px', minHeight: 'calc(100vh - 80px)' }}>
          <div className="p-4">
            <nav className="nav flex-column">
              {steps.map((step, index) => (
                <div key={step.id} className="nav-item mb-2">
                  <div className={`nav-link p-2 rounded ${isCurrentStep(step.path) ? 'bg-outline-primary text-white' : 'text-white'}`}>
                    <div className="d-flex align-items-center">
                      {step.completed ? (
                        <i className="fas fa-check-circle text-success me-2"></i>
                      ) : isCurrentStep(step.path) ? (
                        <i className="fas fa-arrow-right text-white me-2"></i>
                      ) : (
                        <div className="me-2" style={{ width: '16px' }}></div>
                      )}
                      <span className="small">{step.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 bg-white">
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCreationLayout; 