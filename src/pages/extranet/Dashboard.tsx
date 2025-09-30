import React, { useState, useEffect } from 'react';
import ExtranetPage from '../../components/ExtranetPage';
import { useExtranetLoading } from '../../hooks/useExtranetLoading';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useCurrency } from '../../context/CurrencyContext';
import { activitiesApi, type Activity } from '../../api/activities';
import { getTranslation } from '../../utils/translations';

interface DashboardData {
  totalActivities: number;
  totalBookings: number;
  totalRevenue: number;
  recentActivities: Activity[];
  activeActivities: number;
  inactiveActivities: number;
}

const Dashboard: React.FC = () => {
  const { withLoading } = useExtranetLoading();
  const { user, company } = useAuth();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalActivities: 0,
    totalBookings: 0,
    totalRevenue: 0,
    recentActivities: [],
    activeActivities: 0,
    inactiveActivities: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      await withLoading(async () => {
        try {
          setError(null);
          
          // Cargar actividades con paginación para obtener estadísticas
          const activitiesResponse = await activitiesApi.search({
            page: 0,
            size: 100, // Obtener más actividades para estadísticas
            lang: language,
            currency: currency
          });

          if (activitiesResponse.success) {
            const activities = activitiesResponse.data;
            const totalActivities = activities.length;
            
            // Calcular actividades activas e inactivas
            const activeActivities = activities.filter(activity => activity.isActive).length;
            const inactiveActivities = totalActivities - activeActivities;
            
            // Obtener las 5 actividades más recientes (ordenadas por fecha de creación)
            const recentActivities = activities
              .sort((a, b) => new Date(b.createAt).getTime() - new Date(a.createAt).getTime())
              .slice(0, 5);

            // Calcular estadísticas de reservas (simulado por ahora)
            const totalBookings = activities.reduce((total, activity) => {
              return total + (activity.bookingOptions?.length || 0) * 10; // Simulación
            }, 0);

            // Calcular ingresos (simulado por ahora)
            const totalRevenue = activities.reduce((total, activity) => {
              const bookingRevenue = activity.bookingOptions?.reduce((bookingTotal, booking) => {
                return bookingTotal + (booking.pricePerPerson * 5); // Simulación: 5 personas promedio
              }, 0) || 0;
              return total + bookingRevenue;
            }, 0);

            setDashboardData({
              totalActivities,
              totalBookings,
              totalRevenue,
              recentActivities,
              activeActivities,
              inactiveActivities
            });
          } else {
            setError(getTranslation('dashboard.error.loadingActivities', language));
          }
        } catch (error) {
          console.error('Error loading dashboard data:', error);
          setError(getTranslation('dashboard.error.loadingActivities', language));
        }
      }, 'dashboard-loading');
    };

    loadDashboardData();
  }, [withLoading, language, currency]);

  return (
    <ExtranetPage title={getTranslation('dashboard.title', language)}>
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title">
                {getTranslation('dashboard.welcome', language)}, {user?.nickname || getTranslation('dashboard.user', language)}!
              </h5>
              <p className="card-text">
                {getTranslation('dashboard.description', language)}
              </p>
              
              {/* Estadísticas rápidas */}
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="card bg-primary text-white">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fas fa-calendar-alt me-2"></i>
                        {getTranslation('dashboard.stats.activities', language)}
                      </h6>
                      <h4 className="mb-0">{dashboardData.totalActivities}</h4>
                      <small>{getTranslation('dashboard.stats.activitiesDesc', language)}</small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card bg-success text-white">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fas fa-bookmark me-2"></i>
                        {getTranslation('dashboard.stats.bookings', language)}
                      </h6>
                      <h4 className="mb-0">{dashboardData.totalBookings}</h4>
                      <small>{getTranslation('dashboard.stats.bookingsDesc', language)}</small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card bg-info text-white">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fas fa-chart-line me-2"></i>
                        {getTranslation('dashboard.stats.revenue', language)}
                      </h6>
                      <h4 className="mb-0">{currency} {dashboardData.totalRevenue.toLocaleString()}</h4>
                      <small>{getTranslation('dashboard.stats.revenueDesc', language)}</small>
                    </div>
                  </div>
                </div>
                
                <div className="col-md-3">
                  <div className="card bg-warning text-white">
                    <div className="card-body">
                      <h6 className="card-title">
                        <i className="fas fa-star me-2"></i>
                        {getTranslation('dashboard.stats.rating', language)}
                      </h6>
                      <h4 className="mb-0">4.8</h4>
                      <small>{getTranslation('dashboard.stats.ratingDesc', language)}</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="alert alert-danger mt-4" role="alert">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}

              {/* Actividades recientes */}
              <div className="row mt-4">
                <div className="col-12">
                  <div className="card">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="fas fa-clock me-2"></i>
                        {getTranslation('dashboard.recentActivities.title', language)}
                      </h6>
                    </div>
                    <div className="card-body">
                      {dashboardData.recentActivities.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>{getTranslation('dashboard.recentActivities.activity', language)}</th>
                                <th>{getTranslation('dashboard.recentActivities.status', language)}</th>
                                <th>{getTranslation('dashboard.recentActivities.created', language)}</th>
                                <th>{getTranslation('dashboard.recentActivities.actions', language)}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardData.recentActivities.map(activity => (
                                <tr key={activity.id}>
                                  <td>
                                    <div>
                                      <h6 className="mb-1">{activity.title}</h6>
                                      <small className="text-muted">ID: {activity.id}</small>
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`badge ${activity.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                      {activity.isActive 
                                        ? getTranslation('dashboard.recentActivities.active', language)
                                        : getTranslation('dashboard.recentActivities.inactive', language)
                                      }
                                    </span>
                                  </td>
                                  <td>
                                    <small className="text-muted">
                                      {new Date(activity.createAt).toLocaleDateString()}
                                    </small>
                                  </td>
                                  <td>
                                    <button 
                                      className="btn btn-sm btn-outline-primary me-1"
                                      title={getTranslation('dashboard.recentActivities.edit', language)}
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-info"
                                      title={getTranslation('dashboard.recentActivities.view', language)}
                                    >
                                      <i className="fas fa-eye"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="fas fa-calendar-alt fs-1 text-muted mb-3"></i>
                          <p className="text-muted">
                            {getTranslation('dashboard.recentActivities.noActivities', language)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ExtranetPage>
  );
};

export default Dashboard; 