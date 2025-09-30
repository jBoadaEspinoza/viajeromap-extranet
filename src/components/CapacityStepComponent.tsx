import React from 'react';

interface CapacityData {
  groupMinSize: number;
  groupMaxSize: number | null;
  maxParticipants: number;
}

interface CapacityStepComponentProps {
  capacityData: CapacityData;
  onCapacityDataChange: (data: CapacityData) => void;
  onContinue: () => void;
  onBack: () => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
  isLoading: boolean;
  isSaving: boolean;
}

export default function CapacityStepComponent({
  capacityData,
  onCapacityDataChange,
  onContinue,
  onBack,
  language,
  getTranslation,
  isLoading,
  isSaving
}: CapacityStepComponentProps) {
  const handleInputChange = (field: keyof CapacityData, value: number | null) => {
    onCapacityDataChange({
      ...capacityData,
      [field]: value
    });
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-users me-2"></i>
                {getTranslation('stepSchedule.capacity.title', language)}
              </h4>
            </div>
            <div className="card-body">
              {/* Información sobre capacidad */}
              <div className="alert alert-info mb-4">
                <i className="fas fa-info-circle me-2"></i>
                <strong>{getTranslation('stepSchedule.capacity.info.title', language)}</strong>
                <p className="mb-0 mt-2">
                  {getTranslation('stepSchedule.capacity.info.description', language)}
                </p>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="fas fa-user-plus me-2 text-primary"></i>
                        {getTranslation('stepSchedule.capacity.minSize.title', language)}
                      </h5>
                      <p className="card-text text-muted">
                        {getTranslation('stepSchedule.capacity.minSize.description', language)}
                      </p>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control form-control-lg text-center"
                          min="1"
                          value={capacityData.groupMinSize}
                          onChange={(e) => handleInputChange('groupMinSize', parseInt(e.target.value) || 1)}
                        />
                        <span className="input-group-text">
                          {getTranslation('stepSchedule.capacity.people', language)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card h-100">
                    <div className="card-body">
                      <h5 className="card-title">
                        <i className="fas fa-user-friends me-2 text-success"></i>
                        {getTranslation('stepSchedule.capacity.maxSize.title', language)}
                      </h5>
                      <p className="card-text text-muted">
                        {getTranslation('stepSchedule.capacity.maxSize.description', language)}
                      </p>
                      <div className="input-group">
                        <input
                          type="number"
                          className="form-control form-control-lg text-center"
                          min="1"
                          value={capacityData.groupMaxSize || ''}
                          onChange={(e) => handleInputChange('groupMaxSize', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder={getTranslation('stepSchedule.capacity.unlimited', language)}
                        />
                        <span className="input-group-text">
                          {getTranslation('stepSchedule.capacity.people', language)}
                        </span>
                      </div>
                      <small className="text-muted">
                        {getTranslation('stepSchedule.capacity.maxSize.help', language)}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen de capacidad */}
              <div className="mt-4">
                <div className="card bg-light">
                  <div className="card-body">
                    <h6 className="card-title">
                      <i className="fas fa-chart-bar me-2"></i>
                      {getTranslation('stepSchedule.capacity.summary.title', language)}
                    </h6>
                    <div className="row">
                      <div className="col-md-4">
                        <div className="text-center">
                          <div className="h4 text-primary">{capacityData.groupMinSize}</div>
                          <small className="text-muted">
                            {getTranslation('stepSchedule.capacity.summary.min', language)}
                          </small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center">
                          <div className="h4 text-success">
                            {capacityData.groupMaxSize || '∞'}
                          </div>
                          <small className="text-muted">
                            {getTranslation('stepSchedule.capacity.summary.max', language)}
                          </small>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="text-center">
                          <div className="h4 text-info">
                            {capacityData.maxParticipants}
                          </div>
                          <small className="text-muted">
                            {getTranslation('stepSchedule.capacity.summary.total', language)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validaciones */}
              {capacityData.groupMaxSize !== null && capacityData.groupMinSize >= capacityData.groupMaxSize && (
                <div className="alert alert-warning mt-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {getTranslation('stepSchedule.capacity.validation.minMax', language)}
                </div>
              )}

              {/* Botones de navegación */}
              <div className="d-flex justify-content-between mt-4">
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={onBack}
                  disabled={isLoading || isSaving}
                >
                  <i className="fas fa-arrow-left me-2"></i>
                  {getTranslation('stepSchedule.buttons.back', language)}
                </button>
                
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onContinue}
                  disabled={isLoading || isSaving || !capacityData.groupMinSize || (capacityData.groupMaxSize !== null && capacityData.groupMinSize >= capacityData.groupMaxSize)}
                >
                  {isSaving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {getTranslation('stepSchedule.buttons.saving', language)}
                    </>
                  ) : (
                    <>
                      {getTranslation('stepSchedule.buttons.continue', language)}
                      <i className="fas fa-arrow-right ms-2"></i>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

