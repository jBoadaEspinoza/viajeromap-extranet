import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { placesApi, type PlaceInfoResponse } from '../api/places';
export interface DestinationCardData {
  id: number;
  cityName: string;
  countryId: string;
  latitude: number;
  longitude: number;
  active: boolean;
  activityCount: number;
  imageUrl?: string;
}

export interface DestinationCardProps {
  destination: DestinationCardData;
  columns?: 1 | 2 | 3 | 4 | 6 | 12;
  variant?: 'default' | 'compact';
  showDetailsButton?: boolean;
  detailsButtonText?: string;
  onDetailsClick?: (id: number) => void;
  className?: string;
}

const DestinationCard: React.FC<DestinationCardProps> = ({
  destination,
  columns = 4,
  variant = 'default',
  showDetailsButton = true,
  detailsButtonText,
  onDetailsClick,
  className = ''
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  
  // Estados para información de IA
  const [placeInfo, setPlaceInfo] = useState<PlaceInfoResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Función para obtener información de IA del destino
  const fetchPlaceInfo = useCallback(async () => {
    if (!destination.id) {
      console.log('No hay ID para el destino:', destination.cityName);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const info = await placesApi.getInfoByIA(destination.id, language);
      setPlaceInfo(info);
      
    } catch (err: any) {
      console.error('❌ Error obteniendo información de IA:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [destination.id, destination.cityName, language]);

  // Efecto para cargar información cuando el componente se monta
  useEffect(() => {
    fetchPlaceInfo();
  }, [fetchPlaceInfo]);

  const getColumnClass = () => {
    const columnMap: Record<number, string> = {
      1: 'col-12',
      2: 'col-md-6',
      3: 'col-md-6 col-lg-4',
      4: 'col-md-6 col-lg-3',
      6: 'col-md-4 col-lg-2',
      12: 'col-12'
    };
    return columnMap[columns] || 'col-md-6 col-lg-4';
  };

  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick(destination.id);
    } else {
      // Navegar a la página de búsqueda con el destino seleccionado
      const params = new URLSearchParams();
      params.append('destination', destination.cityName);
      navigate(`/search?${params.toString()}`);
    }
  };

  const renderDefaultCard = () => (
    <div className={`card h-100 shadow-lg border-0 rounded-3 overflow-hidden position-relative hover-lift ${className}`}>
      <div className="position-relative">
        <img
          src={destination.imageUrl || `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop`}
          alt={getTranslation(`destination.${destination.cityName}`, language)}
          className="card-img-top"
          style={{ height: '220px', objectFit: 'cover' }}
        />
        <div className="position-absolute top-0 end-0 m-3">
          <span className="badge bg-white text-dark shadow-sm fw-bold px-3 py-2">
            {destination.activityCount} actividades
          </span>
        </div>
        <div className="position-absolute bottom-0 start-0 m-3">
          <span className="badge bg-primary fw-bold px-3 py-2">
            {getTranslation(`destination.${destination.cityName}`, language)}
          </span>
        </div>
      </div>
      <div className="card-body d-flex flex-column p-4">
        <div className="mb-3">
          <h5 className="card-title fw-bold mb-2 text-dark" style={{ fontSize: '1.1rem', lineHeight: '1.3' }}>
            {getTranslation(`destination.${destination.cityName}`, language)}
          </h5>
          
          {/* Información de IA */}
          {placeInfo && (
            <div className="mb-3">
              <p className="small text-muted mb-2" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                {placeInfo.description}
              </p>
              
              {/* Temperatura actual */}
              <div className="d-flex align-items-center mb-2">
                <svg className="text-info me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <div className="small">
                  <span className="fw-medium text-dark">{placeInfo.currentTemperature}</span>
                  <span className="text-muted ms-2">Temperatura actual</span>
                </div>
              </div>
              
              {/* Puntos de interés */}
              {placeInfo.pointsOfInterest && placeInfo.pointsOfInterest.length > 0 && (
                <div className="mb-2">
                  <small className="text-muted d-block mb-1">Puntos de interés:</small>
                  <div className="d-flex flex-wrap gap-1">
                    {placeInfo.pointsOfInterest.slice(0, 5).map((point, index) => (
                      <span key={index} className="badge bg-light text-dark border small">
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Indicador de carga */}
          {loading && (
            <div className="d-flex align-items-center mb-2">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <small className="text-muted">Cargando información...</small>
            </div>
          )}
          
          {/* Mostrar error si hay */}
          {error && (
            <div className="alert alert-warning alert-sm mb-2">
              <small>{error}</small>
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-3">
          {showDetailsButton && (
            <button 
              className="btn btn-primary fw-bold px-4 py-2 rounded-pill w-100"
              onClick={handleDetailsClick}
            >
              {detailsButtonText || getTranslation('common.viewDetails', language)}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderCompactCard = () => (
    <div className={`card h-100 shadow-sm border-0 rounded-3 overflow-hidden ${className}`}>
      <div className="position-relative">
        <img
          src={destination.imageUrl || `https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop`}
          alt={getTranslation(`destination.${destination.cityName}`, language)}
          className="card-img-top"
          style={{ height: '180px', objectFit: 'cover' }}
        />
        <div className="position-absolute top-0 end-0 m-2">
          <span className="badge bg-white text-dark shadow-sm fw-bold px-2 py-1">
            {destination.activityCount}
          </span>
        </div>
      </div>
      <div className="card-body p-3">
        <div className="mb-2">
          <h6 className="card-title fw-bold mb-2" style={{ fontSize: '0.95rem' }}>
            {getTranslation(`destination.${destination.cityName}`, language)}
          </h6>
          <small className="text-muted">{destination.activityCount} actividades</small>
        </div>
        {showDetailsButton && (
          <button 
            className="btn btn-primary btn-sm w-100"
            onClick={handleDetailsClick}
          >
            {detailsButtonText || 'Ver'}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={getColumnClass()}>
      {variant === 'compact' && renderCompactCard()}
      {variant === 'default' && renderDefaultCard()}
    </div>
  );
};

export default DestinationCard; 