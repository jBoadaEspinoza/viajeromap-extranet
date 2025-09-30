# Sistema de Loading Global

## Descripción
Sistema de loading global que proporciona una experiencia de usuario consistente durante las operaciones asíncronas en toda la aplicación. El sistema incluye un overlay de pantalla completa que bloquea la interacción del usuario hasta que todas las operaciones concurrentes se completen.

## Características

### ✅ **Funcionalidades Principales**
- **Overlay de Pantalla Completa**: Cubre toda la pantalla durante las operaciones
- **Bloqueo de Interacción**: Previene que el usuario interactúe con la interfaz
- **Contador de Operaciones**: Muestra cuántas operaciones están en progreso
- **Múltiples Operaciones Simultáneas**: Espera a que todas las operaciones terminen
- **Sistema Global**: Disponible en todas las páginas (extranet y público)

### 🎯 **Componentes del Sistema**

#### 1. **LoadingContext** (`src/context/LoadingContext.tsx`)
- Proporciona el contexto global para el estado de loading
- Maneja el contador de operaciones activas
- Renderiza el overlay de loading

#### 2. **LoadingProvider** 
- Envuelve la aplicación para proporcionar el contexto
- Renderiza el overlay de loading cuando hay operaciones activas
- Se integra en `ConditionalLayout` para páginas públicas y `ExtranetLayout` para extranet

#### 3. **useGlobalLoading** (`src/hooks/useGlobalLoading.ts`)
- Hook personalizado para usar el sistema de loading
- Proporciona funciones para controlar operaciones de loading
- Disponible en todas las páginas de la aplicación

### 🔧 **Funciones Disponibles**

```typescript
const { withLoading, startOperation, stopOperation } = useGlobalLoading();
```

#### **withLoading(operation, operationId)**
- Envuelve una operación asíncrona con loading automático
- Inicia el loading antes de la operación
- Detiene el loading después de completar (incluso si hay error)

#### **startOperation(operationId)**
- Inicia manualmente una operación de loading
- Útil para operaciones complejas o múltiples pasos

#### **stopOperation(operationId)**
- Detiene manualmente una operación de loading
- Debe usarse en conjunto con `startOperation`

## 📋 **Uso en Páginas**

### **Páginas Públicas**
- **Home**: Carga de destinos
- **Search**: Búsqueda de actividades
- **Activities**: Lista de actividades
- **ActivityDetail**: Detalles de actividad

### **Páginas Extranet**
- **Dashboard**: Carga de estadísticas y datos
- **ActivityList**: Lista de actividades del extranet
- **NewActivity**: Creación de nuevas actividades

## 🚀 **Ejemplos de Implementación**

### **Ejemplo 1: Operación Automática**
```typescript
const { withLoading } = useGlobalLoading();

useEffect(() => {
  const fetchData = async () => {
    await withLoading(async () => {
      const response = await api.getData();
      setData(response.data);
    }, 'fetch-data');
  };
  
  fetchData();
}, [withLoading]);
```

### **Ejemplo 2: Múltiples Operaciones Simultáneas**
```typescript
const { withLoading } = useGlobalLoading();

const handleSubmit = async () => {
  await withLoading(async () => {
    // Múltiples operaciones que se ejecutan en paralelo
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

### **Ejemplo 3: Control Manual**
```typescript
const { startOperation, stopOperation } = useGlobalLoading();

const handleComplexOperation = () => {
  startOperation('complex-operation');
  
  // Lógica compleja...
  setTimeout(() => {
    stopOperation('complex-operation');
  }, 3000);
};
```

## 🎨 **Estilos y UX**

### **Overlay de Loading**
- Fondo semi-transparente que cubre toda la pantalla
- Spinner centrado con animación suave
- Contador de operaciones activas
- Texto informativo para el usuario

### **Estados Visuales**
- **Cargando**: Overlay visible con spinner
- **Completado**: Overlay se desvanece automáticamente
- **Error**: Overlay se desvanece, error se maneja en el componente

## ⚙️ **Configuración**

### **Integración en Layouts**
```typescript
// ConditionalLayout.tsx (páginas públicas)
<LoadingProvider>
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main>{children}</main>
    <Footer />
  </div>
</LoadingProvider>

// ExtranetLayout.tsx (páginas extranet)
<LoadingProvider>
  <Outlet />
</LoadingProvider>
```

### **Hook de Loading**
```typescript
// useGlobalLoading.ts
export const useGlobalLoading = () => {
  const { startLoading, stopLoading } = useLoading();
  
  const withLoading = useCallback(async (operation, operationId) => {
    try {
      startLoading(operationId);
      return await operation();
    } finally {
      stopLoading(operationId);
    }
  }, [startLoading, stopLoading]);
  
  return { withLoading, startOperation, stopOperation };
};
```

## 📊 **Métricas y Monitoreo**

### **Operaciones Rastreadas**
- `home-destinations`: Carga de destinos en Home
- `search-activities`: Búsqueda de actividades
- `activities-loading`: Carga de lista de actividades
- `activities-destinations`: Carga de destinos en Activities
- `activities-clear-filters`: Limpieza de filtros
- `activity-detail`: Carga de detalles de actividad
- `dashboard-loading`: Carga de datos del dashboard
- `activities-loading`: Carga de actividades en extranet
- `create-activity`: Creación de nueva actividad

### **Beneficios**
- **UX Consistente**: Misma experiencia en toda la aplicación
- **Feedback Visual**: Usuario siempre sabe que algo está cargando
- **Prevención de Errores**: Bloqueo de interacciones durante operaciones
- **Escalabilidad**: Fácil agregar loading a nuevas páginas

## 🔄 **Flujo de Trabajo**

1. **Usuario navega a una página**
2. **Componente inicia operaciones** usando `withLoading`
3. **LoadingProvider detecta operaciones activas**
4. **Overlay se muestra** con spinner y contador
5. **Operaciones se completan** (exitosas o con error)
6. **Overlay se desvanece** automáticamente
7. **Usuario puede interactuar** con la página

## ✅ **Páginas Implementadas**

### **Páginas Públicas**
- ✅ **Home**: Carga de destinos
- ✅ **Search**: Búsqueda de actividades  
- ✅ **Activities**: Lista de actividades
- ✅ **ActivityDetail**: Detalles de actividad

### **Páginas Extranet**
- ✅ **Dashboard**: Carga de estadísticas
- ✅ **ActivityList**: Lista de actividades
- ✅ **NewActivity**: Creación de actividades

## 🎯 **Resultado Final**

El sistema de loading global proporciona:
- **Experiencia de usuario consistente** en toda la aplicación
- **Feedback visual claro** durante operaciones asíncronas
- **Prevención de errores** por interacciones prematuras
- **Escalabilidad** para futuras páginas y funcionalidades
- **Código limpio y mantenible** con hooks reutilizables 