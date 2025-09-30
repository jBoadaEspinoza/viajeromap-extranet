import { useState, useEffect } from 'react';

interface UseSidebarStateProps {
  defaultCollapsed?: boolean;
  storageKey?: string;
  persistState?: boolean;
}

export const useSidebarState = ({
  defaultCollapsed = false,
  storageKey = 'sidebar-collapsed',
  persistState = true
}: UseSidebarStateProps = {}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // Cargar estado desde localStorage al inicializar
  useEffect(() => {
    if (persistState) {
      const savedState = localStorage.getItem(storageKey);
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
    }
  }, [storageKey, persistState]);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    if (persistState) {
      localStorage.setItem(storageKey, JSON.stringify(isCollapsed));
    }
  }, [isCollapsed, storageKey, persistState]);

  const toggleSidebar = () => {
    setIsCollapsed(prev => !prev);
  };

  const expandSidebar = () => {
    setIsCollapsed(false);
  };

  const collapseSidebar = () => {
    setIsCollapsed(true);
  };

  return {
    isCollapsed,
    toggleSidebar,
    expandSidebar,
    collapseSidebar,
    setIsCollapsed
  };
};
