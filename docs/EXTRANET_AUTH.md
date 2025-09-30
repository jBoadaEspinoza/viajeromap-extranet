# Sistema de Autenticación para Extranet

## Descripción

Este sistema implementa la verificación de token JWT para las rutas protegidas de la extranet. El token se almacena en una cookie HTTP-only y se verifica automáticamente al acceder a rutas protegidas.

## Componentes Principales

### 1. API de Autenticación (`src/api/auth.ts`)

```typescript
// Endpoint para verificar token
verifyToken: async (lang: string = 'es', currency: string = 'USD'): Promise<TokenInfoResponse>
```

**Endpoint:** `GET /api/v1/auth/token/info?lang=es&currency=USD`

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Información del token obtenida exitosamente",
  "data": {
    "user": { /* datos del usuario */ },
    "company": { /* datos de la empresa */ },
    "role": { /* datos del rol */ },
    "lang": "es",
    "currency": "USD"
  },
  "tokenExpirationMessage": "El token expira en 23 horas, 54 minutos",
  "tokenExpirationInSeg": "86088"
}
```

**Respuesta de error:**
```json
{
  "success": false,
  "errorCode": "TOKEN_EXPIRED"
}
```

### 2. Contexto de Autenticación (`src/context/AuthContext.tsx`)

```typescript
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  company: Company | null;
  role: Role | null;
  verifyTokenForExtranet: () => Promise<boolean>;
  logout: () => void;
}
```

### 3. Hook de Autenticación (`src/hooks/useExtranetAuth.ts`)

```typescript
export const useExtranetAuth = () => {
  return {
    isLoading: boolean;
    isValid: boolean;
    isAuthenticated: boolean;
  };
};
```

### 4. Componente de Protección (`src/components/ProtectedExtranetRoute.tsx`)

```typescript
<ProtectedExtranetRoute>
  <Extranet />
</ProtectedExtranetRoute>
```

## Flujo de Verificación

### 1. Acceso a Ruta Protegida
Cuando un usuario accede a una ruta protegida (ej: `/extranet/dashboard`):

1. **ProtectedExtranetRoute** se ejecuta
2. **useExtranetAuth** hook verifica el estado de autenticación
3. Si no está autenticado, llama a **verifyTokenForExtranet**

### 2. Verificación del Token
```typescript
const verifyTokenForExtranet = async (): Promise<boolean> => {
  try {
    const response = await authApi.verifyToken('es', 'USD');
    
    if (response.success) {
      // Token válido - actualizar estado
      setUser(response.data.user);
      setCompany(response.data.company);
      setRole(response.data.role);
      setIsAuthenticated(true);
      return true;
    } else {
      // Token inválido - redirigir al login
      logout();
      navigate('/extranet');
      return false;
    }
  } catch (error) {
    // Error de red - redirigir al login
    logout();
    navigate('/extranet');
    return false;
  }
};
```

### 3. Estados de Carga
- **Loading**: Muestra spinner mientras verifica
- **Valid**: Renderiza el componente protegido
- **Invalid**: Redirige automáticamente al login

## Configuración de Rutas

### Rutas Protegidas
```typescript
<Route path="dashboard" element={
  <ProtectedExtranetRoute>
    <Extranet />
  </ProtectedExtranetRoute>
} />
```

### Rutas Públicas
```typescript
<Route index element={<LoginExtranet />} />
```

## Uso en Componentes

### Acceder a Datos del Usuario
```typescript
const { user, company, role } = useAuth();

return (
  <div>
    <h1>Bienvenido, {user?.nickname}</h1>
    <p>Empresa: {company?.name}</p>
    <p>Rol: {role?.name}</p>
  </div>
);
```

### Verificar Estado de Autenticación
```typescript
const { isAuthenticated, isLoading } = useExtranetAuth();

if (isLoading) return <LoadingSpinner />;
if (!isAuthenticated) return <LoginForm />;
```

## Características de Seguridad

### ✅ Cookie HTTP-Only
- El token se almacena en una cookie HTTP-only
- No accesible desde JavaScript
- Se envía automáticamente en cada petición

### ✅ Verificación Automática
- Se verifica al acceder a rutas protegidas
- No se verifica en toda la aplicación
- Solo en la extranet

### ✅ Redirección Automática
- Si el token expira, redirige al login
- Si hay error de red, redirige al login
- Manejo de errores robusto

### ✅ Estado Global
- Datos del usuario disponibles globalmente
- Persistencia durante la sesión
- Limpieza automática al logout

## Ejemplos de Uso

### 1. Dashboard con Información del Usuario
```typescript
const ExtranetHome: React.FC = () => {
  const { user, company, role } = useAuth();
  
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Bienvenido, {user?.nickname} - {company?.name}</p>
      <p>Rol: {role?.name}</p>
    </div>
  );
};
```

### 2. Componente con Verificación Manual
```typescript
const MyComponent: React.FC = () => {
  const { verifyTokenForExtranet } = useAuth();
  
  const handleRefreshToken = async () => {
    const isValid = await verifyTokenForExtranet();
    if (!isValid) {
      // Token expirado
      console.log('Token expirado');
    }
  };
  
  return (
    <button onClick={handleRefreshToken}>
      Verificar Token
    </button>
  );
};
```

## Configuración del Backend

### Endpoint Requerido
```
GET /api/v1/auth/token/info?lang=es&currency=USD
```

### Headers
- `Authorization: Bearer <token>` (opcional, si no usa cookie)
- Cookie HTTP-only se envía automáticamente

### Respuestas Esperadas
- `success: true` con datos del usuario
- `success: false` con `errorCode` para errores

## Troubleshooting

### Token Expirado
- Error: `"TOKEN_EXPIRED"`
- Solución: Usuario debe hacer login nuevamente

### Error de Red
- Error: Network error
- Solución: Verificar conectividad y endpoint

### Cookie No Enviada
- Error: 401 Unauthorized
- Solución: Verificar configuración de cookies en backend 