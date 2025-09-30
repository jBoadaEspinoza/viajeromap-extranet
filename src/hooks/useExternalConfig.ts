import { useState, useEffect } from 'react';
import { appConfig, type AppConfig } from '../config/appConfig';

export const useExternalConfig = () => {
  const [config, setConfig] = useState<AppConfig>(appConfig);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExternalConfig = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Intentar cargar configuración externa
        const response = await fetch('/config.json');
        
        if (response.ok) {
          const externalConfig = await response.json();
          setConfig(externalConfig);
        } else {
          // Si no existe el archivo externo, usar configuración por defecto
          console.warn('No se encontró config.json, usando configuración por defecto');
          setConfig(appConfig);
        }
      } catch (error) {
        console.error('Error cargando configuración externa:', error);
        setError('Error cargando configuración');
        // Usar configuración por defecto en caso de error
        setConfig(appConfig);
      } finally {
        setLoading(false);
      }
    };

    loadExternalConfig();
  }, []);

  return { config, loading, error };
}; 