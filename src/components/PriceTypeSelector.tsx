import React from 'react';

interface PriceTypeSelectorProps {
  pricingType: 'same' | 'ageBased';
  onPricingTypeChange: (type: 'same' | 'ageBased') => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
}

export default function PriceTypeSelector({
  pricingType,
  onPricingTypeChange,
  language,
  getTranslation
}: PriceTypeSelectorProps) {
  return (
    <div className="mb-4">
      <h5 className="mb-3">
        <i className="fas fa-dollar-sign me-2"></i>
        {getTranslation('stepSchedule.pricing.type.title', language)}
      </h5>
      
      <div className="row">
        <div className="col-md-6">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="pricingType"
              id="samePrice"
              value="same"
              checked={pricingType === 'same'}
              onChange={(e) => onPricingTypeChange(e.target.value as 'same' | 'ageBased')}
            />
            <label className="form-check-label fw-semibold" htmlFor="samePrice">
              {getTranslation('stepSchedule.pricing.type.same', language)}
            </label>
          </div>
        </div>
        <div className="col-md-6">
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="pricingType"
              id="ageBasedPrice"
              value="ageBased"
              checked={pricingType === 'ageBased'}
              onChange={(e) => onPricingTypeChange(e.target.value as 'same' | 'ageBased')}
            />
            <label className="form-check-label fw-semibold" htmlFor="ageBasedPrice">
              {getTranslation('stepSchedule.pricing.type.ageBased', language)}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

