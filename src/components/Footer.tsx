import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { getTranslation } from '../utils/translations';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const { language } = useLanguage();
  const { config } = useConfig();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const businessInfo = config.business;
  
  return (
    <footer className="bg-dark text-light py-5 mt-5">
      <div className="container">
        <div className="row">
          {/* Company Info */}
          <div className="col-lg-4 col-md-6 mb-4">
                         <h5 
               className="fw-bold mb-3"
               style={{
                 color: config.colors.primary,
                 fontFamily: 'Arial, Helvetica, sans-serif',
                 fontSize: '1.5rem',
                 fontWeight: '700',
                 letterSpacing: '0.5px',
                 textTransform: 'uppercase'
               }}
             >
               {businessInfo.name}
             </h5>
            <p className="text-muted mb-3">
              {getTranslation('footer.description', language)}
            </p>
            <div className="d-flex gap-3">
              <a href="#" className="text-light text-decoration-none">
                <i className="fab fa-facebook fs-5"></i>
              </a>
              <a href="#" className="text-light text-decoration-none">
                <i className="fab fa-instagram fs-5"></i>
              </a>
              <a href="#" className="text-light text-decoration-none">
                <i className="fab fa-twitter fs-5"></i>
              </a>
              <a href="#" className="text-light text-decoration-none">
                <i className="fab fa-youtube fs-5"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">{getTranslation('footer.quickLinks', language)}</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/" className="text-muted text-decoration-none">{getTranslation('nav.home', language)}</Link>
              </li>
              <li className="mb-2">
                <Link to="/activities" className="text-muted text-decoration-none">{getTranslation('nav.activities', language)}</Link>
              </li>
            </ul>
          </div>

          {/* Destinations */}
          <div className="col-lg-2 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">{getTranslation('footer.destinations', language)}</h6>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/search?destination=Paracas" className="text-muted text-decoration-none">{getTranslation('destination.paracas', language)}</Link>
              </li>
              <li className="mb-2">
                <Link to="/search?destination=Ica" className="text-muted text-decoration-none">{getTranslation('destination.ica', language)}</Link>
              </li>
              <li className="mb-2">
                <Link to="/search?destination=Nazca" className="text-muted text-decoration-none">{getTranslation('destination.nazca', language)}</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Extranet */}
          <div className="col-lg-4 col-md-6 mb-4">
            <h6 className="fw-bold mb-3">{getTranslation('footer.contactInfo', language)}</h6>
            <div className="mb-3">
              <p className="text-muted mb-1">
                <i className="fas fa-map-marker-alt me-2"></i>
                {businessInfo.address}
              </p>
              <p className="text-muted mb-1">
                <i className="fas fa-phone me-2"></i>
                {businessInfo.phone}
              </p>
              <p className="text-muted mb-1">
                <i className="fas fa-envelope me-2"></i>
                {businessInfo.email}
              </p>
            </div>
            
            {/* Extranet Section */}
            <div className="border-top pt-3">
              <h6 className="fw-bold mb-2">Acceso Interno</h6>
              <button 
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/extranet/dashboard');
                  } else {
                    navigate('/extranet/login');
                  }
                }}
                className="btn btn-outline-primary btn-sm"
              >
                <i className="fas fa-shield-alt me-2"></i>
                {getTranslation('nav.extranet', language)}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-top border-secondary pt-4 mt-4">
          <div className="row align-items-center">
            <div className="col-md-6">
              <p className="text-muted mb-0">
                {getTranslation('footer.copyright', language)}
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <div className="d-flex gap-3 justify-content-md-end">
                <a href="#" className="text-muted text-decoration-none small">Términos y Condiciones</a>
                <a href="#" className="text-muted text-decoration-none small">Política de Privacidad</a>
                <a href="#" className="text-muted text-decoration-none small">Cookies</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 