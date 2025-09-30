# Control de Ancho Máximo para el Extranet

## Descripción

El sistema de control de ancho máximo para el extranet evita que las páginas se expandan demasiado en pantallas muy anchas, proporcionando una mejor experiencia de usuario y legibilidad.

## Componente ExtranetContainer

### Importación
```tsx
import ExtranetContainer from '../../../components/ExtranetContainer';
```

### Uso Básico
```tsx
<ExtranetContainer maxWidth="xl">
  {/* Contenido de la página */}
</ExtranetContainer>
```

### Propiedades Disponibles

| Propiedad | Valor | Ancho Máximo | Descripción |
|-----------|-------|---------------|-------------|
| `maxWidth` | `"sm"` | 576px | Pantallas pequeñas |
| `maxWidth` | `"md"` | 768px | Pantallas medianas |
| `maxWidth` | `"lg"` | 992px | Pantallas grandes |
| `maxWidth` | `"xl"` | 1200px | Pantallas extra grandes (por defecto) |
| `maxWidth` | `"xxl"` | 1400px | Pantallas extra extra grandes |
| `maxWidth` | `"fluid"` | Sin límite | Ancho completo (como container-fluid) |

### Ejemplos de Uso

#### Página Principal del Extranet
```tsx
<ExtranetContainer maxWidth="xl">
  <div className="row">
    <div className="col-12">
      {/* Contenido principal */}
    </div>
  </div>
</ExtranetContainer>
```

#### Estados de Error o Loading
```tsx
<ExtranetContainer maxWidth="lg">
  <div className="row">
    <div className="col-12">
      <div className="alert alert-warning">
        {/* Mensaje de error */}
      </div>
    </div>
  </div>
</ExtranetContainer>
```

#### Formularios Complejos
```tsx
<ExtranetContainer maxWidth="xxl">
  <div className="row">
    <div className="col-12">
      {/* Formulario con muchas columnas */}
    </div>
  </div>
</ExtranetContainer>
```

## Estilos CSS

### Clases Principales
- `.extranet-container`: Contenedor principal con centrado automático
- `.max-width-{size}`: Clases para diferentes anchos máximos

### Responsive
- **Pantallas < 1200px**: Padding reducido a 0.75rem
- **Pantallas < 768px**: Padding reducido a 0.5rem
- **Pantallas > 1400px**: Centrado automático con márgenes

### Centrado Automático
En pantallas muy anchas, el contenido se centra automáticamente para mantener la legibilidad óptima.

## Migración desde container-fluid

### Antes (Bootstrap)
```tsx
<div className="container-fluid">
  {/* Contenido */}
</div>
```

### Después (ExtranetContainer)
```tsx
<ExtranetContainer maxWidth="xl">
  {/* Contenido */}
</ExtranetContainer>
```

## Beneficios

1. **Mejor Legibilidad**: Evita líneas de texto demasiado largas
2. **Experiencia Consistente**: Mismo ancho en todas las páginas del extranet
3. **Responsive**: Se adapta a diferentes tamaños de pantalla
4. **Centrado Automático**: En pantallas muy anchas, el contenido se centra
5. **Flexibilidad**: Diferentes anchos según el tipo de contenido

## Casos de Uso Recomendados

- **`maxWidth="xl"`**: Páginas principales con formularios estándar
- **`maxWidth="lg"`**: Estados de error, loading, o mensajes informativos
- **`maxWidth="xxl"`**: Formularios complejos con muchas columnas
- **`maxWidth="fluid"`**: Cuando se necesita ancho completo (casos especiales)

## Implementación en Páginas Existentes

Para implementar en páginas existentes:

1. Importar `ExtranetContainer`
2. Reemplazar `container-fluid` por `ExtranetContainer maxWidth="xl"`
3. Cerrar correctamente el componente
4. Ajustar el ancho según el tipo de contenido

### Ejemplo de Migración Completa

```tsx
// Antes
return (
  <OptionSetupLayout currentSection="optionSettings">
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          {/* Contenido */}
        </div>
      </div>
    </div>
  </OptionSetupLayout>
);

// Después
return (
  <OptionSetupLayout currentSection="optionSettings">
    <ExtranetContainer maxWidth="xl">
      <div className="row">
        <div className="col-12">
          {/* Contenido */}
        </div>
      </div>
    </ExtranetContainer>
  </OptionSetupLayout>
);
```
