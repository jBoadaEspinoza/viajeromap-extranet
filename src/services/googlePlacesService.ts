// Google Maps types declaration
declare global {
  interface Window {
    google: any;
  }
}

// Google Places Service for Points of Interest
export interface PointOfInterest {
  place_id: string;
  name: string;
  formatted_address: string;
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  destinationId?: number; // ID of the destination where this POI was selected
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
    language: string;
  }>;
}

export interface PlacesSearchResponse {
  results: PointOfInterest[];
  status: string;
  next_page_token?: string;
}

class GooglePlacesService {
  private apiKey: string;
  private service: any = null;
  private map: any = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Helper method to filter out hotels and travel agencies
  private filterTouristActivities(pois: PointOfInterest[]): PointOfInterest[] {
    return pois.filter(poi => {
      const types = poi.types || [];
      
      // Exclude non-tourist activity types
      const excludeTypes = [
        // Lodging
        'lodging', 'hotel', 'accommodation', 'hostel', 'motel', 'inn', 
        'guesthouse', 'bed_and_breakfast', 'resort', 'villa', 'apartment',
        'rental', 'property', 'real_estate', 'housing', 'residence',
        'dormitory', 'boarding', 'timeshare', 'vacation_rental',
        
        // Travel agencies and booking
        'travel_agency', 'travel_agent', 'tour_operator', 'booking',
        'reservation', 'travel_advisor', 'travel_consultant',
        
        // Restaurants and food (unless they are tourist attractions)
        'restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'cafe',
        'bakery', 'bar', 'night_club', 'liquor_store', 'grocery_or_supermarket',
        'supermarket', 'convenience_store', 'shopping_mall', 'store',
        
        // Services not related to tourist activities
        'bank', 'atm', 'hospital', 'pharmacy', 'gas_station', 'car_repair',
        'car_wash', 'laundry', 'post_office', 'police', 'fire_station',
        'embassy', 'local_government_office', 'insurance_agency',
        'real_estate_agency', 'lawyer', 'accountant', 'dentist', 'doctor',
        'veterinary_care', 'funeral_home', 'cemetery', 'church', 'mosque',
        'synagogue', 'hindu_temple', 'buddhist_temple', 'place_of_worship',
        
        // Transportation (unless tourist-related)
        'bus_station', 'subway_station', 'train_station', 'airport',
        'taxi_stand', 'car_rental', 'parking', 'gas_station',
        
        // Shopping (unless tourist attraction)
        'shopping_mall', 'store', 'clothing_store', 'shoe_store',
        'electronics_store', 'furniture_store', 'home_goods_store',
        'jewelry_store', 'bicycle_store', 'book_store', 'pet_store',
        'hardware_store', 'department_store', 'grocery_or_supermarket'
      ];
      
      // Check if any type matches excluded types
      const hasExcludedType = types.some(type => 
        excludeTypes.some(excludedType => type.includes(excludedType))
      );
      
      if (hasExcludedType) {
        return false;
      }
      
      // Only include specific tourist activity types
      const touristActivityTypes = [
        'tourist_attraction', 'amusement_park', 'aquarium', 'art_gallery',
        'bowling_alley', 'campground', 'casino', 'gym', 'hiking_area',
        'museum', 'park', 'spa', 'stadium', 'zoo', 'beach', 'water_park',
        'theme_park', 'cultural_center', 'theater', 'concert_hall',
        'sports_complex', 'recreation_center', 'natural_feature',
        'historical_landmark', 'monument', 'memorial', 'palace',
        'castle', 'ruins', 'archaeological_site', 'religious_site',
        'shrine', 'temple', 'cathedral', 'basilica', 'monastery',
        'observatory', 'planetarium', 'science_museum', 'art_museum',
        'history_museum', 'botanical_garden', 'zoo', 'wildlife_park',
        'national_park', 'state_park', 'nature_reserve', 'forest',
        'mountain', 'volcano', 'cave', 'waterfall', 'lake', 'river',
        'canyon', 'desert', 'glacier', 'island', 'peninsula',
        'beach', 'coast', 'shore', 'cliff', 'valley', 'plateau',
        'adventure_sports', 'extreme_sports', 'water_sports',
        'winter_sports', 'summer_sports', 'outdoor_activities',
        'hiking', 'climbing', 'cycling', 'running', 'walking',
        'swimming', 'diving', 'surfing', 'kayaking', 'canoeing',
        'rafting', 'fishing', 'hunting', 'camping', 'picnic',
        'photography', 'bird_watching', 'wildlife_viewing',
        'stargazing', 'sunset_viewing', 'sunrise_viewing',
        'scenic_drive', 'scenic_railway', 'cable_car', 'gondola',
        'ferris_wheel', 'roller_coaster', 'carousel', 'merry_go_round',
        'arcade', 'game_center', 'escape_room', 'laser_tag',
        'paintball', 'mini_golf', 'golf_course', 'tennis_court',
        'basketball_court', 'soccer_field', 'baseball_field',
        'swimming_pool', 'ice_skating', 'skating_rink', 'bowling',
        'billiards', 'pool_hall', 'dart', 'arcade', 'video_game',
        'board_game', 'card_game', 'puzzle', 'trivia', 'quiz',
        'karaoke', 'dance', 'dancing', 'music', 'concert', 'show',
        'performance', 'theater', 'opera', 'ballet', 'dance_show',
        'comedy_show', 'magic_show', 'circus', 'carnival', 'fair',
        'festival', 'celebration', 'parade', 'march', 'rally',
        'demonstration', 'protest', 'strike', 'lockout', 'boycott',
        'petition', 'campaign', 'election', 'vote', 'polling',
        'census', 'survey', 'research', 'study', 'experiment',
        'test', 'exam', 'quiz', 'contest', 'competition', 'tournament',
        'championship', 'league', 'season', 'playoff', 'final',
        'semifinal', 'quarterfinal', 'round', 'match', 'game',
        'event', 'meeting', 'conference', 'convention', 'summit',
        'workshop', 'seminar', 'lecture', 'presentation', 'talk',
        'discussion', 'debate', 'forum', 'panel', 'roundtable',
        'symposium', 'colloquium', 'congress', 'assembly', 'gathering',
        'reunion', 'party', 'celebration', 'anniversary', 'birthday',
        'wedding', 'graduation', 'promotion', 'retirement', 'farewell',
        'welcome', 'introduction', 'orientation', 'training', 'course',
        'class', 'lesson', 'tutorial', 'guide', 'instruction', 'coaching',
        'mentoring', 'tutoring', 'teaching', 'education', 'learning',
        'study', 'research', 'investigation', 'exploration', 'discovery',
        'adventure', 'expedition', 'journey', 'trip', 'travel', 'tour',
        'excursion', 'outing', 'visit', 'sightseeing', 'exploration',
        'discovery', 'adventure', 'experience', 'activity', 'entertainment',
        'recreation', 'leisure', 'hobby', 'pastime', 'interest', 'passion'
      ];
      
      // Check if any type matches tourist activity types
      const hasTouristActivityType = types.some(type => 
        touristActivityTypes.some(activityType => type.includes(activityType))
      );
      
      return hasTouristActivityType;
    });
  }

