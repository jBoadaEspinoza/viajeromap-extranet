import React from 'react';
import NavbarExtranet from './NavbarExtranet';

interface ExtranetPageProps {
  children: React.ReactNode;
  title?: string;
}

const ExtranetPage: React.FC<ExtranetPageProps> = ({ children, title }) => {
  return (
    <NavbarExtranet>
      {title && (
        <div className="mb-4">
          <h1 className="h2 fw-bold text-dark mb-0">{title}</h1>
        </div>
      )}
      {children}
    </NavbarExtranet>
  );
};

export default ExtranetPage; 