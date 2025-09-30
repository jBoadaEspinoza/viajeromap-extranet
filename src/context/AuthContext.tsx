import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../api/auth';
import type { LoginRequest, User, Company, Role, TokenInfoResponse } from '../api/auth';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  company: Company | null;
  role: Role | null;
  isInitialized: boolean;
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => void;
  validateToken: (lang?: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Función para navegar que se puede usar después de la inicialización
  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/extranet/login';
    }
  };

  // Validar token
  const validateToken = async (lang: string = 'es'): Promise<boolean> => {
    // Evitar validaciones simultáneas
    if (isValidating) {
      return isAuthenticated;
    }

    try {
      setIsValidating(true);
      const response: TokenInfoResponse = await authApi.validateToken(lang);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setCompany(response.data.company);
        setRole(response.data.role);
        setIsAuthenticated(true);
        
        // Guardar información del usuario en localStorage
        authApi.saveUserInfo(response.data);
        return true;
      } else {
        // Token inválido - limpiar estado
        console.log('AuthContext: Token inválido, limpiando estado');
        authApi.logout();
        setIsAuthenticated(false);
        setUser(null);
        setCompany(null);
        setRole(null);
        return false;
      }
    } catch (error: any) {
      // Distinguir entre errores de red y errores de token
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        // Token expirado o inválido
        console.log('AuthContext: Token expirado/inválido, limpiando estado');
        authApi.logout();
        setIsAuthenticated(false);
        setUser(null);
        setCompany(null);
        setRole(null);
        return false;
      } else {
        // Error de red - mantener estado actual
        console.log('AuthContext: Error de red, manteniendo estado de autenticación');
        return isAuthenticated;
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Login
  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authApi.login(credentials);
      
      if (response.success && response.token) {
        // Guardar token
        authApi.saveToken(response.token);
        
        // Validar token para obtener información del usuario
        const isValid = await validateToken('es');
        if (isValid) {
          return true;
        } else {
          setError('Error al obtener información del usuario');
          return false;
        }
      } else {
        setError(response.message || 'Error en el inicio de sesión');
        return false;
      }
    } catch (error: any) {
      setError(error.message || 'Error en el inicio de sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    authApi.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCompany(null);
    setRole(null);
    setError(null);
    navigateToLogin();
  };

  // Verificar token inicial al cargar la aplicación
  const verifyInitialToken = async (): Promise<void> => {
    try {
      // Solo validar si hay token en localStorage
      const token = localStorage.getItem('authToken');
      if (!token) {
        setIsInitialized(true);
        return;
      }

      const isValid = await validateToken('es');
      
      if (!isValid) {
        // Si no hay token válido y estamos en una ruta protegida, redirigir al login
        const currentPath = window.location.pathname;
        if (currentPath.startsWith('/extranet') && currentPath !== '/extranet/login') {
          navigateToLogin();
        }
      }
    } catch (error: any) {
      setIsAuthenticated(false);
    } finally {
      setIsInitialized(true);
    }
  };

  // Verificar token al inicializar la aplicación
  useEffect(() => {
    verifyInitialToken();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    company,
    role,
    isInitialized,
    login,
    logout,
    validateToken,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 