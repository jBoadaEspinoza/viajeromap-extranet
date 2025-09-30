import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface ActivityTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (activityType: string) => void;
}

const ActivityTypeModal: React.FC<ActivityTypeModalProps> = ({ isOpen, onClose, onNext }) => {
  const { language } = useLanguage();
  const [selectedActivity, setSelectedActivity] = useState('');
  const [customActivity, setCustomActivity] = useState('');

  const activityTypes = [
    { key: 'class', label: 'stepItinerary.activityType.class' },
    { key: 'safetyInfo', label: 'stepItinerary.activityType.safetyInfo' },
    { key: 'selfGuidedTour', label: 'stepItinerary.activityType.selfGuidedTour' },
    { key: 'overnightStay', label: 'stepItinerary.activityType.overnightStay' },
    { key: 'stopovers', label: 'stepItinerary.activityType.stopovers' }
  ];

  const handleNext = () => {
    const activityType = customActivity.trim() || selectedActivity;
    if (activityType) {
      onNext(activityType);
    }
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
              {getTranslation('stepItinerary.activityType.title', language)}
            </h4>
            
            <p className="text-muted mb-4">
              {getTranslation('stepItinerary.activityType.instructions', language)}
            </p>

            {/* Search Input */}
            <div className="mb-4">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={getTranslation('stepItinerary.activityType.placeholder', language)}
                  value={customActivity}
                  onChange={(e) => setCustomActivity(e.target.value)}
                />
              </div>
              <div className="form-text">
                {getTranslation('stepItinerary.activityType.selectFromList', language)}
              </div>
            </div>

            {/* Activity Type List */}
            <div className="mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {activityTypes.map((activity) => (
                <div key={activity.key} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="activityType"
                    id={activity.key}
                    value={activity.key}
                    checked={selectedActivity === activity.key}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor={activity.key}>
                    {getTranslation(activity.label, language)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <div className="d-flex justify-content-end w-100">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!selectedActivity && !customActivity.trim()}
              >
                {getTranslation('stepItinerary.next', language)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityTypeModal;
