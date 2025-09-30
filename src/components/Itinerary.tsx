import React from 'react';

interface ItineraryItem {
  id: string;
  type: 'start' | 'end' | 'travel' | 'activity' | 'freetime';
  title: string;
  description: string;
  duration?: string;
  additionalFee?: boolean;
  location?: string;
}

interface ItineraryProps {
  items: ItineraryItem[];
}

const Itinerary: React.FC<ItineraryProps> = ({ items }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'start':
      case 'end':
        return (
          <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" 
               style={{ width: '40px', height: '40px', fontSize: '18px', fontWeight: 'bold' }}>
            G
          </div>
        );
      case 'travel':
        return (
          <div className="bg-secondary text-white rounded d-flex align-items-center justify-content-center" 
               style={{ width: '32px', height: '32px' }}>
            <i className="fas fa-bus"></i>
          </div>
        );
      case 'activity':
        return (
          <div className="bg-info text-white rounded-circle d-flex align-items-center justify-content-center" 
               style={{ width: '32px', height: '32px' }}>
            <i className="fas fa-map-marker-alt"></i>
          </div>
        );
      case 'freetime':
        return (
          <div className="border border-secondary rounded-circle d-flex align-items-center justify-content-center" 
               style={{ width: '32px', height: '32px' }}>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Left Panel - Itinerary Timeline */}
        <div className="col-lg-6">
          <h4 className="fw-bold mb-4">Itinerario</h4>
          <div className="position-relative">
            {/* Timeline Line */}
            <div className="position-absolute" style={{ left: '20px', top: '0', bottom: '0', width: '2px', backgroundColor: '#F54927' }}></div>
            
            {/* Timeline Items */}
            <div className="ps-5">
              {items.map((item, index) => (
                <div key={item.id} className="position-relative mb-4">
                  {/* Icon */}
                  <div className="position-absolute" style={{ left: '-30px', top: '0' }}>
                    {getIcon(item.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="ms-3">
                    <h6 className="fw-bold mb-1">{item.title}</h6>
                    <p className="text-muted mb-1">{item.description}</p>
                    {item.duration && (
                      <p className="text-muted small mb-1">{item.duration}</p>
                    )}
                    {item.additionalFee && (
                      <span className="badge bg-warning text-dark">Tarifa adicional</span>
                    )}
                    {item.location && (
                      <p className="text-muted small mb-0">{item.location}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="col-lg-6">
          <div className="position-relative">
            {/* Map Container */}
            <div className="bg-light rounded" style={{ height: '400px', position: 'relative' }}>
              {/* Map Placeholder - Replace with actual Google Maps integration */}
              <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <i className="fas fa-map fs-1 text-muted mb-3"></i>
                  <p className="text-muted">Mapa de Google Maps</p>
                  <small className="text-muted">Integración de Google Maps API</small>
                </div>
              </div>
              
              {/* Map Controls */}
              <div className="position-absolute top-0 start-0 m-2">
                <button className="btn btn-sm btn-dark">
                  Volver a centrar
                </button>
              </div>
              
              <div className="position-absolute top-0 end-0 m-2">
                <button className="btn btn-sm btn-light">
                  <i className="fas fa-expand-arrows-alt"></i>
                </button>
              </div>
              
              {/* Zoom Controls */}
              <div className="position-absolute bottom-0 end-0 m-2">
                <div className="btn-group-vertical">
                  <button className="btn btn-sm btn-light">
                    <i className="fas fa-plus"></i>
                  </button>
                  <button className="btn btn-sm btn-light">
                    <i className="fas fa-minus"></i>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Map Legend */}
            <div className="mt-3">
              <div className="d-flex align-items-center gap-3">
                <div className="d-flex align-items-center gap-2">
                  <i className="fas fa-map-marker-alt text-info"></i>
                  <small className="text-muted">Paradas principales</small>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <div className="border border-secondary rounded-circle" style={{ width: '16px', height: '16px' }}></div>
                  <small className="text-muted">Otras paradas</small>
                </div>
              </div>
            </div>
            
            {/* Google Attribution */}
            <div className="mt-2">
              <small className="text-muted">
                Datos del mapa ©2025 Google | Términos
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Itinerary; 