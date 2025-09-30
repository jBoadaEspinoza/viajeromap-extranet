# Sidebars Collapsibles Modernos

## Descripción

Sistema de sidebars collapsibles modernos implementado en la aplicación, que permite a los usuarios expandir y colapsar los paneles laterales para optimizar el espacio de trabajo.

## Componentes Implementados

### 1. CollapsibleSidebar

Componente principal que maneja la funcionalidad de colapsar/expandir el sidebar.

#### Propiedades

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `children` | `React.ReactNode` | ✅ | Contenido del sidebar |
| `title` | `string` | ❌ | Título del sidebar |
| `isCollapsed` | `boolean` | ✅ | Estado del sidebar (colapsado/expandido) |
| `onToggle` | `() => void` | ✅ | Función para alternar el estado |
| `variant` | `'primary' \| 'dark'` | ❌ | Variante de color (por defecto: 'dark') |
| `width` | `number` | ❌ | Ancho del sidebar expandido (por defecto: 280) |
| `className` | `string` | ❌ | Clases CSS adicionales |

#### Ejemplo de Uso

```tsx
<CollapsibleSidebar
  title="Navegación"
  isCollapsed={isCollapsed}
  onToggle={toggleSidebar}
  variant="primary"
  width={280}
  className="h-100"
>
  {/* Contenido del sidebar */}
</CollapsibleSidebar>
```

### 2. useSidebarState

Hook personalizado para manejar el estado del sidebar con persistencia en localStorage.

### 3. MobileSidebarToggle

Componente para el botón de toggle del sidebar en dispositivos móviles.

#### Propiedades

| Propiedad | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `onClick` | `() => void` | ✅ | Función para abrir el sidebar |
| `isVisible` | `boolean` | ❌ | Si mostrar el botón (por defecto: true) |
| `className` | `string` | ❌ | Clases CSS adicionales |

#### Ejemplo de Uso

```tsx
<MobileSidebarToggle
  onClick={handleOpenSidebar}
  isVisible={window.innerWidth <= 768}
  className="custom-mobile-toggle"
/>
```

#### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `defaultCollapsed` | `boolean` | ❌ | Estado inicial (por defecto: false) |
| `storageKey` | `string` | ❌ | Clave para localStorage (por defecto: 'sidebar-collapsed') |
| `persistState` | `boolean` | ❌ | Si persistir el estado (por defecto: true) |

#### Retorno

```typescript
{
  isCollapsed: boolean;
  toggleSidebar: () => void;
  expandSidebar: () => void;
  collapseSidebar: () => void;
  setIsCollapsed: (value: boolean) => void;
}
```

#### Ejemplo de Uso

```tsx
const { isCollapsed, toggleSidebar } = useSidebarState({
  defaultCollapsed: false,
  storageKey: 'my-sidebar',
  persistState: true
});
```

## Características del Sistema

### 1. **Animaciones Suaves**
- Transiciones CSS con `cubic-bezier(0.4, 0, 0.2, 1)`
- Duración de 300ms para todas las animaciones
- Efectos de hover y active en botones

### 2. **Estados del Sidebar**

#### **Expandido (280px/400px)**
- Muestra título completo
- Contenido visible con opacidad 100%
- Botón de toggle con flecha hacia la izquierda

#### **Colapsado (60px)**
- Solo muestra icono de barras
- Contenido oculto con opacidad 0%
- Botón de toggle con flecha hacia la derecha

### 3. **Responsive Design**
- **Desktop**: Sidebar inline con ancho variable
- **Mobile**: Sidebar fijo con overlay y gestos táctiles
- Breakpoint en 768px
- **Móvil**: Sidebar de ancho completo (max-width: 320px)

### 4. **Gestos Táctiles (Móvil)**
- **Swipe Izquierda**: Cerrar sidebar (distancia > 50px)
- **Swipe Derecha**: Abrir sidebar (distancia > 50px)
- **Touch Events**: Manejo nativo de eventos táctiles
- **Smooth Scrolling**: Scroll optimizado para dispositivos táctiles

### 5. **Persistencia de Estado**
- Estado guardado en localStorage
- Restauración automática al recargar la página
- Claves únicas por tipo de sidebar

### 6. **Funcionalidades Móviles**
- **Overlay**: Fondo oscuro con desenfoque al abrir sidebar
- **Gestos Táctiles**: Swipe izquierda para cerrar, derecha para abrir
- **Botón Flotante**: Botón hamburguesa fijo en la esquina superior izquierda
- **Click Fuera**: Cerrar sidebar al tocar fuera del área
- **Scroll Táctil**: Scroll suave con `-webkit-overflow-scrolling: touch`

