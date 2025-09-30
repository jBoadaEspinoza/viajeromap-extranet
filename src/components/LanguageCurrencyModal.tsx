import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

interface LanguageCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LanguageCurrencyModal: React.FC<LanguageCurrencyModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<'language' | 'currency'>('language');

  const handleLanguageChange = (newLanguage: 'es' | 'en') => {
    setLanguage(newLanguage);
    // Refresh page immediately after language change
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleCurrencyChange = (newCurrency: 'PEN' | 'USD') => {
    setCurrency(newCurrency);
    // Refresh page immediately after currency change
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal fade show d-block" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div className="modal-dialog modal-sm modal-dialog-centered">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title">Configuración</h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={onClose}
              aria-label="Close"
            ></button>
          </div>

          {/* Tabs */}
          <div className="modal-body pt-4">
            <ul className="nav nav-tabs border-0 mb-4 justify-content-center" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'language' ? 'active border-0' : 'border-0'}`}
                  onClick={() => setActiveTab('language')}
                  style={{
                    borderBottom: activeTab === 'language' ? '2px solid #0d6efd' : 'none',
                    color: activeTab === 'language' ? '#0d6efd' : '#6c757d'
                  }}
                >
                  <i className="fas fa-globe me-2"></i>
                  Idioma
                </button>
              </li>
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link ${activeTab === 'currency' ? 'active border-0' : 'border-0'}`}
                  onClick={() => setActiveTab('currency')}
                  style={{
                    borderBottom: activeTab === 'currency' ? '2px solid #0d6efd' : 'none',
                    color: activeTab === 'currency' ? '#0d6efd' : '#6c757d'
                  }}
                >
                  <i className="fas fa-dollar-sign me-2"></i>
                  Divisa
                </button>
              </li>
            </ul>

            {/* Language Tab Content */}
            {activeTab === 'language' && (
              <div className="d-flex flex-column gap-3 align-items-center">
                <button
                  className={`btn text-start p-3 w-75 ${language === 'es' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleLanguageChange('es')}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <span className="me-3 fs-5">🇪🇸</span>
                      <span>Español</span>
                    </div>
                    {language === 'es' && (
                      <i className="fas fa-check text-primary"></i>
                    )}
                  </div>
                </button>
                <button
                  className={`btn text-start p-3 w-75 ${language === 'en' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleLanguageChange('en')}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <span className="me-3 fs-5">🇺🇸</span>
                      <span>English</span>
                    </div>
                    {language === 'en' && (
                      <i className="fas fa-check text-primary"></i>
                    )}
                  </div>
                </button>
              </div>
            )}

            {/* Currency Tab Content */}
            {activeTab === 'currency' && (
              <div className="d-flex flex-column gap-3 align-items-center">
                <button
                  className={`btn text-start p-3 w-75 ${currency === 'PEN' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleCurrencyChange('PEN')}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <span className="me-3 fs-5">S/</span>
                      <span>Sol Peruano</span>
                    </div>
                    {currency === 'PEN' && (
                      <i className="fas fa-check text-primary"></i>
                    )}
                  </div>
                </button>
                <button
                  className={`btn text-start p-3 w-75 ${currency === 'USD' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleCurrencyChange('USD')}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <span className="me-3 fs-5">$</span>
                      <span>Dólar Americano</span>
                    </div>
                    {currency === 'USD' && (
                      <i className="fas fa-check text-primary"></i>
                    )}
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageCurrencyModal; 