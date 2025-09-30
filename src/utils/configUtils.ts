import { appConfig } from '../config/appConfig';

export const updateAppColors = (config = appConfig) => {
  const root = document.documentElement;

  // Variables CSS personalizadas
  root.style.setProperty('--app-primary', config.colors.primary);
  root.style.setProperty('--app-secondary', config.colors.secondary);
  root.style.setProperty('--app-accent', config.colors.accent);

  // Variables de Bootstrap
  root.style.setProperty('--bs-primary', config.colors.primary);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
      '245, 73, 39';
  };

  const primaryRgb = hexToRgb(config.colors.primary);
  const secondaryRgb = hexToRgb(config.colors.secondary);

  // Variables Bootstrap completas
  root.style.setProperty('--bs-primary-rgb', primaryRgb);
  root.style.setProperty('--bs-primary-text-emphasis', config.colors.primary);
  root.style.setProperty('--bs-primary-bg-subtle', `rgba(${primaryRgb}, 0.1)`);
  root.style.setProperty('--bs-primary-border-subtle', `rgba(${primaryRgb}, 0.2)`);

  // Variables secundarias
  root.style.setProperty('--bs-secondary', config.colors.secondary);
  root.style.setProperty('--bs-secondary-rgb', secondaryRgb);
  root.style.setProperty('--bs-secondary-text-emphasis', config.colors.secondary);
  root.style.setProperty('--bs-secondary-bg-subtle', `rgba(${secondaryRgb}, 0.1)`);
  root.style.setProperty('--bs-secondary-border-subtle', `rgba(${secondaryRgb}, 0.2)`);

  // Aplicar estilos dinámicamente a elementos específicos
  updateDynamicStyles(config);
};

const updateDynamicStyles = (config: { colors: { primary: string; secondary: string; accent: string } }) => {
  // Crear o actualizar estilos dinámicos
  let dynamicStyles = document.getElementById('dynamic-styles');
  if (!dynamicStyles) {
    dynamicStyles = document.createElement('style');
    dynamicStyles.id = 'dynamic-styles';
    document.head.appendChild(dynamicStyles);
  }

  const styles = `
    .navbar-brand {
      color: ${config.colors.primary} !important;
    }
    
    .navbar-brand:hover {
      color: ${getDarkerShade(config.colors.primary)} !important;
    }
    
    .nav-link:hover {
      color: ${config.colors.primary} !important;
    }
    
    .btn-primary {
      background-color: ${config.colors.primary};
      border-color: ${config.colors.primary};
    }
    
    .btn-primary:hover {
      background-color: ${getDarkerShade(config.colors.primary)};
      border-color: ${getDarkerShade(config.colors.primary)};
    }
    
    .btn-outline-primary {
      color: ${config.colors.primary};
      border-color: ${config.colors.primary};
    }
    
    .btn-outline-primary:hover {
      background-color: ${config.colors.primary};
      border-color: ${config.colors.primary};
    }
    
    .text-primary {
      color: ${config.colors.primary} !important;
    }
    
    .bg-primary {
      background-color: ${config.colors.primary} !important;
    }
    
    .border-primary {
      border-color: ${config.colors.primary} !important;
    }
    
    .badge.bg-primary {
      background-color: ${config.colors.primary} !important;
    }
    
    .badge.bg-primary.bg-opacity-10 {
      background-color: rgba(${hexToRgb(config.colors.primary)}, 0.1) !important;
    }
    
    .badge.text-primary {
      color: ${config.colors.primary} !important;
    }
    
    .badge.bg-outline-primary {
      background-color: transparent !important;
      color: ${config.colors.primary} !important;
      border: 1px solid ${config.colors.primary} !important;
    }
    
    .btn-primary:focus,
    .btn-primary:active {
      background-color: ${getDarkerShade(config.colors.primary)} !important;
      border-color: ${getDarkerShade(config.colors.primary)} !important;
    }
    
    .form-control:focus,
    .form-select:focus {
      border-color: ${config.colors.primary} !important;
      box-shadow: 0 0 0 0.2rem rgba(${hexToRgb(config.colors.primary)}, 0.25) !important;
    }
    
    .bg-secondary {
      background-color: ${config.colors.secondary} !important;
    }
    
    .text-secondary {
      color: ${config.colors.secondary} !important;
    }
    
    .border-secondary {
      border-color: ${config.colors.secondary} !important;
    }
  `;

  dynamicStyles.textContent = styles;
};

const getDarkerShade = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = Math.max(0, parseInt(result[1], 16) - 40);
  const g = Math.max(0, parseInt(result[2], 16) - 40);
  const b = Math.max(0, parseInt(result[3], 16) - 40);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ?
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
    '245, 73, 39';
};

// Get business info
export const getBusinessInfo = () => {
  return appConfig.business;
}; 