import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';

interface ExampleItineraryProps {
  className?: string;
}

const ExampleItinerary: React.FC<ExampleItineraryProps> = ({ className = '' }) => {
  const { language } = useLanguage();

  return (
    <div className={className}>
      <h6 className="text-primary mb-3">
        {getTranslation('stepItinerary.example.title', language)}
      </h6>
      
      {/* Timeline Example */}
      <div className="position-relative">
        {/* Timeline line */}
        <div className="position-absolute" style={{ left: '67px', top: '5px', bottom: '0', width: '2px', backgroundColor: '#ff6b35', zIndex: 1 }}></div>
        
        {/* Timeline items */}
        <div className="ms-5">
          {/* Item 1 */}
          <div className="d-flex align-items-center mb-3">
            <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: '40px', height: '40px', fontSize: '14px', fontWeight: 'bold', zIndex: 2, position: 'relative' }}>
              <i className="fas fa-home"></i>
            </div>
            <div>
              <div className="fw-bold">Lugar de recogida: Edinburgh</div>
              <div className="text-muted small">Bus ride (1h30min)</div>
            </div>
          </div>
          
          {/* Item 2 */}
          <div className="d-flex align-items-center mb-3">
            <div className="bg-white border border-dark rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: '40px', height: '40px', zIndex: 2, position: 'relative' }}>
              <i className="fas fa-route text-dark"></i>
            </div>
            <div>
              <div className="fw-bold">Glencoe (Photo stop)</div>
            </div>
          </div>
          
          {/* Item 3 */}
          <div className="d-flex align-items-center mb-3">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: '40px', height: '40px', zIndex: 2, position: 'relative' }}>
              <i className="fas fa-star"></i>
            </div>
            <div>
              <div className="fw-bold">Loch Ness (Free time (3h))</div>
              <div className="ms-4 mt-1">
                <div className="d-flex align-items-center">
                  <div className="bg-white border border-dark rounded-circle d-flex align-items-center justify-content-center me-2" 
                       style={{ width: '20px', height: '20px', zIndex: 2, position: 'relative' }}>
                  </div>
                  <div className="text-muted small">Urquhart Castle (Guided visit (3h), Optional, Extra fee)</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Item 4 */}
          <div className="d-flex align-items-center mb-3">
            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: '40px', height: '40px', zIndex: 2, position: 'relative' }}>
              <i className="fas fa-star"></i>
            </div>
            <div>
              <div className="fw-bold">Pitlochry (Free time (3h))</div>
            </div>
          </div>
          
          {/* Item 5 */}
          <div className="d-flex align-items-center">
            <div className="bg-warning text-white rounded-circle d-flex align-items-center justify-content-center me-3" 
                 style={{ width: '40px', height: '40px', zIndex: 2, position: 'relative' }}>
              <i className="fas fa-home"></i>
            </div>
            <div>
              <div className="fw-bold">Regresa a: Edinburgh</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleItinerary;
