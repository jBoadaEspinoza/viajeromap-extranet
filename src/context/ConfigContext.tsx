import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { appConfig, type AppConfig } from '../config/appConfig';
import { updateAppColors } from '../utils/configUtils';
import { useExternalConfig } from '../hooks/useExternalConfig';

interface ConfigContextType {
  config: AppConfig;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const { config, loading, error } = useExternalConfig();

  // Update colors when config changes
  useEffect(() => {
    if (!loading) {
      updateAppColors(config);
    }
  }, [config.colors, loading]);

  return (
    <ConfigContext.Provider value={{
      config
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}; 