import React from 'react';
import ExtranetPage from '../../components/ExtranetPage';

interface UnderConstructionProps {
  title: string;
  description?: string;
}

const UnderConstruction: React.FC<UnderConstructionProps> = ({ title, description }) => {
  return (
    <ExtranetPage title={title}>
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <i className="fas fa-tools fa-4x text-muted"></i>
              </div>
              <h3 className="mb-3">🚧 En Construcción</h3>
              <p className="text-muted mb-4">
                {description || 'Esta funcionalidad estará disponible próximamente.'}
              </p>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Próximamente:</strong> Esta sección estará disponible en futuras actualizaciones.
              </div>
            </div>
          </div>
        </div>
      </div>
    </ExtranetPage>
  );
};

export default UnderConstruction; 