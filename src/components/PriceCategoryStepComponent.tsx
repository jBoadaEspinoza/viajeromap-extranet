import React from 'react';

interface PriceCategoryStepComponentProps {
  pricingType: 'same' | 'ageBased';
  onPricingTypeChange: (type: 'same' | 'ageBased') => void;
  onContinue: () => void;
  onBack: () => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
  isLoading: boolean;
  isSaving: boolean;
}

export default function PriceCategoryStepComponent({
  pricingType,
  onPricingTypeChange,
  onContinue,
  onBack,
  language,
  getTranslation,
  isLoading,
  isSaving
}: PriceCategoryStepComponentProps) {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-tags me-2"></i>
                {getTranslation('stepSchedule.priceCategory.title', language)}
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="mb-3">
                        <i className="fas fa-equals fa-3x text-primary"></i>
                      </div>
                      <h5 className="card-title">
                        {getTranslation('stepSchedule.priceCategory.same.title', language)}
                      </h5>
                      <p className="card-text text-muted">
                        {getTranslation('stepSchedule.priceCategory.same.description', language)}
                      </p>
                      <div className="form-check d-flex justify-content-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="pricingType"
                          id="samePrice"
                          value="same"
                          checked={pricingType === 'same'}
                          onChange={(e) => onPricingTypeChange(e.target.value as 'same' | 'ageBased')}
                        />
                        <label className="form-check-label ms-2 fw-semibold" htmlFor="samePrice">
                          {getTranslation('stepSchedule.priceCategory.same.select', language)}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <div className="mb-3">
                        <i className="fas fa-users fa-3x text-success"></i>
                      </div>
                      <h5 className="card-title">
                        {getTranslation('stepSchedule.priceCategory.ageBased.title', language)}
                      </h5>
                      <p className="card-text text-muted">
                        {getTranslation('stepSchedule.priceCategory.ageBased.description', language)}
                      </p>
                      <div className="form-check d-flex justify-content-center">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="pricingType"
                          id="ageBasedPrice"
                          value="ageBased"
                          checked={pricingType === 'ageBased'}
                          onChange={(e) => onPricingTypeChange(e.target.value as 'same' | 'ageBased')}
                        />
                        <label className="form-check-label ms-2 fw-semibold" htmlFor="ageBasedPrice">
                          {getTranslation('stepSchedule.priceCategory.ageBased.select', language)}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mt-4">
                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>{getTranslation('stepSchedule.priceCategory.info.title', language)}</strong>
                  <p className="mb-0 mt-2">
                    {pricingType === 'same' 
                      ? getTranslation('stepSchedule.priceCategory.info.same', language)
                      : getTranslation('stepSchedule.priceCategory.info.ageBased', language)
                    }
                  </p>
                </div>
              </div>

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
                  disabled={isLoading || isSaving || !pricingType}
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

