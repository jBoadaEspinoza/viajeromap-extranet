import React, { useState } from 'react';

interface Review {
  id: string;
  user: {
    name: string;
    country: string;
    initial: string;
    avatarColor: string;
  };
  rating: number;
  date: string;
  verified: boolean;
  text: string;
  images?: string[];
}

interface ReviewsProps {
  reviews: Review[];
}

const Reviews: React.FC<ReviewsProps> = ({ reviews }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [selectedTravelType, setSelectedTravelType] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');

  const getAvatarColor = (color: string) => {
    const colors: { [key: string]: string } = {
      orange: '#FF6B35',
      blue: '#4A90E2',
      green: '#7ED321',
      pink: '#FF69B4',
      darkBlue: '#2C3E50',
      purple: '#9B59B6',
      red: '#E74C3C',
      teal: '#1ABC9C'
    };
    return colors[color] || '#F54927';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <i 
        key={index} 
        className={`fas fa-star ${index < rating ? 'text-warning' : 'text-muted'}`}
        style={{ fontSize: '14px' }}
      ></i>
    ));
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTravelType = selectedTravelType === 'all' || true; // Add travel type logic if needed
    const matchesRating = selectedRating === 'all' || review.rating >= parseInt(selectedRating);
    
    return matchesSearch && matchesTravelType && matchesRating;
  });

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 5);

  return (
    <div className="container-fluid">
      <div className="row">
        {/* Left Sidebar - Filters */}
        <div className="col-lg-3">
          <div className="card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Filtro</h6>
              
              {/* Travel Types Filter */}
              <div className="mb-4">
                <h6 className="fw-bold mb-2">Todos los tipos de viaje</h6>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="allTypes"
                    checked={selectedTravelType === 'all'}
                    onChange={() => setSelectedTravelType('all')}
                  />
                  <label className="form-check-label" htmlFor="allTypes">
                    Todos los tipos de viaje
                  </label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="couples" />
                  <label className="form-check-label" htmlFor="couples">Parejas</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="friends" />
                  <label className="form-check-label" htmlFor="friends">Grupo de amigos</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="solo" />
                  <label className="form-check-label" htmlFor="solo">En solitario</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="family" />
                  <label className="form-check-label" htmlFor="family">En familia</label>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="mb-4">
                <h6 className="fw-bold mb-2">Por valoración</h6>
                <div className="form-check">
                  <input 
                    className="form-check-input" 
                    type="checkbox" 
                    id="allRatings"
                    checked={selectedRating === 'all'}
                    onChange={() => setSelectedRating('all')}
                  />
                  <label className="form-check-label" htmlFor="allRatings">
                    Todas las valoraciones
                  </label>
                </div>
                {[5, 4, 3, 2, 1].map(rating => (
                  <div key={rating} className="form-check">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id={`rating${rating}`}
                      checked={selectedRating === rating.toString()}
                      onChange={() => setSelectedRating(rating.toString())}
                    />
                    <label className="form-check-label d-flex align-items-center" htmlFor={`rating${rating}`}>
                      {rating} estrellas
                      <span className="ms-2">
                        {renderStars(rating)}
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content - Reviews */}
        <div className="col-lg-9">
          {/* Search and Sort */}
          <div className="mb-4">
            <div className="input-group mb-3">
              <span className="input-group-text">
                <i className="fas fa-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Buscar en reseñas (p. ej. guía)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="d-flex align-items-center">
              <label className="me-2 fw-bold">Ordenar por:</label>
              <select 
                className="form-select w-auto"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recommended">Recomendado</option>
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="rating">Mejor valorados</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div className="reviews-list">
            {displayedReviews.map((review) => (
              <div key={review.id} className="border-bottom pb-4 mb-4">
                <div className="d-flex align-items-start">
                  {/* Avatar */}
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      backgroundColor: getAvatarColor(review.user.avatarColor),
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {review.user.initial}
                  </div>

                  {/* Review Content */}
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-2">
                      <div className="me-2">
                        {renderStars(review.rating)}
                      </div>
                      <span className="fw-bold me-2">{review.user.name}</span>
                      <span className="text-muted">- {review.user.country}</span>
                    </div>
                    
                    <div className="d-flex align-items-center mb-2">
                      <small className="text-muted me-2">{review.date}</small>
                      {review.verified && (
                        <span className="badge bg-success">Reserva verificada</span>
                      )}
                    </div>

                    <p className="mb-2">{review.text}</p>
                    
                    {review.images && review.images.length > 0 && (
                      <div className="d-flex gap-2 mb-2">
                        {review.images.map((image, index) => (
                          <img 
                            key={index}
                            src={image}
                            alt={`Review image ${index + 1}`}
                            className="rounded"
                            style={{ width: '80px', height: '60px', objectFit: 'cover' }}
                          />
                        ))}
                      </div>
                    )}

                    <button className="btn btn-link p-0 text-decoration-none">
                      Ver más
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {filteredReviews.length > 5 && (
            <div className="text-center mt-4">
              <button 
                className="btn btn-primary"
                onClick={() => setShowAllReviews(!showAllReviews)}
              >
                {showAllReviews ? 'Ver menos reseñas' : 'Ver más reseñas'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews; 