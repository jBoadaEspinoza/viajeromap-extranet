import React from 'react';
import ActivityCard from './ActivityCard';
import type { ActivityCardData } from './ActivityCard';

export interface ActivityGridProps {
  activities: ActivityCardData[];
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  variant?: 'default' | 'horizontal' | 'compact';
  showDetailsButton?: boolean;
  detailsButtonText?: string;
  onDetailsClick?: (id: string) => void;
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

const ActivityGrid: React.FC<ActivityGridProps> = ({
  activities,
  columns = 3,
  variant = 'default',
  showDetailsButton = true,
  detailsButtonText,
  onDetailsClick,
  className = '',
  emptyMessage = 'No se encontraron actividades.',
  loading = false
}) => {
  const getColumnClass = () => {
    const columnMap: Record<number, string> = {
      1: '12',
      2: '6',
      3: '4',
      4: '3',
      6: '2',
      12: '1'
    };
    return columnMap[columns] || '4';
  };
  if (loading) {
    return (
      <div className={`row g-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className={`col-${getColumnClass()}`}>
            <div className="card h-100">
              <div className="card-img-top bg-light" style={{ height: '200px' }}>
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div className="placeholder-glow">
                  <span className="placeholder col-8 placeholder-lg"></span>
                  <div className="mt-2">
                    <span className="placeholder col-6"></span>
                  </div>
                  <div className="mt-2">
                    <span className="placeholder col-4"></span>
                  </div>
                </div>
              </div>
              <div className="card-footer bg-transparent">
                <div className="placeholder-glow">
                  <span className="placeholder col-12 placeholder-lg"></span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <p className="text-muted lead">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`row g-4 ${className}`}>
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
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

export default ActivityGrid; 