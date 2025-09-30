import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useConfig } from '../context/ConfigContext';
import { getTranslation } from '../utils/translations';
import { companiesApi } from '../api/companies';
import type { CompanyData } from '../api/companies';
import { useAuth } from '../context/AuthContext';

const Extranet: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const { config } = useConfig();
  const { isAuthenticated, isInitialized, login, loading, error: authError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setIsLoadingCompany(true);
        const response = await companiesApi.getCompany('10430391564');
        if (response.success) {
          setCompanyData(response.data);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompanyData();
  }, []);

  // Si ya está autenticado, redirigir al dashboard
  useEffect(() => {
    if (isAuthenticated && isInitialized) {
      console.log('🔄 LoginExtranet: User already authenticated, redirecting to dashboard');
      navigate('/extranet/dashboard');
    }
  }, [isAuthenticated, isInitialized, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError(getTranslation('login.error.emptyFields', language));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Usar el contexto de autenticación para el login
      const success = await login({
        username: username,
        password: password,
        ruc: '10430391564',
        lang: language
      });

      if (success) {
        navigate('/extranet/dashboard');
      } else {
        setError(authError || getTranslation('login.error.invalidCredentials', language));
      }
    } catch (error: any) {
      setError(getTranslation('login.error.connection', language));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-gradient-primary">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
                         {/* Card de Login */}
             <div className="card shadow-lg border-0 rounded-4">
               <div className="card-body p-4">
                                 {/* Logo y Header */}
                                  <div className="text-center mb-3">
                   <div className="mb-2">
                    {isLoadingCompany ? (
                      <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center" 
                           style={{ width: '80px', height: '80px' }}>
                        <div className="spinner-border spinner-border-sm text-white" role="status">
                          <span className="visually-hidden">Cargando...</span>
                        </div>
                      </div>
                                         ) : companyData?.logoUrl ? (
                       <img 
                         src={companyData.logoUrl} 
                         alt={companyData.name}
                         style={{ width: '80px', height: '80px', objectFit: 'contain',
                          borderRadius: '8px' }}
                       />
                    ) : null}
                  </div>
                  
                                     <p className="text-muted mb-0 fw-bold text-uppercase">
                     {getTranslation('login.title', language)}
                   </p>
                </div>

                {/* Formulario de Login */}
                <form onSubmit={handleSubmit}>
                   {/* Campo Usuario */}
                   <div className="mb-2">
                                         <label className="form-label fw-medium text-dark small">
                       {getTranslation('login.email', language)}
                     </label>
                    <div className="position-relative">
                                             <svg className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" 
                            width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                         <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                         <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                       </svg>
                      <input
                        type="text"
                                                 className="form-control ps-5 py-2 small fs-6"
                                                 placeholder={getTranslation('login.emailPlaceholder', language)}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                   {/* Campo Contraseña */}
                   <div className="mb-3">
                                         <label className="form-label fw-medium text-dark small">
                       {getTranslation('login.password', language)}
                     </label>
                    <div className="position-relative">
                      <svg className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" 
                           width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <input
                        type={showPassword ? 'text' : 'password'}
                                                 className="form-control ps-5 py-2 pe-5 small fs-6"
                                                 placeholder={getTranslation('login.passwordPlaceholder', language)}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="position-absolute top-50 end-0 translate-middle-y me-3 btn btn-link p-0 text-muted"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          {showPassword ? (
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          ) : (
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          )}
                        </svg>
                      </button>
                    </div>
                  </div>

                   {/* Mensaje de Error */}
                   {error && (
                     <div className="alert alert-danger alert-dismissible fade show mb-2" role="alert">
                      <svg className="me-2" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {error}
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError('')}
                        aria-label="Close"
                      ></button>
                    </div>
                  )}

                  {/* Botón de Login */}
                   <button
                     type="submit"
                     className="btn btn-primary w-100 py-2 fw-bold mb-2 small"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <svg className="spinner-border spinner-border-sm me-2" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 3a5 5 0 1 0 5 5H8V3z"/>
                        </svg>
                        {getTranslation('login.loading', language)}
                      </>
                    ) : (
                      <>
                        <svg className="me-2" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {getTranslation('login.submit', language)}
                      </>
                    )}
                  </button>
                </form>

                {/* Botón Volver */}
                 <div className="text-center mt-3">
                  <button
                    type="button"
                                         className="btn btn-link text-muted small"
                    onClick={handleBackToHome}
                  >
                    <svg className="me-1" width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    {getTranslation('login.backToHome', language)}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-3">
                                 {/* Language Selector */}
                 <div className="mb-2">
                   <div className="btn-group btn-group-sm" role="group">
                     <button
                       type="button"
                       className={`btn ${language === 'es' ? 'btn-primary' : 'btn-outline-primary'}`}
                       onClick={() => setLanguage('es')}
                     >
                       ES
                     </button>
                     <button
                       type="button"
                       className={`btn ${language === 'en' ? 'btn-primary' : 'btn-outline-primary'}`}
                       onClick={() => setLanguage('en')}
                     >
                       EN
                     </button>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Extranet; 