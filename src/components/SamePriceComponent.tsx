import React from 'react';

interface PricingLevel {
  id: string;
  minPeople: number;
  maxPeople: number;
  clientPays: string;
  pricePerPerson: string;
}

interface SamePriceComponentProps {
  pricingLevels: PricingLevel[];
  onPricingLevelsChange: (levels: PricingLevel[]) => void;
  onAddPricingLevel: () => void;
  onRemovePricingLevel: (id: string) => void;
  onPricingLevelChange: (id: string, field: keyof PricingLevel, value: string | number) => void;
  onContinue: () => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
}

export default function SamePriceComponent({
  pricingLevels,
  onPricingLevelsChange,
  onAddPricingLevel,
  onRemovePricingLevel,
  onPricingLevelChange,
  onContinue,
  language,
  getTranslation
}: SamePriceComponentProps) {
  return (
    <div className="mt-4">
      <h5 className="mb-3">
        <i className="fas fa-users me-2"></i>
        {getTranslation('stepSchedule.pricing.levels.title', language)}
      </h5>
      
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-light">
            <tr>
              <th className="text-center" style={{ width: '20%' }}>
                {getTranslation('stepSchedule.pricing.levels.minPeople', language)}
              </th>
              <th className="text-center" style={{ width: '20%' }}>
                {getTranslation('stepSchedule.pricing.levels.maxPeople', language)}
              </th>
              <th className="text-center" style={{ width: '30%' }}>
                {getTranslation('stepSchedule.pricing.levels.clientPays', language)}
              </th>
              <th className="text-center" style={{ width: '20%' }}>
                {getTranslation('stepSchedule.pricing.levels.pricePerPerson', language)}
              </th>
              <th className="text-center" style={{ width: '10%' }}>
                {getTranslation('stepSchedule.pricing.levels.actions', language)}
              </th>
            </tr>
          </thead>
          <tbody>
            {pricingLevels.map((level, index) => (
              <tr key={level.id}>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="1"
                    value={level.minPeople}
                    onChange={(e) => onPricingLevelChange(level.id, 'minPeople', parseInt(e.target.value) || 1)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    min="1"
                    value={level.maxPeople === -1 ? '' : level.maxPeople}
                    onChange={(e) => {
                      const value = e.target.value === '' ? -1 : parseInt(e.target.value) || 1;
                      onPricingLevelChange(level.id, 'maxPeople', value);
                    }}
                    placeholder={getTranslation('stepSchedule.pricing.levels.unlimited', language)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={level.clientPays}
                    onChange={(e) => onPricingLevelChange(level.id, 'clientPays', e.target.value)}
                    placeholder="0.00"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={level.pricePerPerson}
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </td>
                <td className="text-center">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onRemovePricingLevel(level.id)}
                    disabled={pricingLevels.length <= 1}
                    title={pricingLevels.length <= 1 ? getTranslation('stepSchedule.pricing.levels.cannotRemove', language) : getTranslation('stepSchedule.pricing.levels.remove', language)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mt-3">
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={onAddPricingLevel}
        >
          <i className="fas fa-plus me-2"></i>
          {getTranslation('stepSchedule.pricing.levels.addLevel', language)}
        </button>
        
        <button
          type="button"
          className="btn btn-primary"
          onClick={onContinue}
        >
          <i className="fas fa-arrow-right me-2"></i>
          {getTranslation('stepSchedule.buttons.continue', language)}
        </button>
      </div>
    </div>
  );
}
