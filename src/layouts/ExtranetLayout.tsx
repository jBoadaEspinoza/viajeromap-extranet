import React from 'react';
import { Outlet } from 'react-router-dom';
import { LoadingProvider } from '../context/LoadingContext';

const ExtranetLayout: React.FC = () => {
  return (
    <LoadingProvider>
      <Outlet />
    </LoadingProvider>
  );
};

export default ExtranetLayout; 