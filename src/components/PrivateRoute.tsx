import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = React.useState(false);

  console.log('🛡️ PrivateRoute:', { 
    isAuthenticated, 
    isInitialized, 
    pathname: location.pathname,
    isChecking 
  });

  // Verificar token cuando se monta el componente
  React.useEffect(() => {
    const checkAuth = async () => {
      // Solo verificar si ya se inicializó y no está autenticado
      if (isInitialized && !isAuthenticated) {
        console.log('🔍 PrivateRoute: Checking authentication...');
        setIsChecking(true);
        try {
          // Simular verificación de token
          const isValid = false; // Por defecto, asumir que no es válido
          console.log('🔍 PrivateRoute: Token verification result:', isValid);
          if (!isValid) {
            console.log('❌ PrivateRoute: Token invalid, will redirect to login');
          }
        } catch (error) {
          console.error('❌ PrivateRoute: Error checking auth:', error);
        } finally {
          setIsChecking(false);
        }
      }
    };

    checkAuth();
  }, [isInitialized, isAuthenticated]);

  // Si aún no se ha inicializado o está verificando, mostrar loading
  if (!isInitialized || isChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">Verificando sesión...</span>
          </div>
          <p className="text-muted">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    console.log('❌ PrivateRoute: User not authenticated, redirecting to login');
    return <Navigate to="/extranet" state={{ from: location }} replace />;
  }

  // Si está autenticado, mostrar el contenido
  console.log('✅ PrivateRoute: User authenticated, showing content');
  return <>{children}</>;
};

export default PrivateRoute; 