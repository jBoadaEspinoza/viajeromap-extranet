import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const useExtranetAuth = () => {
  const { isAuthenticated, isInitialized, validateToken } = useAuth();
  const { language } = useLanguage();
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidationTime, setLastValidationTime] = useState<number>(0);

  // Validar token solo cuando sea necesario
  const validateTokenIfNeeded = useCallback(async (force: boolean = false) => {
    const now = Date.now();
    const timeSinceLastValidation = now - lastValidationTime;
    
    // Solo validar si:
    // 1. No está autenticado pero hay token
    // 2. Han pasado más de 5 minutos desde la última validación
    // 3. Se fuerza la validación
    const shouldValidate = force || 
      (!isAuthenticated && localStorage.getItem('authToken')) ||
      (isAuthenticated && timeSinceLastValidation > 5 * 60 * 1000); // 5 minutos

    if (shouldValidate && !isValidating) {
      setIsValidating(true);
      try {
        const result = await validateToken(language);
        if (result) {
          setLastValidationTime(now);
        } else {
          // Si la validación falla y no hay token válido, limpiar localStorage
          const authToken = localStorage.getItem('authToken');
          if (!authToken) {
            console.log('useExtranetAuth: Token no válido, limpiando estado');
            // No redirigir aquí, dejar que OptionSetupLayout maneje la redirección
          }
        }
      } catch (error) {
        console.error('Error validating token:', error);
        // En caso de error de red, no limpiar el estado de autenticación
        // Solo limpiar si es un error de token inválido
      } finally {
        setIsValidating(false);
      }
    }
  }, [isAuthenticated, isValidating, lastValidationTime, validateToken, language]);

  // Validar al montar el componente
  useEffect(() => {
    if (isInitialized) {
      validateTokenIfNeeded();
    }
  }, [isInitialized, validateTokenIfNeeded]);

  return {
    isAuthenticated,
    isInitialized,
    isValidating,
    validateTokenIfNeeded
  };
}; 