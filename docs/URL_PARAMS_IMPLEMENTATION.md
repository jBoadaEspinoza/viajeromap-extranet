# Implementación de Parámetros de URL para Actividades

## Resumen
Se ha implementado un sistema donde el `activityId` y otros parámetros se pasan por URL en lugar de usar Redux, evitando confusiones cuando se crean múltiples actividades simultáneamente.

## Archivos Creados

### 1. `src/hooks/useActivityParams.ts`
Hook personalizado para extraer parámetros de URL:
```typescript
export interface ActivityParams {
  activityId: string | null;
  lang: string;
  currency: string;
  currentStep?: number;
}

export const useActivityParams = (): ActivityParams
```

### 2. `src/utils/navigationUtils.ts`
Utilidades para navegación con parámetros:
```typescript
export const createActivityUrl = (path: string, params: NavigationParams): string
export const navigateToActivityStep = (navigate: NavigateFunction, path: string, params: NavigationParams): void
```

## Patrón de Implementación

### Para cada página de creación de actividades:

1. **Importar las utilidades necesarias:**
```typescript
import { useActivityParams } from '../../../hooks/useActivityParams';
import { navigateToActivityStep } from '../../../utils/navigationUtils';
```

2. **Reemplazar Redux con parámetros de URL:**
```typescript
// Antes
const { activityId, currentStep } = useAppSelector(state => state.activityCreation);

// Después
const { activityId, lang, currency, currentStep } = useActivityParams();
```

3. **Eliminar llamadas a setCurrentStep:**
```typescript
// Antes
useEffect(() => {
  dispatch(setCurrentStep(9));
}, [dispatch]);

// Después
// No need to set current step in Redux anymore, it comes from URL
```

4. **Actualizar funciones de navegación:**
```typescript
// Antes
const handleBack = () => {
  navigate('/extranet/activity/createImages');
};

// Después
const handleBack = () => {
  navigateToActivityStep(navigate, '/extranet/activity/createImages', {
    activityId,
    lang,
    currency,
    currentStep
  });
};
```

## Páginas Actualizadas

### ✅ Completadas:
- `src/pages/extranet/ActivityList.tsx`
- `src/pages/extranet/create_activity/StepItinerary.tsx`
- `src/pages/extranet/create_activity/StepOptions.tsx`
- `src/components/ActivityCreationLayout.tsx`

### 🔄 Pendientes de actualizar:
- `src/pages/extranet/create_activity/StepCategory.tsx`
- `src/pages/extranet/create_activity/StepTitle.tsx`
- `src/pages/extranet/create_activity/StepDescription.tsx`
- `src/pages/extranet/create_activity/StepRecommendation.tsx`
- `src/pages/extranet/create_activity/StepRestriction.tsx`
- `src/pages/extranet/create_activity/StepInclude.tsx`
- `src/pages/extranet/create_activity/StepNotInclude.tsx`
- `src/pages/extranet/create_activity/StepImages.tsx`
- `src/pages/extranet/create_activity/StepOptionSetup.tsx`
- `src/pages/extranet/create_activity/StepOptionMeetingPickup.tsx`
- `src/pages/extranet/create_activity/StepOptionAvailabilityPrice.tsx`
- `src/pages/extranet/create_activity/StepOptionAvailabilityPricingDepartureTime.tsx`
- `src/pages/extranet/create_activity/StepOptionCutOff.tsx`

## Beneficios

1. **Sin conflictos**: Cada actividad mantiene su propio estado en la URL
2. **Navegación consistente**: Todas las páginas usan el mismo patrón
3. **Fácil debugging**: Los parámetros son visibles en la URL
4. **Mejor UX**: Los usuarios pueden compartir enlaces específicos
5. **Escalabilidad**: Fácil agregar nuevos parámetros

## Estructura de URL

```
/extranet/activity/createCategory?activityId=123&lang=es&currency=PEN&currentStep=1
```

### Parámetros:
- `activityId`: ID único de la actividad (opcional para nuevas)
- `lang`: Idioma actual (es/en)
- `currency`: Moneda actual (PEN/USD)
- `currentStep`: Paso actual del proceso (1-10)

## Migración de Redux

### Mantener en Redux:
- `selectedCategory`: Categoría seleccionada
- `itinerary`: Datos del itinerario
- `options`: Opciones de reserva
- Otros datos específicos de la actividad

### Mover a URL:
- `activityId`: ID de la actividad
- `currentStep`: Paso actual
- `lang`: Idioma (ya estaba en context)
- `currency`: Moneda (ya estaba en context)
