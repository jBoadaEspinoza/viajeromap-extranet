import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { getTranslation } from '../../../utils/translations';
import OptionSetupLayout from '../../../components/OptionSetupLayout';

const OptionSettings: React.FC = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({
    referenceCode: '',
    maxGroupSize: 40,
    languages: ['Español', 'Inglés'],
    guideMaterials: false,
    isPrivate: false,
    skipLines: false,
    skipLineType: '',
    wheelchairAccessible: false,
    durationType: 'duration' as 'duration' | 'validity',
    duration: 6
  });

  return (
    <OptionSetupLayout currentSection="optionSettings">
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h4 className="mb-4">Configuración de la Opción</h4>
                
                {/* Código de referencia */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    {getTranslation('stepOptionSetup.referenceCode.title', language)}
                  </h6>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.referenceCode}
                    onChange={(e) => setFormData({...formData, referenceCode: e.target.value})}
                    maxLength={20}
                    placeholder={getTranslation('stepOptionSetup.referenceCode.placeholder', language)}
                  />
                  <div className="text-muted small mt-1">
                    {formData.referenceCode.length} / 20
                  </div>
                  <p className="text-muted small mt-2">
                    {getTranslation('stepOptionSetup.referenceCode.description', language)}
                  </p>
                </div>

                {/* Tamaño máximo del grupo */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    {getTranslation('stepOptionSetup.maxGroupSize.title', language)}
                  </h6>
                  <p className="text-muted mb-2">
                    {getTranslation('stepOptionSetup.maxGroupSize.description', language)}
                  </p>
                  <select
                    className="form-select"
                    value={formData.maxGroupSize}
                    onChange={(e) => setFormData({...formData, maxGroupSize: parseInt(e.target.value)})}
                    style={{ width: '120px' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                {/* Configuración de opciones */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <h6 className="fw-bold mb-0 me-2">
                      {getTranslation('stepOptionSetup.optionConfig.title', language)}
                    </h6>
                    <span className="badge bg-primary small">Personalizable</span>
                    <i className="fas fa-info-circle text-primary ms-2"></i>
                  </div>

                  {/* Idiomas */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">
                      {getTranslation('stepOptionSetup.languages.title', language)}
                    </h6>
                    <p className="text-muted small mb-2">
                      {getTranslation('stepOptionSetup.languages.instructions', language)}
                    </p>
                    
                    {/* Idiomas seleccionados */}
                    {formData.languages.length > 0 && (
                      <div className="mb-3">
                        {formData.languages.map(lang => (
                          <span key={lang} className="badge bg-primary me-2 mb-2">
                            {lang}
                            <button
                              type="button"
                              className="btn-close btn-close-white ms-2"
                              onClick={() => setFormData({
                                ...formData, 
                                languages: formData.languages.filter(l => l !== lang)
                              })}
                            ></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Materiales de guía */}
                  <div className="mb-3">
                    <h6 className="fw-bold mb-2">
                      {getTranslation('stepOptionSetup.guideMaterials.title', language)}
                    </h6>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="guideMaterials"
                        checked={formData.guideMaterials}
                        onChange={(e) => setFormData({...formData, guideMaterials: e.target.checked})}
                      />
                      <label className="form-check-label" htmlFor="guideMaterials">
                        {getTranslation('stepOptionSetup.guideMaterials.label', language)}
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actividad privada */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    {getTranslation('stepOptionSetup.privateActivity.title', language)}
                  </h6>
                  <p className="text-muted mb-2">
                    {getTranslation('stepOptionSetup.privateActivity.description', language)}
                  </p>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="privateActivity"
                      id="privateNo"
                      checked={!formData.isPrivate}
                      onChange={() => setFormData({...formData, isPrivate: false})}
                    />
                    <label className="form-check-label" htmlFor="privateNo">
                      {getTranslation('stepOptionSetup.privateActivity.no', language)}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="privateActivity"
                      id="privateYes"
                      checked={formData.isPrivate}
                      onChange={() => setFormData({...formData, isPrivate: true})}
                    />
                    <label className="form-check-label" htmlFor="privateYes">
                      {getTranslation('stepOptionSetup.privateActivity.yes', language)}
                    </label>
                  </div>
                </div>

                {/* Evitar colas */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    {getTranslation('stepOptionSetup.skipLines.title', language)}
                  </h6>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="skipLines"
                      id="skipLinesNo"
                      checked={!formData.skipLines}
                      onChange={() => setFormData({...formData, skipLines: false})}
                    />
                    <label className="form-check-label" htmlFor="skipLinesNo">
                      {getTranslation('stepOptionSetup.skipLines.no', language)}
                    </label>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="skipLines"
                      id="skipLinesYes"
                      checked={formData.skipLines}
                      onChange={() => setFormData({...formData, skipLines: true})}
                    />
                    <label className="form-check-label" htmlFor="skipLinesYes">
                      {getTranslation('stepOptionSetup.skipLines.yes', language)}
                    </label>
                  </div>
                  
                  {formData.skipLines && (
                    <select
                      className="form-select"
                      value={formData.skipLineType}
                      onChange={(e) => setFormData({...formData, skipLineType: e.target.value})}
                      style={{ width: '300px' }}
                    >
                      <option value="">{getTranslation('stepOptionSetup.skipLines.selectType', language)}</option>
                      <option value="tickets">{getTranslation('stepOptionSetup.skipLines.tickets', language)}</option>
                      <option value="entrance">{getTranslation('stepOptionSetup.skipLines.entrance', language)}</option>
                      <option value="security">{getTranslation('stepOptionSetup.skipLines.security', language)}</option>
                    </select>
                  )}
                </div>

                {/* Accesibilidad en silla de ruedas */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-2">
                    {getTranslation('stepOptionSetup.wheelchair.title', language)}
                  </h6>
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="wheelchair"
                      id="wheelchairNo"
                      checked={!formData.wheelchairAccessible}
                      onChange={() => setFormData({...formData, wheelchairAccessible: false})}
                    />
                    <label className="form-check-label" htmlFor="wheelchairNo">
                      {getTranslation('stepOptionSetup.wheelchair.no', language)}
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="wheelchair"
                      id="wheelchairYes"
                      checked={formData.wheelchairAccessible}
                      onChange={() => setFormData({...formData, wheelchairAccessible: true})}
                    />
                    <label className="form-check-label" htmlFor="wheelchairYes">
                      {getTranslation('stepOptionSetup.wheelchair.yes', language)}
                    </label>
                  </div>
                </div>

                {/* Duración o validez */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <h6 className="fw-bold mb-0 me-2">
                      {getTranslation('stepOptionSetup.duration.title', language)}
                    </h6>
                    <span className="badge bg-primary small">Personalizable</span>
                    <i className="fas fa-info-circle text-primary ms-2"></i>
                  </div>
                  
                  <p className="text-muted mb-3">
                    {getTranslation('stepOptionSetup.duration.description', language)}
                  </p>
                  
                  <h6 className="fw-bold mb-3">
                    {getTranslation('stepOptionSetup.duration.question', language)}
                  </h6>
                  
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="durationType"
                      id="durationType"
                      checked={formData.durationType === 'duration'}
                      onChange={() => setFormData({...formData, durationType: 'duration'})}
                    />
                    <label className="form-check-label" htmlFor="durationType">
                      {getTranslation('stepOptionSetup.duration.type.duration', language)}
                    </label>
                  </div>
                  
                  {formData.durationType === 'duration' && (
                    <div className="ms-4 mb-3">
                      <div className="input-group" style={{ width: '120px' }}>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.duration}
                          onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value) || 0})}
                          min="1"
                          max="24"
                        />
                        <span className="input-group-text">h</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="durationType"
                      id="validityType"
                      checked={formData.durationType === 'validity'}
                      onChange={() => setFormData({...formData, durationType: 'validity'})}
                    />
                    <label className="form-check-label" htmlFor="validityType">
                      {getTranslation('stepOptionSetup.duration.type.validity', language)}
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="row mt-4">
          <div className="col-12 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.history.back()}
            >
              <i className="fas fa-arrow-left me-2"></i>
              {getTranslation('common.back', language)}
            </button>
            
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => console.log('Guardar configuración')}
            >
              Guardar configuración
              <i className="fas fa-save ms-2"></i>
            </button>
          </div>
        </div>
      </div>
    </OptionSetupLayout>
  );
};

export default OptionSettings; 