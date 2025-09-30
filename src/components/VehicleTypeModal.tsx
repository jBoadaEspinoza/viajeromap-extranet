import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface VehicleTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNext: (vehicleType: string) => void;
}

const VehicleTypeModal: React.FC<VehicleTypeModalProps> = ({ isOpen, onClose, onNext }) => {
  const { language } = useLanguage();
  const [selectedVehicle, setSelectedVehicle] = useState('');

  const vehicleTypes = [
    'Autobús',
    'Minibús',
    'Vehículo privado',
    'Taxi',
    'Tren',
    'Barco',
    'Avión',
    'Bicicleta',
    'A pie'
  ];

  const handleNext = () => {
    if (selectedVehicle) {
      onNext(selectedVehicle);
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
              {getTranslation('stepItinerary.vehicleType.title', language)}
            </h4>
            
            <p className="text-muted mb-4">
              {getTranslation('stepItinerary.vehicleType.instructions', language)}
            </p>

            {/* Vehicle Type Dropdown */}
            <div className="mb-4">
              <select
                className="form-select"
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
              >
                <option value="">
                  {getTranslation('stepItinerary.vehicleType.placeholder', language)}
                </option>
                {vehicleTypes.map((vehicle) => (
                  <option key={vehicle} value={vehicle}>
                    {vehicle}
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
                disabled={!selectedVehicle}
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

export default VehicleTypeModal;
