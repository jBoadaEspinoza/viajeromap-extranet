import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { getTranslation } from '../utils/translations';
import type { BookingOption } from '../api/activities';

export interface ActivityCardData {
  id: string;
  title: string;
  name?: string; // Para compatibilidad con datos existentes
  imageUrl?: string; // URL de la imagen principal
  image?: string; // Para compatibilidad con datos existentes
  price: number | string;
  duration?: string;
  durationDays?: number;
  durationHours?: number; // Horas de duración
  durationMinutes?: number; // Minutos de duración
  destination?: string; // Destino de la actividad
  location?: string; // Para compatibilidad con datos existentes
  category?: string; // Categoría/Destino de la actividad
  description?: string;
  presentation?: string;
  rating: number | null;
  reviewCount?: number; // Para compatibilidad con el nuevo nombre
  reviews?: number; // Para compatibilidad con datos existentes
  highlights?: string[];
  includes?: string[];
  currency?: string;
  pricingMode?: 'PER_PERSON' | 'PER_GROUP';
  bookingOptions?: BookingOption[]; // Opciones de booking para calcular precio mínimo
}

export interface ActivityCardProps {
  activity: ActivityCardData;
  columns?: 1 | 2 | 3 | 4 | 6 | 12; // Número de columnas de Bootstrap
  variant?: 'default' | 'horizontal' | 'compact';
  showDetailsButton?: boolean;
  detailsButtonText?: string;
  onDetailsClick?: (id: string) => void;
  className?: string;
  showFromPrice?: boolean; // Prop para controlar si mostrar "Desde" o precio directo
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  columns = 4,
  variant = 'default',
  showDetailsButton = true,
  detailsButtonText,
  onDetailsClick,
  className = '',
  showFromPrice = true // Por defecto mostrar "Desde"
}) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const [searchParams] = useSearchParams();
  const [showAllHighlights, setShowAllHighlights] = React.useState(false);

  const getCurrencySymbol = () => {
    return currency === 'PEN' ? 'S/ ' : '$ ';
  };

  // Función para formatear la duración omitiendo valores en cero
  const getFormattedDuration = () => {
    // Si hay duration como string, intentar parsearlo y limpiar valores en cero
    if (activity.duration) {
      // Parsear string como "0h 45min" o "2h 0min" y limpiar valores en cero
      const durationStr = activity.duration.toLowerCase();
      const parts: string[] = [];

      // Buscar días
      const dayMatch = durationStr.match(/(\d+)d/);
      if (dayMatch && parseInt(dayMatch[1]) > 0) {
        parts.push(`${dayMatch[1]}d`);
      }
      
      // Buscar horas
      const hourMatch = durationStr.match(/(\d+)h/);
      if (hourMatch && parseInt(hourMatch[1]) > 0) {
        parts.push(`${hourMatch[1]}h`);
      }
      
      // Buscar minutos
      const minuteMatch = durationStr.match(/(\d+)min/);
      if (minuteMatch && parseInt(minuteMatch[1]) > 0) {
        parts.push(`${minuteMatch[1]}min`);
      }
      
      return parts.length > 0 ? parts.join(' ') : '';
    }

    // Si hay durationHours y durationMinutes, formatear desde ahí
    if (activity.durationHours !== undefined || activity.durationMinutes !== undefined) {
      const parts: string[] = [];
      if (activity.durationDays && activity.durationDays > 0) {
        parts.push(`${activity.durationDays}d`);
      }

      if (activity.durationHours && activity.durationHours > 0) {
        parts.push(`${activity.durationHours}h`);
      }
      
      if (activity.durationMinutes && activity.durationMinutes > 0) {
        parts.push(`${activity.durationMinutes}m`);
      }
      
      return parts.length > 0 ? parts.join(' ') : '';
    }

    // Si hay bookingOptions, obtener la duración mínima
    if (activity.bookingOptions && activity.bookingOptions.length > 0) {
      const activeOptions = activity.bookingOptions.filter(option => option.isActive);
      if (activeOptions.length > 0) {
        const minDurationOption = activeOptions.reduce((min, option) => {
          const totalMinutes = (option.durationHours * 60) + option.durationMinutes;
          const minTotalMinutes = (min.durationHours * 60) + min.durationMinutes;
          return totalMinutes < minTotalMinutes ? option : min;
        });
        
        const parts: string[] = [];
        
        if (minDurationOption.durationHours > 0) {
          parts.push(`${minDurationOption.durationHours}h`);
        }
        
        if (minDurationOption.durationMinutes > 0) {
          parts.push(`${minDurationOption.durationMinutes}m`);
        }
        
        return parts.length > 0 ? parts.join(' ') : '';
      }
    }

    return '';
  };

  // Función para calcular el precio mínimo desde las opciones de booking
  const getMinimumPrice = () => {
    // Si hay opciones de booking activas, obtener el precio mínimo
    if (activity.bookingOptions && activity.bookingOptions.length > 0) {
      const activeOptions = activity.bookingOptions.filter(option => option.isActive);
      if (activeOptions.length > 0) {
        // Verificar si alguna opción tiene pricingMode PER_PERSON
        const hasPerPersonPricing = activeOptions.some(option => option.pricingMode === 'PER_PERSON');
        
        if (hasPerPersonPricing) {
          // Si hay opciones con PER_PERSON, obtener el precio desde priceTiers
          const minPriceFromTiers = Math.min(...activeOptions.map(option => {
            if (option.pricingMode === 'PER_PERSON' && option.priceTiers && option.priceTiers.length > 0) {
              // Obtener el precio mínimo por participante desde todos los tiers
              return Math.min(...option.priceTiers.map(tier => tier.pricePerParticipant));
            }
            // Fallback al pricePerPerson si no hay priceTiers
            return option.pricePerPerson || 0;
          }));
          return minPriceFromTiers > 0 ? minPriceFromTiers : null;
        } else {
          // Para otros modos de pricing, usar pricePerPerson directamente
          const minPrice = Math.min(...activeOptions.map(option => option.pricePerPerson));
          return minPrice > 0 ? minPrice : null;
        }
      }
    }
    
    // Si no hay opciones de booking o están inactivas, usar el precio directo
    if (typeof activity.price === 'number' && activity.price > 0) {
      return activity.price;
    }
    
    // También manejar si price es string
    if (typeof activity.price === 'string') {
      const priceNum = parseFloat(activity.price);
      return !isNaN(priceNum) && priceNum > 0 ? priceNum : null;
    }
    
    // Si no hay precio válido, retornar null para no mostrar precio
    return null;
  };

  // Función para obtener el texto "Desde" según el idioma
  const getFromText = () => {
    return language === 'es' ? 'Desde ' : 'From ';
  };

  // Función para formatear el precio con "Desde" si es necesario
  const getFormattedPrice = () => {
    const minPrice = getMinimumPrice();
    
    // Debug: mostrar información del precio
    console.log('Activity price debug:', {
      id: activity.id,
      title: activity.title || activity.name,
      price: activity.price,
      minPrice,
      bookingOptions: activity.bookingOptions?.length || 0,
      activeOptions: activity.bookingOptions?.filter(option => option.isActive).length || 0,
      pricingModes: activity.bookingOptions?.map(option => option.pricingMode) || [],
      priceTiers: activity.bookingOptions?.map(option => option.priceTiers?.length || 0) || []
    });
    
    // Si no hay precio válido, no mostrar nada
    if (minPrice === null) {
      return '';
    }
    
    const priceText = `${getCurrencySymbol()}${minPrice}`;
    
    // Mostrar "Desde" solo si hay opciones de booking activas
    if (showFromPrice && activity.bookingOptions && activity.bookingOptions.length > 0) {
      const activeOptions = activity.bookingOptions.filter(option => option.isActive);
      if (activeOptions.length > 0) {
        return `${getFromText()}${priceText}`;
      }
    }
    
    return priceText;
  };

  const handleDetailsClick = () => {
    if (onDetailsClick) {
      onDetailsClick(activity.id);
    } else {
      // Construir URL con parámetros de búsqueda
      const params = new URLSearchParams();
      
      // Agregar parámetros de búsqueda si existen
      const date = searchParams.get('date');
      const destination = searchParams.get('destination');
      const adults = searchParams.get('adults');
      const children = searchParams.get('children');
      
      if (date) params.append('date', date);
      if (destination) params.append('destination', destination);
      if (adults) params.append('adults', adults);
      if (children) params.append('children', children);
      
      const queryString = params.toString();
      const url = `/activity/${activity.id}${queryString ? `?${queryString}` : ''}`;
      
      navigate(url);
    }
  };

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

  const renderDefaultCard = () => (
    <div 
      className={`card h-100 shadow-lg border-0 rounded-3 overflow-hidden position-relative hover-lift ${className}`}
      onClick={handleDetailsClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="position-relative">
        <img
          src={activity.imageUrl || activity.image}
          alt={activity.title || activity.name}
          className="card-img-top"
          style={{ height: '220px', objectFit: 'cover' }}
        />

        {getFormattedDuration() && (
          <div className="position-absolute top-0 start-0 m-3">
            <span className="badge bg-primary fw-bold px-3 py-2">
              <svg className="me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {getFormattedDuration()}
            </span>
          </div>
        )}
        {getFormattedPrice() && <div className="position-absolute bottom-0 end-0 m-3">
          <div className="d-flex align-items-center text-white">
            <svg className="text-warning me-1" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="fw-bold text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
              {getMinimumPrice()} 
            </span>
          </div>
        </div>}
      </div>
      <div className="card-body d-flex flex-column p-4">
        <div className="mb-3">
          <h5 className="card-title fw-bold mb-2 text-dark" style={{ fontSize: '1.1rem', lineHeight: '1.3' }}>
            {activity.title || activity.name}
          </h5>
          <div className="d-flex gap-2">
            {activity.category && (
              <span className="badge bg-outline-primary text-primary fw-medium px-2 py-1">
                {activity.category}
              </span>
            )}
          </div>
        </div>
        {(activity.description || activity.presentation) && (
          <p className="text-muted small mb-3" style={{ lineHeight: '1.4' }}>
            {activity.description || activity.presentation}
          </p>
        )}
        {activity.rating || activity.rating!==0 && (
          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <svg className="text-warning me-1" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="fw-medium me-1">
                {activity.rating}
              </span>
              <small className="text-muted">
                ({(activity.reviewCount || activity.reviews || 0).toLocaleString()} reseñas)
              </small>
            </div>
          </div>
        )}
        {(activity.includes && activity.includes.length > 0) && (
           <div className="mb-4">
             <small className="text-muted mb-2 d-block fw-medium">Incluye:</small>
             <div className="d-flex flex-wrap gap-2">
               {activity.includes.slice(0, showAllHighlights ? undefined : 2).map((include, index) => (
                 <span key={index} className="badge bg-primary bg-opacity-10 text-primary fw-medium px-2 py-1" style={{ fontSize: '0.65rem', lineHeight: '1.2', whiteSpace: 'normal', wordWrap: 'break-word', minHeight: '1.8rem', display: 'inline-block' }}>
                   {include}
                 </span>
               ))}
                                                           {activity.includes && activity.includes.length > 2 && !showAllHighlights && (
                 <button 
                   className="btn btn-link btn-sm fw-medium px-3 py-1"
                   onClick={(e) => {
                     e.stopPropagation();
                     setShowAllHighlights(true);
                   }}
                   style={{ fontSize: '0.65rem' }}
                 >
                   {getTranslation('activities.showMore', language)}
                 </button>
               )}
               {activity.includes && activity.includes.length > 2 && showAllHighlights && (
                 <button 
                   className="btn btn-link btn-sm fw-medium px-3 py-1"
                   onClick={(e) => {
                     e.stopPropagation();
                     setShowAllHighlights(false);
                   }}
                   style={{ fontSize: '0.65rem' }}
                 >
                   {getTranslation('activities.showLess', language)}
                 </button>
               )}
            </div>
          </div>
        )}
          <div className="mt-auto pt-3 border-top">
           <div className="d-flex justify-content-between align-items-center mb-2">
             <div>
                 {getFormattedPrice() && (
                   <>
                     <span className="h4 fw-bold text-primary mb-0">
                       {getFormattedPrice()}
                     </span>
                     <div className="small text-muted">
                       {activity.pricingMode === 'PER_PERSON' 
                         ? getTranslation('activity.pricePerPerson', language)
                         : getTranslation('detail.perPerson', language)
                       }
                     </div>
                   </>
                 )}
             </div>
           </div>
         </div>
      </div>
    </div>
  );

  const renderHorizontalCard = () => (
    <div 
      className={`card shadow-sm border-0 ${className}`}
      onClick={handleDetailsClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="row g-0">
        <div className="col-md-4">
          <img
            src={activity.imageUrl || activity.image}
            alt={activity.title || activity.name}
            className="card-img-top"
            style={{ height: '250px', objectFit: 'cover' }}
          />
        </div>
        <div className="col-md-8">
          <div className="card-body">
                    <div className="mb-2">
          <h5 className="card-title fw-bold mb-2 font-montserrat text-midnightblue">
            {activity.title || activity.name}
          </h5>
          {activity.category && (
            <span className="badge bg-outline-primary text-primary fw-medium px-2 py-1">
              {activity.category}
            </span>
          )}
        </div>
            {(activity.description || activity.presentation) && (
              <p className="text-muted mb-3">
                {activity.description || activity.presentation}
              </p>
            )}
                         {(activity.highlights || activity.includes) && (
               <div className="mb-3">
                 <small className="text-muted mb-2 d-block">{getTranslation('search.includes', language)}:</small>
                 <div className="d-flex flex-wrap gap-1">
                   {(activity.highlights || activity.includes || []).slice(0, 3).map((item: string, index: number) => (
                     <span key={index} className="badge bg-outline-dark text-black me-1 mb-1" style={{ fontSize: '0.7rem', lineHeight: '1.2', whiteSpace: 'normal', wordWrap: 'break-word', minHeight: '1.6rem', display: 'inline-block' }}>
                       {item}
                     </span>
                   ))}
                 </div>
               </div>
             )}
                         <div className="d-flex justify-content-between align-items-center">
               <div>
                  {getFormattedPrice() && (
                    <>
                      <span className="h5 fw-bold text-primary mb-0">
                        {getFormattedPrice()}
                      </span>
                      <div className="small text-muted">
                        {activity.pricingMode === 'PER_PERSON' 
                          ? getTranslation('activity.pricePerPerson', language)
                          : getTranslation('detail.perPerson', language)
                        }
                      </div>
                    </>
                  )}
               </div>
              {showDetailsButton && (
                <button 
                  className="btn btn-primary"
                  onClick={handleDetailsClick}
                >
                  {detailsButtonText || getTranslation('search.viewDetails', language)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompactCard = () => (
    <div 
      className={`card h-100 shadow-sm border-0 rounded-3 overflow-hidden ${className}`}
      onClick={handleDetailsClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="position-relative">
        <img
          src={activity.imageUrl || activity.image}
          alt={activity.title || activity.name}
          className="card-img-top"
          style={{ height: '180px', objectFit: 'cover' }}
        />
                 <div className="position-absolute top-0 end-0 m-2">
                      {getFormattedPrice() && (
                        <span className="badge bg-white text-dark shadow-sm fw-bold px-2 py-1">
                          {getFormattedPrice()}
                        </span>
                      )}
         </div>
      </div>
              <div className="card-body p-3">
          <div className="mb-2">
            <h6 className="card-title fw-bold mb-2" style={{ fontSize: '0.95rem' }}>
              {activity.title || activity.name}
            </h6>
            {activity.category && (
              <span className="badge bg-outline-primary text-primary fw-medium px-1 py-1" style={{ fontSize: '0.7rem' }}>
                {activity.category}
              </span>
            )}
          </div>
        <div className="d-flex justify-content-between align-items-center">
          {activity.rating && (
          <div className="d-flex align-items-center">
            <svg className="text-warning me-1" width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <small className="text-muted">{activity.rating}</small>
          </div>)}
          {showDetailsButton && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleDetailsClick}
            >
              {detailsButtonText || 'Ver'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={getColumnClass()}>
      {variant === 'horizontal' && renderHorizontalCard()}
      {variant === 'compact' && renderCompactCard()}
      {variant === 'default' && renderDefaultCard()}
    </div>
  );
};

export default ActivityCard;