## Implementación en Layouts

### ActivityCreationLayout

```tsx
// Hook para manejar el estado del sidebar
const { isCollapsed, toggleSidebar } = useSidebarState({
  defaultCollapsed: false,
  storageKey: 'activity-creation-sidebar',
  persistState: true
});

// Uso del componente
<CollapsibleSidebar
  title={getTranslation('sidebar.navigation', language)}
  isCollapsed={isCollapsed}
  onToggle={toggleSidebar}
  variant="primary"
  width={280}
  className="h-100"
>
  {/* Navegación de pasos */}
</CollapsibleSidebar>
```

### OptionSetupLayout

```tsx
// Hook para manejar el estado del sidebar
const { isCollapsed, toggleSidebar } = useSidebarState({
  defaultCollapsed: false,
  storageKey: 'option-setup-sidebar',
  persistState: true
});

// Uso del componente
<CollapsibleSidebar
  title={activityTitle}
  isCollapsed={isCollapsed}
  onToggle={toggleSidebar}
  variant="dark"
  width={400}
  className="h-100"
>
  {/* Configuración de opciones */}
</CollapsibleSidebar>
```

## Estilos CSS

### Clases Principales

```css
.collapsible-sidebar {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.collapsible-sidebar .sidebar-header {
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

.collapsible-sidebar .sidebar-content {
  flex: 1;
  padding: 1rem;
}
```

### Variantes de Color

#### **Primary (Azul)**
- Usado en ActivityCreationLayout
- Fondo: `bg-primary`
- Texto: `text-white`

#### **Dark (Oscuro)**
- Usado en OptionSetupLayout
- Fondo: `bg-dark`
- Texto: `text-white`

### Efectos Visuales

- **Backdrop Filter**: Efecto de desenfoque en headers
- **Sombras**: `shadow-lg` para profundidad
- **Bordes**: `border-end` para separación visual
- **Hover Effects**: Transformaciones y cambios de color

## Beneficios del Sistema

### 1. **Optimización de Espacio**
- Más espacio para el contenido principal
- Mejor aprovechamiento de pantallas pequeñas
- Flexibilidad para diferentes workflows

### 2. **Experiencia de Usuario**
- Control total sobre la interfaz
- Estado persistente entre sesiones
- Animaciones suaves y profesionales

### 3. **Mantenibilidad**
- Componente reutilizable
- Hook personalizado para lógica
- Estilos CSS modulares

### 4. **Accesibilidad**
- Tooltips en botones de toggle
- Estados visuales claros
- Navegación por teclado

## Casos de Uso

### 1. **Pantallas Pequeñas**
- Sidebar colapsado por defecto
- Más espacio para formularios
- Navegación rápida con iconos

### 2. **Pantallas Grandes**
- Sidebar expandido por defecto
- Información completa visible
- Navegación detallada

### 3. **Workflows Intensivos**
- Colapsar sidebar durante edición
- Expandir para navegación
- Cambio dinámico según necesidades

## Testing

### Escenarios de Prueba

1. **Toggle del Sidebar**
   - Click en botón de toggle
   - Verificar animación suave
   - Confirmar cambio de estado

2. **Persistencia**
   - Colapsar sidebar
   - Recargar página
   - Verificar estado restaurado

3. **Responsive**
   - Cambiar tamaño de ventana
   - Probar en dispositivos móviles
   - Verificar comportamiento correcto

4. **Accesibilidad**
   - Navegación por teclado
   - Screen readers
   - Contraste de colores

5. **Funcionalidades Móviles**
   - Swipe izquierda/derecha
   - Botón flotante visible
   - Overlay funcional
   - Click fuera para cerrar

### Resultados Esperados

- ✅ Sidebar se colapsa/expande suavemente
- ✅ Estado se mantiene entre sesiones
- ✅ Funciona correctamente en todos los dispositivos
- ✅ Animaciones fluidas sin saltos
- ✅ Contenido se adapta al ancho del sidebar

## Futuras Mejoras

### 1. **Shortcuts de Teclado**
- `Ctrl + Shift + S` para toggle
- `Ctrl + Shift + E` para expandir
- `Ctrl + Shift + C` para colapsar

### 2. **Drag & Drop**
- Redimensionar sidebar arrastrando
- Límites mínimo y máximo
- Snap a posiciones predefinidas

### 3. **Temas Personalizables**
- Múltiples variantes de color
- Modo oscuro/claro
- Personalización por usuario

### 4. **Integración con Redux**
- Estado global del sidebar
- Sincronización entre componentes
- Historial de estados
