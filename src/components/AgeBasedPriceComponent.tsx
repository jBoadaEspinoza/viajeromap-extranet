import React from 'react';

interface AgeGroup {
  id: string;
  name: string;
  minAge: number;
  maxAge: number;
}

interface AgeBasedPriceComponentProps {
  ageGroups: AgeGroup[];
  onAgeGroupsChange: (groups: AgeGroup[]) => void;
  onAddAgeGroup: () => void;
  onRemoveAgeGroup: (id: string) => void;
  onManualAgeRangeChange: (id: string, field: 'minAge' | 'maxAge', value: number) => void;
  onContinue: () => void;
  language: string;
  getTranslation: (key: string, lang: string) => string;
}

export default function AgeBasedPriceComponent({
  ageGroups,
  onAgeGroupsChange,
  onAddAgeGroup,
  onRemoveAgeGroup,
  onManualAgeRangeChange,
  onContinue,
  language,
  getTranslation
}: AgeBasedPriceComponentProps) {
  return (
    <div className="mb-4">
      {/* Mostrar orden actual de grupos */}
      <div className="text-info border-0 bg-light mb-3">
        <i className="fas fa-sort-numeric-up text-primary me-2"></i>
        <strong>Orden actual:</strong> {
          ageGroups
            .sort((a, b) => {
              const orderMap: { [key: string]: number } = {
                'Infante': 0,
                'Niños': 1,
                'Adultos': 2,
                'Adulto mayor': 3
              };
              return (orderMap[a.name] ?? 999) - (orderMap[b.name] ?? 999);
            })
            .map(group => group.name)
            .join(' → ')
        }
      </div>
      
      {ageGroups.map((group, index) => (
        <div key={group.id} className="card mb-3 border">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <span className="fw-semibold me-3">
                  {group.name}
                  {(group.name === 'Niños' || group.name === 'Adultos') && (
                    <span className="badge bg-info ms-2" style={{ fontSize: '0.7rem' }}>
                      <i className="fas fa-shield-alt me-1"></i>
                      Protegido
                    </span>
                  )}
                </span>
                <span className="text-muted me-2">Franja de edad</span>
                <div className="d-flex align-items-center">
                  {/* Campos de edad - solo editable la edad máxima */}
                  <div className="row g-2 mt-2">
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="0"
                        max="99"
                        value={group.minAge}
                        readOnly={true}
                        style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                        title="La edad mínima se conecta automáticamente con la edad máxima del grupo anterior"
                      />
                    </div>
                    <div className="col-6">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        min="0"
                        max="99"
                        value={group.maxAge}
                        onChange={(e) => onManualAgeRangeChange(group.id, 'maxAge', parseInt(e.target.value) || 0)}
                        title="Edita la edad máxima para conectar automáticamente con el siguiente grupo"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-link text-danger p-0"
                onClick={() => onRemoveAgeGroup(group.id)}
                disabled={ageGroups.length <= 1 || group.name === 'Niños' || group.name === 'Adultos'}
                title={group.name === 'Niños' || group.name === 'Adultos' ? 'Este grupo no se puede eliminar' : 'Eliminar grupo'}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
      
      <button 
        type="button" 
        className="btn btn-link text-primary p-0 d-flex align-items-center"
        onClick={onAddAgeGroup}
      >
        <i className="fas fa-chevron-down me-2"></i>
        Añadir grupo de edad
      </button>
      
      {/* Información sobre grupos disponibles para agregar */}
      <div className="mt-2">
        {(() => {
          const existingInfante = ageGroups.some(group => group.name === 'Infante');
          const existingAdultoMayor = ageGroups.some(group => group.name === 'Adulto mayor');
          
          if (!existingInfante && !existingAdultoMayor) {
            return (
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Puedes agregar: Infante y Adulto mayor
              </small>
            );
          } else if (!existingInfante) {
            return (
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Solo puedes agregar: Infante
              </small>
            );
          } else if (!existingAdultoMayor) {
            return (
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                Solo puedes agregar: Adulto mayor
              </small>
            );
          } else {
            return (
              <small className="text-success">
                <i className="fas fa-check-circle me-1"></i>
                Todos los grupos disponibles han sido agregados
              </small>
            );
          }
        })()}
      </div>
      
      {/* Botón para continuar si ya se han configurado los grupos */}
      {ageGroups.length > 0 && ageGroups.every(group => group.name.trim() && group.minAge < group.maxAge) && (
        <div className="mt-4">
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={onContinue}
          >
            <i className="fas fa-arrow-right me-2"></i>
            Continuar al siguiente paso
          </button>
        </div>
      )}
    </div>
  );
}