  // Initialize the service with a map
  initialize(mapElement: HTMLElement, center: { lat: number; lng: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps API not loaded'));
        return;
      }

      this.map = new (window as any).google.maps.Map(mapElement, {
        center,
        zoom: 12,
        mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP
      });

      this.service = new (window as any).google.maps.places.PlacesService(this.map);
      resolve();
    });
  }

  // Search for points of interest near a location
  async searchNearby(
    location: { lat: number; lng: number },
    radius: number = 5000,
    types: string[] = [
      'tourist_attraction',       // Atracciones turísticas
      'amusement_park',           // Parques de diversiones
      'aquarium',                 // Acuarios
      'art_gallery',              // Galerías de arte
      'museum',                   // Museos
      'park',                     // Parques
      'zoo',                      // Zoológicos
      'beach',                    // Playas
      'water_park',              // Parques acuáticos
      'theme_park',              // Parques temáticos
      'cultural_center',         // Centros culturales
      'theater',                 // Teatros
      'concert_hall',            // Salas de conciertos
      'sports_complex',          // Complejos deportivos
      'recreation_center',       // Centros recreativos
      'natural_feature',         // Características naturales
      'historical_landmark',     // Monumentos históricos
      'monument',                // Monumentos
      'memorial',                // Memoriales
      'palace',                  // Palacios
      'castle',                  // Castillos
      'ruins',                   // Ruinas
      'archaeological_site',     // Sitios arqueológicos
      'botanical_garden',        // Jardines botánicos
      'wildlife_park',           // Parques de vida silvestre
      'national_park',           // Parques nacionales
      'state_park',              // Parques estatales
      'nature_reserve',          // Reservas naturales
      'mountain',                // Montañas
      'volcano',                 // Volcanes
      'cave',                    // Cuevas
      'waterfall',               // Cascadas
      'lake',                    // Lagos
      'river',                   // Ríos
      'canyon',                  // Cañones
      'desert',                  // Desiertos
      'island',                  // Islas
      'peninsula',               // Penínsulas
      'coast',                   // Costas
      'shore',                   // Orillas
      'cliff',                   // Acantilados
      'valley',                  // Valles
      'plateau'                  // Mesetas
    ]
  ): Promise<PointOfInterest[]> {
    return new Promise((resolve, reject) => {
      if (!this.service) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request: any = {
        location: new (window as any).google.maps.LatLng(location.lat, location.lng),
        radius,
        type: types.join('|')
      };

      this.service.nearbySearch(request, (results: any, status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
          const pois: PointOfInterest[] = results.map((place: any) => ({
            place_id: place.place_id || '',
            name: place.name || '',
            formatted_address: place.vicinity || place.formatted_address || '',
            types: place.types || [],
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              }
            },
            photos: place.photos?.map((photo: any) => ({
              photo_reference: photo.getUrl({ maxWidth: 400, maxHeight: 400 }),
              height: photo.height,
              width: photo.width
            }))
          }));
          resolve(pois);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  // Search for places by text query
  async searchByText(
    query: string,
    location?: { lat: number; lng: number },
    radius?: number
  ): Promise<PointOfInterest[]> {
    return new Promise((resolve, reject) => {
      if (!this.service) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request: any = {
        query,
        ...(location && radius && {
          location: new (window as any).google.maps.LatLng(location.lat, location.lng),
          radius
        })
      };

      this.service.textSearch(request, (results: any, status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results) {
          const pois: PointOfInterest[] = results.map((place: any) => ({
            place_id: place.place_id || '',
            name: place.name || '',
            formatted_address: place.formatted_address || '',
            types: place.types || [],
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              }
            },
            photos: place.photos?.map((photo: any) => ({
              photo_reference: photo.getUrl({ maxWidth: 400, maxHeight: 400 }),
              height: photo.height,
              width: photo.width
            }))
          }));
          
          // Filter out hotels and travel agencies
          const filteredPois = this.filterTouristActivities(pois);
          
          resolve(filteredPois);
        } else {
          reject(new Error(`Text search failed: ${status}`));
        }
      });
    });
  }

  // Search specifically for activities and things to do
  async searchActivities(
    location: { lat: number; lng: number },
    radius: number = 10000
  ): Promise<PointOfInterest[]> {
    const activityTypes = [
      'tourist_attraction',       // Atracciones turísticas
      'amusement_park',           // Parques de diversiones
      'aquarium',                 // Acuarios
      'art_gallery',              // Galerías de arte
      'museum',                   // Museos
      'park',                     // Parques
      'zoo',                      // Zoológicos
      'beach',                    // Playas
      'water_park',              // Parques acuáticos
      'theme_park',              // Parques temáticos
      'cultural_center',         // Centros culturales
      'theater',                 // Teatros
      'concert_hall',            // Salas de conciertos
      'sports_complex',          // Complejos deportivos
      'recreation_center',       // Centros recreativos
      'natural_feature',         // Características naturales
      'historical_landmark',     // Monumentos históricos
      'monument',                // Monumentos
      'memorial',                // Memoriales
      'palace',                  // Palacios
      'castle',                  // Castillos
      'ruins',                   // Ruinas
      'archaeological_site',     // Sitios arqueológicos
      'botanical_garden',        // Jardines botánicos
      'wildlife_park',           // Parques de vida silvestre
      'national_park',           // Parques nacionales
      'state_park',              // Parques estatales
      'nature_reserve',          // Reservas naturales
      'mountain',                // Montañas
      'volcano',                 // Volcanes
      'cave',                    // Cuevas
      'waterfall',               // Cascadas
      'lake',                    // Lagos
      'river',                   // Ríos
      'canyon',                  // Cañones
      'desert',                  // Desiertos
      'island',                  // Islas
      'peninsula',               // Penínsulas
      'coast',                   // Costas
      'shore',                   // Orillas
      'cliff',                   // Acantilados
      'valley',                  // Valles
      'plateau'                  // Mesetas
    ];

    const results = await this.searchNearby(location, radius, activityTypes);
    
    // Filter to only include tourist activities
    return this.filterTouristActivities(results);
  }

  // Search for outdoor activities and adventure sports
  async searchOutdoorActivities(
    location: { lat: number; lng: number },
    radius: number = 15000
  ): Promise<PointOfInterest[]> {
    const outdoorTypes = [
      'tourist_attraction',       // Atracciones turísticas
      'natural_feature',          // Características naturales
      'historical_landmark',      // Monumentos históricos
      'monument',                 // Monumentos
      'memorial',                 // Memoriales
      'national_park',            // Parques nacionales
      'state_park',               // Parques estatales
      'nature_reserve',           // Reservas naturales
      'mountain',                 // Montañas
      'volcano',                  // Volcanes
      'cave',                     // Cuevas
      'waterfall',                // Cascadas
      'lake',                     // Lagos
      'river',                    // Ríos
      'canyon',                   // Cañones
      'desert',                   // Desiertos
      'island',                   // Islas
      'peninsula',                // Penínsulas
      'coast',                    // Costas
      'shore',                    // Orillas
      'cliff',                    // Acantilados
      'valley',                   // Valles
      'plateau',                  // Mesetas
      'beach',                    // Playas
      'park',                     // Parques
      'botanical_garden',         // Jardines botánicos
      'wildlife_park',            // Parques de vida silvestre
      'amusement_park',           // Parques de diversiones
      'water_park',               // Parques acuáticos
      'theme_park'                // Parques temáticos
    ];

    const results = await this.searchNearby(location, radius, outdoorTypes);
    
    // Filter to only include tourist activities
    return this.filterTouristActivities(results);
  }

  // Get place details by place_id
  async getPlaceDetails(placeId: string): Promise<PointOfInterest | null> {
    return new Promise((resolve, reject) => {
      if (!this.service) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request: any = {
        placeId,
        fields: ['place_id', 'name', 'formatted_address', 'types', 'rating', 'user_ratings_total', 'geometry', 'photos', 'reviews']
      };

      this.service.getDetails(request, (place: any, status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
          const poi: PointOfInterest = {
            place_id: place.place_id || '',
            name: place.name || '',
            formatted_address: place.formatted_address || '',
            types: place.types || [],
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            geometry: {
              location: {
                lat: place.geometry?.location?.lat() || 0,
                lng: place.geometry?.location?.lng() || 0
              }
            },
            photos: place.photos?.map((photo: any) => ({
              photo_reference: photo.getUrl({ maxWidth: 400, maxHeight: 400 }),
              height: photo.height,
              width: photo.width
            })),
            reviews: place.reviews?.map((review: any) => ({
              author_name: review.author_name || 'Usuario',
              rating: review.rating || 5,
              relative_time_description: review.relative_time_description || 'recientemente',
              text: review.text || 'Sin comentario',
              language: review.language || 'es'
            }))
          };
          resolve(poi);
        } else {
          resolve(null);
        }
      });
    });
  }
}

// Create singleton instance
export const googlePlacesService = new GooglePlacesService(
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBnFtKI9V4eU_Dwi5HzNyQftsxNKomvUYY'
);

// Utility function to load Google Maps API
export const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBnFtKI9V4eU_Dwi5HzNyQftsxNKomvUYY'}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps API'));
    
    document.head.appendChild(script);
  });
};
