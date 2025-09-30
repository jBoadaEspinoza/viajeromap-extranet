# Peru Trips And Adventures

Aplicación web para agencia de viajes especializada en la Costa Sur de Perú (Paracas, Ica, Nazca).

## Características

- 🎨 **Colores Dinámicos**: Los colores se configuran desde `appConfig.ts` y se aplican automáticamente
- 🌐 **Multiidioma**: Soporte para español e inglés
- 💰 **Multi-moneda**: Soporte para PEN y USD
- 📱 **Responsive**: Diseño adaptativo para móviles y desktop
- 🔍 **Búsqueda Avanzada**: Filtros por destino, fecha y viajeros
- 🖼️ **Galería de Imágenes**: Visualización de actividades con lightGallery
- 📊 **API Integration**: Conexión con backend para datos dinámicos

## Configuración Simple

Este sistema usa un archivo de configuración centralizado para gestionar toda la información del negocio.

### Archivo de Configuración

El archivo principal está en `src/config/appConfig.ts`:

```typescript
export const appConfig: AppConfig = {
  business: {
    ruc: "10430391564",           // RUC del negocio
    name: "Peru Trips And Adventures", // Nombre del negocio
    website: "perutripsadventures.com", // Sitio web
    phone: "+51 1 234 5678",    // Teléfono
    address: "Lima, Perú",       // Dirección
    email: "info@perutripsadventures.com" // Email
  },
  colors: {
    primary: "#DC143C",         // Color primario
    secondary: "#2C3E50",       // Color secundario
    accent: "#FFC107"           // Color de acento
  },
  api: {
    baseUrl: "https://tg4jd2gc-8080.brs.devtunnels.ms", // URL de la API
    timeout: 10000              // Timeout de las peticiones
  }
};
```

## Cómo Usar

### 1. Cambiar el RUC
Para cambiar el RUC del negocio, simplemente edita el archivo `src/config/appConfig.ts`:

```typescript
business: {
  ruc: "TU_NUEVO_RUC", // Cambia este valor
  // ... resto de la configuración
}
```

### 2. Cambiar Colores
Para cambiar los colores de la aplicación, edita el archivo `src/config/appConfig.ts`:

```typescript
colors: {
  primary: "#007bff",    // Color primario (azul)
  secondary: "#6c757d",  // Color secundario (gris)
  accent: "#ffc107"      // Color de acento (amarillo)
}
```

**Los colores se aplican automáticamente a:**
- Botones primarios y secundarios
- Badges y etiquetas
- Textos con clases `.text-primary` y `.text-secondary`
- Fondos con clases `.bg-primary` y `.bg-secondary`
- Bordes con clases `.border-primary` y `.border-secondary`
- Elementos de navegación
- Formularios y campos de entrada
- Todos los elementos que usan las variables CSS dinámicas

**Ejemplos de colores que puedes usar:**
- Azul: `#007bff`
- Verde: `#28a745`
- Rojo: `#dc3545`
- Naranja: `#fd7e14`
- Púrpura: `#6f42c1`
- Teal: `#20c997`

### 3. Cambiar Información del Negocio
Para cambiar la información del negocio:

```typescript
business: {
  ruc: "20123456789",
  name: "Tu Nombre de Negocio",
  website: "tudominio.com",
  phone: "+51 1 234 5678",
  address: "Tu Dirección",
  email: "tu@email.com"
}
```

## Uso Automático

El sistema automáticamente:

1. **Carga el RUC** en todas las llamadas a la API
2. **Aplica los colores** a toda la aplicación
3. **Muestra la información del negocio** en el footer
4. **Establece el título de la página** con el nombre del negocio

## API Calls

Todas las llamadas a la API automáticamente incluyen el RUC como `companyId`:

- `GET /api/v1/activities/search?companyId=10430391564`
- `GET /api/v1/activities/search/{id}?companyId=10430391564`
- `GET /api/v1/activities/destinations?companyId=10430391564`

## Reinicio Necesario

Después de cambiar el archivo de configuración:

1. **Guarda el archivo** `src/config/appConfig.ts`
2. **Reinicia el servidor de desarrollo**: `Ctrl+C` → `npm run dev`
3. **Recarga la página** del navegador

Los cambios se aplicarán automáticamente después del reinicio.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
├── pages/              # Páginas principales
├── context/            # Contextos de React (Language, Currency, Config)
├── api/                # Configuración de API y servicios
├── utils/              # Utilidades y helpers
├── config/             # Configuración de la aplicación
└── index.css           # Estilos globales con variables CSS dinámicas
```

## Tecnologías

- **React 18** con TypeScript
- **Vite** para desarrollo y build
- **Bootstrap 5** para estilos
- **Axios** para llamadas API
- **React Router** para navegación
- **FontAwesome** para iconos

## Características Técnicas

- **CSS Variables Dinámicas**: Los colores se aplican usando variables CSS que se actualizan automáticamente
- **Context API**: Gestión de estado global para idioma, moneda y configuración
- **Responsive Design**: Diseño adaptativo usando Bootstrap Grid
- **TypeScript**: Tipado estático para mejor desarrollo
- **Hot Module Replacement**: Recarga automática durante desarrollo
