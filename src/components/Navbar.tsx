import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useConfig } from '../context/ConfigContext';
import { getTranslation } from '../utils/translations';
import LanguageCurrencyModal from './LanguageCurrencyModal';

const Navbar: React.FC = () => {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const { currency, setCurrency, getCurrencySymbol } = useCurrency();
  const { config } = useConfig();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getLanguageFlag = (lang: string) => {
    return lang === 'es' ? '🇪🇸' : '🇺🇸';
  };

  const getLanguageName = (lang: string) => {
    return lang === 'es' ? getTranslation('lang.spanish', language) : getTranslation('lang.english', language);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <img
            src="https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/companies%2F1753994589016.jpg?alt=media&token=7c6c7848-7e92-4a35-9241-909c068cb445"
            alt="Peru Trips Adventure Logo"
            height="40"
            className="d-inline-block align-text-top me-2"
          />
          <span className="fw-bold">{config.business.name}</span>
        </Link>

        {/* Mobile menu button */}
        <button
          className="navbar-toggler"
          type="button"
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation Links */}
        <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active fw-bold' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {getTranslation('nav.home', language)}
              </Link>
            </li>
            <li className="nav-item">
              <Link
                to="/activities"
                className={`nav-link ${isActive('/activities') ? 'active fw-bold' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {getTranslation('nav.activities', language)}
              </Link>
            </li>
          </ul>

                     {/* Language and Currency Selector */}
           <div className="d-flex align-items-center">
                           <button
                className="btn d-flex flex-column align-items-center gap-1 py-2 px-3"
                style={{ border: 'none', backgroundColor: 'transparent' }}
                type="button"
                onClick={openModal}
              >
               <i className="fas fa-globe fs-6"></i>
                               <div className="d-flex align-items-center">
                  <span className="small" style={{ fontSize: '0.7rem' }}>{language.toUpperCase()}</span>
                  <span className="mx-1 small" style={{ fontSize: '0.7rem' }}>/</span>
                  <span className="small" style={{ fontSize: '0.7rem' }}>{currency}</span>
                </div>
             </button>
           </div>
        </div>
      </div>
      
      {/* Language Currency Modal */}
      <LanguageCurrencyModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </nav>
  );
};

export default Navbar; 