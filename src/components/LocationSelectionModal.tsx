import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (location: string) => void;
}

const LocationSelectionModal: React.FC<LocationSelectionModalProps> = ({ isOpen, onClose, onNext }) => {
  const { language } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState('');

  const locations = [
    'Andes Mountains, Peru',
    'Ballestas Islands',
    'Ica',
    'Ica Region',
    'Paracas',
    'Nazca',
    'Lima',
    'Cusco',
    'Machu Picchu',
    'Sacred Valley'
  ];

  const handleNext = () => {
    if (selectedLocation) {
      onNext(selectedLocation);
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
              {getTranslation('stepItinerary.location.title', language)}
            </h4>
            
            <p className="text-muted mb-4">
              {getTranslation('stepItinerary.location.instructions', language)}
            </p>

            {/* Location Dropdown */}
            <div className="mb-4">
              <select
                className="form-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="">
                  {getTranslation('stepItinerary.location.placeholder', language)}
                </option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer border-0 pt-0">
            <div className="d-flex justify-content-end w-100">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!selectedLocation}
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

export default LocationSelectionModal;
