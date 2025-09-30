import React from 'react';
import SamePriceComponent from './SamePriceComponent';
import AgeBasedPriceComponent from './AgeBasedPriceComponent';

interface PricingLevel {
  id: string;
  minPeople: number;
  maxPeople: number;
  clientPays: string;
  pricePerPerson: string;
}

interface AgeGroup {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
}

interface PricingStepComponentProps {
  pricingType: 'same' | 'ageBased';
  pricingLevels: PricingLevel[];
  ageGroups: AgeGroup[];
  onPricingLevelsChange: (levels: PricingLevel[]) => void;
  onAgeGroupsChange: (groups: AgeGroup[]) => void;
  onAddPricingLevel: () => void;
  onRemovePricingLevel: (id: string) => void;
  onPricingLevelChange: (id: string, field: keyof PricingLevel, value: string | number) => void;
  onAddAgeGroup: () => void;
  onRemoveAgeGroup: (id: string) => void;
  onManualAgeRangeChange: (id: string, field: 'minAge' | 'maxAge', value: number) => void;
  onContinue: () => void;
  onBack: () => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
  isLoading: boolean;
  isSaving: boolean;
}

export default function PricingStepComponent({
  pricingType,
  pricingLevels,
  ageGroups,
  onPricingLevelsChange,
  onAgeGroupsChange,
  onAddPricingLevel,
  onRemovePricingLevel,
  onPricingLevelChange,
  onAddAgeGroup,
  onRemoveAgeGroup,
  onManualAgeRangeChange,
  onContinue,
  onBack,
  language,
  getTranslation,
  isLoading,
  isSaving
}: PricingStepComponentProps) {
  const handleSamePriceContinue = () => {
    onContinue();
  };

  const handleAgeBasedContinue = () => {
    onContinue();
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-dollar-sign me-2"></i>
                {getTranslation('stepSchedule.pricing.title', language)}
              </h4>
            </div>
            <div className="card-body">
              {/* Información del tipo de precio seleccionado */}
              <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                <strong>{getTranslation('stepSchedule.pricing.selectedType', language)}</strong>
                <p className="mb-0 mt-2">
                  {pricingType === 'same' 
                    ? getTranslation('stepSchedule.pricing.same.description', language)
                    : getTranslation('stepSchedule.pricing.ageBased.description', language)
                  }
                </p>
              </div>

              {/* Componente de precios iguales */}
              {pricingType === 'same' && (
                <SamePriceComponent
                  pricingLevels={pricingLevels}
                  onPricingLevelsChange={onPricingLevelsChange}
                  onAddPricingLevel={onAddPricingLevel}
                  onRemovePricingLevel={onRemovePricingLevel}
                  onPricingLevelChange={onPricingLevelChange}
                  onContinue={handleSamePriceContinue}
                  language={language}
                  getTranslation={getTranslation}
                />
              )}

              {/* Componente de precios basados en edad */}
              {pricingType === 'ageBased' && (
                <AgeBasedPriceComponent
                  ageGroups={ageGroups}
                  onAgeGroupsChange={onAgeGroupsChange}
                  onAddAgeGroup={onAddAgeGroup}
                  onRemoveAgeGroup={onRemoveAgeGroup}
                  onManualAgeRangeChange={onManualAgeRangeChange}
                  onContinue={handleAgeBasedContinue}
                  language={language}
                  getTranslation={getTranslation}
                />
              )}

              {/* Botones de navegación */}
              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={onBack}
                  disabled={isLoading || isSaving}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  {getTranslation('stepSchedule.buttons.back', language)}
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onContinue}
                  disabled={isLoading || isSaving}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {getTranslation('stepSchedule.buttons.saving', language)}
                    </>
                  ) : (
                    <>
                      {getTranslation('stepSchedule.buttons.continue', language)}
                      <i className="fas fa-arrow-right ms-2"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

