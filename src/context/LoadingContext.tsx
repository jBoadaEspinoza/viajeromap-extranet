import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (id: string) => void;
  stopLoading: (id: string) => void;
  loadingCount: number;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    // Return a fallback context instead of throwing an error
    return {
      isLoading: false,
      startLoading: () => {},
      stopLoading: () => {},
      loadingCount: 0
    };
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Set<string>>(new Set());

  const startLoading = useCallback((id: string) => {
    setLoadingStates(prev => new Set(prev).add(id));
  }, []);

  const stopLoading = useCallback((id: string) => {
    setLoadingStates(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  const isLoading = loadingStates.size > 0;
  const loadingCount = loadingStates.size;

  return (
    <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading, loadingCount }}>
      {children}
      {/* Full-screen loading overlay */}
      {isLoading && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            backdropFilter: 'blur(2px)'
          }}
        >
          <div className="text-center text-white">
            <div className="spinner-border text-light mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Cargando...</span>
            </div>
            <div className="h5 mb-2">Cargando...</div>
            <div className="small text-light">
              {loadingCount > 1 ? `Esperando ${loadingCount} operaciones...` : 'Por favor espere'}
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}; 