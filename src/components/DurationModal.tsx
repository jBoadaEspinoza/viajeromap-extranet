import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface DurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (duration: { hours: number; minutes: number }) => void;
  onSkip: () => void;
}

const DurationModal: React.FC<DurationModalProps> = ({ isOpen, onClose, onNext, onSkip }) => {
  const { language } = useLanguage();
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);

  const handleNext = () => {
    onNext({ hours, minutes });
  };

  if (!isOpen) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header border-0 pb-0">
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>
          
          <div className="modal-body px-4 pb-4">
            <h4 className="text-primary mb-3">
              {getTranslation('stepItinerary.duration.title', language)}
            </h4>
            
            <p className="text-muted mb-4">
              {getTranslation('stepItinerary.duration.instructions', language)}
            </p>

            {/* Duration Input */}
            <div className="mb-4">
              <label className="form-label fw-bold">
                {getTranslation('stepItinerary.duration.title', language)}
              </label>
              <div className="d-flex gap-3">
                <div className="flex-fill">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  />
                  <div className="form-text text-center">
                    {getTranslation('stepItinerary.duration.hours', language)}
                  </div>
                </div>
                <div className="flex-fill">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  />
                  <div className="form-text text-center">
                    {getTranslation('stepItinerary.duration.minutes', language)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <div className="d-flex justify-content-between w-100">
              <button
                type="button"
                className="btn btn-link text-primary"
                onClick={onSkip}
              >
                <i className="fas fa-arrow-left me-2"></i>
                {getTranslation('stepItinerary.back', language)}
              </button>
              
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={onSkip}
                >
                  {getTranslation('stepItinerary.skip', language)}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  {getTranslation('stepItinerary.next', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DurationModal;
