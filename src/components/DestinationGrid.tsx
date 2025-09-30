import React from 'react';
import DestinationCard, { type DestinationCardData } from './DestinationCard';

export interface DestinationGridProps {
  destinations: DestinationCardData[];
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  variant?: 'default' | 'compact';
  showDetailsButton?: boolean;
  detailsButtonText?: string;
  onDetailsClick?: (id: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  className?: string;
}

const DestinationGrid: React.FC<DestinationGridProps> = ({
  destinations,
  columns = 3,
  variant = 'default',
  showDetailsButton = true,
  detailsButtonText,
  onDetailsClick,
  emptyMessage = 'No se encontraron destinos.',
  loading = false,
  className = ''
}) => {
  if (loading) {
    return (
      <div className="row g-4">
        {Array.from({ length: columns }, (_, index) => (
          <div key={index} className="col-12">
            <div className="card h-100 shadow-sm border-0 rounded-3 overflow-hidden">
              <div className="card-img-top bg-light" style={{ height: '220px' }}>
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              </div>
              <div className="card-body p-4">
                <div className="placeholder-glow">
                  <h5 className="card-title placeholder col-8"></h5>
                  <p className="card-text placeholder col-6"></p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="mb-3">
          <svg className="text-muted" width="64" height="64" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        </div>
        <h5 className="text-muted">{emptyMessage}</h5>
      </div>
    );
  }

  return (
    <div className={`row g-4 ${className}`}>
      {destinations.map((destination) => (
        <DestinationCard
          key={destination.id}
          destination={destination}
          columns={columns}
          variant={variant}
          showDetailsButton={showDetailsButton}
          detailsButtonText={detailsButtonText}
          onDetailsClick={onDetailsClick}
        />
      ))}
    </div>
  );
};

export default DestinationGrid; 