import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { LoadingProvider } from '../context/LoadingContext';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isExtranetRoute = location.pathname.startsWith('/extranet');
  const isLoginExtranetRoute = location.pathname === '/';

  if (isExtranetRoute || isLoginExtranetRoute) {
    // Para rutas del extranet y LoginExtranet, no mostrar navbar ni footer
    return <>{children}</>;
  }

  // Para rutas normales, mostrar navbar y footer con LoadingProvider
  return (
    <LoadingProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </div>
    </LoadingProvider>
  );
};

export default ConditionalLayout; 