# Sistema de Loading Global para Extranet

## Descripción

El sistema de loading global para el extranet proporciona una experiencia de usuario consistente durante las operaciones que requieren comunicación con el backend. El loading ocupa toda la pantalla y bloquea la interacción del usuario hasta que todas las operaciones terminen.

## Características

- **Pantalla completa**: El loading ocupa toda la pantalla con un overlay semi-transparente
- **Bloqueo de interacción**: El usuario no puede interactuar con la interfaz mientras carga
- **Múltiples operaciones**: Puede manejar múltiples operaciones simultáneas
- **Contador de operaciones**: Muestra cuántas operaciones están en progreso
- **Backdrop blur**: Efecto de desenfoque para mejor UX

## Componentes

### LoadingContext
Contexto global que maneja el estado de loading.

```typescript
interface LoadingContextType {
  isLoading: boolean;
  startLoading: (id: string) => void;
  stopLoading: (id: string) => void;
  loadingCount: number;
}
```

### LoadingProvider
Proveedor del contexto que incluye el overlay de loading.

### useExtranetLoading Hook
Hook personalizado para facilitar el uso del loading.

```typescript
const { withLoading, startOperation, stopOperation } = useExtranetLoading();
```

## Uso

### 1. Uso Automático con withLoading

```typescript
import { useExtranetLoading } from '../../hooks/useExtranetLoading';

const MyComponent = () => {
  const { withLoading } = useExtranetLoading();

  const handleSubmit = async () => {
    await withLoading(async () => {
      // Tu operación aquí
      await apiCall();
    }, 'operation-id');
  };
};
```

### 2. Control Manual

```typescript
const { startOperation, stopOperation } = useExtranetLoading();

const handleManualOperation = () => {
  startOperation('manual-op');
  
  // Tu operación
  setTimeout(() => {
    stopOperation('manual-op');
  }, 3000);
};
```

### 3. Múltiples Operaciones Simultáneas

```typescript
const handleMultipleOperations = async () => {
  await withLoading(async () => {
    const operations = [
      apiCall1(),
      apiCall2(),
      apiCall3()
    ];
    
    // Esperar a que todas terminen
    await Promise.all(operations);
  }, 'multiple-operations');
};
```

## Ejemplos de Implementación

### Dashboard
El Dashboard demuestra cómo cargar múltiples datos simultáneamente:

```typescript
useEffect(() => {
  const loadDashboardData = async () => {
    await withLoading(async () => {
      // Simular múltiples llamadas al backend
      await Promise.all([
        loadStatistics(),
        loadRecentActivities(),
        loadFinancialData()
      ]);
    }, 'dashboard-loading');
  };

  loadDashboardData();
}, [withLoading]);
```

### ActivityList
La lista de actividades usa el loading global en lugar del loading local:

```typescript
useEffect(() => {
  const fetchActivities = async () => {
    await withLoading(async () => {
      const response = await activitiesApi.search(params);
      setActivities(response.data);
    }, 'activities-loading');
  };

  fetchActivities();
}, [dependencies]);
```

### NewActivity
Página que demuestra múltiples operaciones simultáneas:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  await withLoading(async () => {
    const operations = [
      validateData(),
      uploadImages(),
      createActivity(),
      sendNotifications()
    ];

    await Promise.all(operations);
  }, 'create-activity');
};
```

## Configuración

El sistema está configurado automáticamente en `ExtranetLayout.tsx`:

```typescript
import { LoadingProvider } from '../context/LoadingContext';

const ExtranetLayout: React.FC = () => {
  return (
    <LoadingProvider>
      <Outlet />
    </LoadingProvider>
  );
};
```

## Estilos del Loading

El overlay de loading incluye:

- Fondo semi-transparente (`rgba(0, 0, 0, 0.7)`)
- Efecto de desenfoque (`backdrop-filter: blur(2px)`)
- Spinner centrado con texto informativo
- Contador de operaciones activas
- z-index alto (9999) para estar por encima de todo

## Mejores Prácticas

1. **Usar IDs únicos**: Cada operación debe tener un ID único
2. **Manejar errores**: Siempre usar try-catch dentro de withLoading
3. **Operaciones paralelas**: Usar Promise.all para operaciones independientes
4. **Feedback al usuario**: Mostrar mensajes informativos sobre el progreso
5. **Timeouts**: Considerar timeouts para operaciones largas

## Ventajas

- **UX consistente**: Misma experiencia en toda la aplicación
- **Prevención de errores**: Evita clics múltiples durante operaciones
- **Feedback visual**: El usuario sabe que algo está pasando
- **Escalable**: Maneja múltiples operaciones simultáneas
- **Fácil de usar**: API simple y intuitiva 