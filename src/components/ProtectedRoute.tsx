import React from 'react';
import { Navigate } from 'react-router-dom';
import { useExtranetAuth } from '../hooks/useExtranetAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialized, isValidating } = useExtranetAuth();

  // Mostrar loading mientras se inicializa o valida
  if (!isInitialized || isValidating) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Validando sesión...</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/extranet/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 