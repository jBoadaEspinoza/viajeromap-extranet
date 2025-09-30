import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { useAppDispatch } from '../redux/store';
import { resetActivityCreation } from '../redux/activityCreationSlice';
import LanguageCurrencyModal from './LanguageCurrencyModal';

interface NavbarExtranetProps {
  children: React.ReactNode;
}

const NavbarExtranet: React.FC<NavbarExtranetProps> = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { language } = useLanguage();
  const { currency } = useCurrency();
  const { company, user, logout, isAuthenticated } = useAuth();
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isHeaderFloating, setIsHeaderFloating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);



  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getLanguageDisplay = () => {
    return language === 'es' ? 'ES' : 'EN';
  };

  const getCurrencyDisplay = () => {
    return currency === 'PEN' ? 'S/ PEN' : '$ USD';
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };



  const handleUserLogout = () => {
    logout();
  };

  const getUserInitial = (nickname: string) => {
    return nickname ? nickname.charAt(0).toUpperCase() : 'U';
  };

  // Verificación de seguridad para evitar errores durante la inicialización
  if (!isAuthenticated) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  const toggleNav = () => {
    setIsNavCollapsed(!isNavCollapsed);
  };

  const handleDropdownMouseEnter = (dropdownName: string) => {
    setActiveDropdown(dropdownName);
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
  };

  const handleItemMouseEnter = (itemName: string) => {
    setHoveredItem(itemName);
    if (activeDropdown) {
      setActiveDropdown(activeDropdown);
    }
  };

  const handleItemMouseLeave = () => {
    setHoveredItem(null);
    dropdownTimeoutRef.current = setTimeout(() => {
      if (!hoveredItem) {
        setActiveDropdown(null);
      }
    }, 150);
  };

           const handleItemClick = (itemName: string) => {
           if (dropdownTimeoutRef.current) {
             clearTimeout(dropdownTimeoutRef.current);
             dropdownTimeoutRef.current = null;
           }

           // Navegación basada en el item seleccionado
           switch (itemName) {
             case 'Actividades':
               navigate('/extranet/list-activities');
               break;
             case 'Inicio':
               navigate('/extranet/dashboard');
               break;
             case 'Nueva actividad':
               // Reiniciar todos los valores del step antes de crear nueva actividad
               dispatch(resetActivityCreation());
               console.log('NavbarExtranet: Valores del step reiniciados para nueva actividad');
               navigate('/extranet/activity/createCategory');
               break;
             case 'Disponibilidad':
               navigate('/extranet/availability');
               break;
             case 'Ofertas especiales':
               navigate('/extranet/special-offers');
               break;
             case 'Reservas':
               navigate('/extranet/bookings');
               break;
             case 'Escaner de tickets':
               navigate('/extranet/ticket-scanner');
               break;
             case 'Reseñas':
               navigate('/extranet/reviews');
               break;
             case 'Analiticas':
               navigate('/extranet/analytics');
               break;
             case 'Sugerencias':
               navigate('/extranet/suggestions');
               break;
             default:
               console.log(`Navegación no implementada para: ${itemName}`);
           }

           setActiveDropdown(null);
           setHoveredItem(null);
           // Close mobile menu after navigation
           setIsNavCollapsed(true);
         };

  const handleDropdownContainerMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
      setHoveredItem(null);
    }, 200);
  };

  const navRef = useRef<HTMLDivElement>(null);

  // Scroll detection for floating header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsHeaderFloating(scrollTop > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsNavCollapsed(true);
        setActiveDropdown(null);
        setHoveredItem(null);
      }
      
      // Cerrar dropdown de usuario cuando se hace clic fuera
      const userDropdown = document.querySelector('.user-dropdown-container');
      if (userDropdown && !userDropdown.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-vh-100 bg-white">
      {/* Header */}
      <header className={`dashboard-header ${isHeaderFloating ? 'dashboard-header--floating' : ''}`}>
        <div className="container px-3 px-md-4">
          <div className="d-flex justify-content-between align-items-center py-2 py-md-3">
            {/* Logo - Mobile Responsive */}
            <div className="d-flex align-items-center">
              <div className="me-2 me-md-4">
                {company?.logoUrl ? (
                  <img 
                    src={company.logoUrl} 
                    alt={company.name || 'Logo de la empresa'}
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    className="d-md-none"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/logo-default.png';
                    }}
                  />
                ) : (
                  <img 
                    src="/logo-default.svg" 
                    alt="Logo por defecto"
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    className="d-md-none"
                  />
                )}
                
                {/* Desktop Logo */}
                {company?.logoUrl ? (
                  <img 
                    src={company.logoUrl} 
                    alt={company.name || 'Logo de la empresa'}
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    className="d-none d-md-block"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/logo-default.png';
                    }}
                  />
                ) : (
                  <img 
                    src="/logo-default.svg" 
                    alt="Logo por defecto"
                    style={{ 
                      width: '80px', 
                      height: '80px', 
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                    className="d-none d-md-block"
                  />
                )}
              </div>
              <div className="d-none d-md-block">
                <h6 className="mb-0 fw-bold text-primary text-uppercase">
                  {company?.name || ''}
                </h6>
                <small className="text-muted">
                  {company?.ruc ? `RUC: ${company.ruc}` : ''}
                </small>
              </div>
            </div>

            {/* Navigation */}
            <nav className="navbar navbar-expand-lg dashboard-nav" ref={navRef}>
              <button 
                className="navbar-toggler border-0" 
                type="button" 
                onClick={toggleNav}
                aria-controls="navbarNav" 
                aria-expanded={!isNavCollapsed} 
                aria-label="Toggle navigation"
                style={{ padding: '0.25rem 0.5rem' }}
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              
              <div className={`navbar-collapse ${!isNavCollapsed ? 'show' : ''}`} id="navbarNav">
                <ul className="navbar-nav me-auto">
                  <li className="nav-item">
                    <a 
                      className="nav-link" 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/extranet/dashboard');
                        setIsNavCollapsed(true);
                      }}
                    >
                      Inicio
                    </a>
                  </li>
                  <li className="nav-item dropdown"
                    onMouseEnter={() => handleDropdownMouseEnter('crear')}
                    onMouseLeave={handleDropdownContainerMouseLeave}
                  >
                    <button 
                      className={`nav-link dropdown-toggle ${activeDropdown === 'crear' ? 'active' : ''}`}
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === 'crear' ? null : 'crear')}
                    >
                      Crear
                    </button>
                    <ul className={`dropdown-menu ${activeDropdown === 'crear' ? 'show' : ''}`}>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'nueva-actividad' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('nueva-actividad')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Nueva actividad')}
                        >
                          Nueva actividad
                        </a>
                      </li>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'oferta-especial' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('oferta-especial')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Oferta especial')}
                        >
                          Oferta especial
                        </a>
                      </li>
                    </ul>
                  </li>
                  <li className="nav-item dropdown"
                    onMouseEnter={() => handleDropdownMouseEnter('gestionar')}
                    onMouseLeave={handleDropdownContainerMouseLeave}
                  >
                   <button 
                     className={`nav-link dropdown-toggle ${activeDropdown === 'gestionar' ? 'active' : ''}`}
                     type="button"
                     onClick={() => setActiveDropdown(activeDropdown === 'gestionar' ? null : 'gestionar')}
                   >
                     Gestionar
                   </button>
                    <ul className={`dropdown-menu ${activeDropdown === 'gestionar' ? 'show' : ''}`}>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'disponibilidad' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('disponibilidad')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Disponibilidad')}
                        >
                          Disponibilidad
                        </a>
                      </li>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'actividades' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('actividades')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Actividades')}
                        >
                          Actividades
                        </a>
                      </li>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'ofertas-especiales' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('ofertas-especiales')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Ofertas especiales')}
                        >
                          Ofertas especiales
                        </a>
                      </li>
                    </ul>
                 </li>
                  <li className="nav-item dropdown"
                    onMouseEnter={() => handleDropdownMouseEnter('reservas')}
                    onMouseLeave={handleDropdownContainerMouseLeave}
                  >
                   <button 
                     className={`nav-link dropdown-toggle ${activeDropdown === 'reservas' ? 'active' : ''}`}
                     type="button"
                     onClick={() => setActiveDropdown(activeDropdown === 'reservas' ? null : 'reservas')}
                   >
                     Reservas
                   </button>
                    <ul className={`dropdown-menu ${activeDropdown === 'reservas' ? 'show' : ''}`}>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'reservas' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('reservas')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Reservas')}
                        >
                          Reservas
                        </a>
                      </li>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'escaner-tickets' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('escaner-tickets')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Escaner de tickets')}
                        >
                          Escaner de tickets
                        </a>
                      </li>
                    </ul>
                 </li>
                  <li className="nav-item dropdown"
                    onMouseEnter={() => handleDropdownMouseEnter('rendimiento')}
                    onMouseLeave={handleDropdownContainerMouseLeave}
                  >
                   <button 
                     className={`nav-link dropdown-toggle ${activeDropdown === 'rendimiento' ? 'active' : ''}`}
                     type="button"
                     onClick={() => setActiveDropdown(activeDropdown === 'rendimiento' ? null : 'rendimiento')}
                   >
                     Rendimiento
                   </button>
                    <ul className={`dropdown-menu ${activeDropdown === 'rendimiento' ? 'show' : ''}`}>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'resenas' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('resenas')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Reseñas')}
                        >
                          Reseñas
                        </a>
                      </li>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'analiticas' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('analiticas')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Analiticas')}
                        >
                          Analiticas
                        </a>
                      </li>
                      <li>
                        <a 
                          className={`dropdown-item ${hoveredItem === 'sugerencias' ? 'hovered' : ''}`}
                          href="#"
                          onMouseEnter={() => handleItemMouseEnter('sugerencias')}
                          onMouseLeave={handleItemMouseLeave}
                          onClick={() => handleItemClick('Sugerencias')}
                        >
                          Sugerencias
                        </a>
                      </li>
                    </ul>
                 </li>
                                           <li className="nav-item">
                           <a
                             className="nav-link"
                             href="#"
                             onClick={(e) => {
                               e.preventDefault();
                               navigate('/extranet/finances');
                               setIsNavCollapsed(true);
                             }}
                           >
                             Finanzas
                           </a>
                         </li>
                </ul>
              </div>
            </nav>

            {/* Language/Currency Selector and User - Mobile Responsive */}
            <div className="d-flex align-items-center">
              {/* Language and Currency Selector - Hidden on mobile */}
              <div className="d-none d-md-flex align-items-center me-1">
                <button
                  className="btn d-flex flex-column align-items-center gap-1 py-2 px-3"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                  type="button"
                  onClick={openModal}
                >
                  <i className="fas fa-globe" style={{ fontSize: '32px' }}></i>
                  <div className="d-flex align-items-center">
                    <span className="small" style={{ fontSize: '0.7rem' }}>{getLanguageDisplay()}</span>
                    <span className="mx-1 small" style={{ fontSize: '0.7rem' }}>/</span>
                    <span className="small" style={{ fontSize: '0.7rem' }}>{getCurrencyDisplay()}</span>
                  </div>
                </button>
              </div>
              
              {/* Mobile Language/Currency Button */}
              <div className="d-md-none me-2">
                <button
                  className="btn btn-outline-primary btn-sm"
                  type="button"
                  onClick={openModal}
                  style={{ padding: '0.375rem 0.75rem' }}
                >
                  <i className="fas fa-globe me-1"></i>
                  <span className="small">{getLanguageDisplay()}/{getCurrencyDisplay()}</span>
                </button>
              </div>
              
              {/* User Profile Selector */}
              <div className="d-flex align-items-center position-relative user-dropdown-container">
                <button
                  className="btn d-flex align-items-center gap-2 py-2 px-3"
                  style={{ border: 'none', backgroundColor: 'transparent' }}
                  type="button"
                  onClick={toggleUserDropdown}
                >
                  {/* User Avatar */}
                  <div className="position-relative">
                    {user?.profileImageUrl ? (
                      <img 
                        src={user.profileImageUrl} 
                        alt={user.nickname || 'Usuario'}
                        style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback Avatar with Initial */}
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#4285f4',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        display: user?.profileImageUrl ? 'none' : 'flex'
                      }}
                    >
                      {getUserInitial(user?.nickname || 'Usuario')}
                    </div>
                  </div>
                  
                  {/* User Nickname - Hidden on mobile */}
                  <div className="d-none d-md-flex align-items-center">
                    <span className="small" style={{ fontSize: '0.7rem' }}>
                      {user?.nickname || 'Usuario'}
                    </span>
                  </div>
                </button>
                
                {/* User Dropdown Menu */}
                {isUserDropdownOpen && (
                  <div 
                    className="position-absolute top-100 end-0 mt-2 bg-white border rounded shadow-lg"
                    style={{ 
                      minWidth: '200px',
                      zIndex: 1000
                    }}
                  >
                    <div className="p-3 border-bottom">
                      <div className="d-flex align-items-center">
                        {/* User Avatar in Dropdown */}
                        <div className="position-relative me-3">
                          {user?.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={user.nickname || 'Usuario'}
                              style={{ 
                                width: '40px', 
                                height: '40px', 
                                borderRadius: '50%',
                                objectFit: 'cover'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          
                          {/* Fallback Avatar with Initial */}
                          <div 
                            className="d-flex align-items-center justify-content-center"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#4285f4',
                              color: 'white',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              display: user?.profileImageUrl ? 'none' : 'flex'
                            }}
                          >
                            {getUserInitial(user?.nickname || 'Usuario')}
                          </div>
                        </div>
                        
                        <div>
                          <div className="fw-bold">{user?.nickname || 'Usuario'}</div>
                          <div className="text-muted small">{user?.username || 'usuario@email.com'}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        className="btn btn-outline-danger btn-sm w-100"
                        onClick={handleUserLogout}
                      >
                        <i className="fas fa-sign-out-alt me-2"></i>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`container px-3 px-md-4 py-3 py-md-4 ${isHeaderFloating ? 'pt-5' : ''}`}>
        {children}
      </div>
      
      {/* Language Currency Modal */}
      <LanguageCurrencyModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </div>
  );
};

export default NavbarExtranet; 