# 🚀 Configuración en Producción

## 📋 Opciones para Cambiar Configuración

### **Opción 1: Archivo Externo (Recomendado) ✅**

#### **Ventajas:**
- ✅ No requiere recompilar la aplicación
- ✅ Cambios inmediatos sin deploy
- ✅ Fácil de mantener
- ✅ Fallback a configuración por defecto

#### **Cómo Funciona:**
1. La aplicación busca `/public/config.json` al cargar
2. Si existe, usa esa configuración
3. Si no existe, usa la configuración por defecto
4. Los cambios se aplican inmediatamente al recargar la página

#### **Archivo de Configuración:**
```json
{
  "business": {
    "ruc": "10430391564",
    "name": "Peru Trips And Adventures",
    "website": "perutripsadventures.com",
    "phone": "+51 1 234 5678",
    "address": "Lima, Perú",
    "email": "info@perutripsadventures.com"
  },
  "colors": {
    "primary": "#F54927",
    "secondary": "#2C3E50",
    "accent": "#FFC107"
  },
  "api": {
    "baseUrl": "https://tg4jd2gc-8080.brs.devtunnels.ms",
    "timeout": 10000
  }
}
```

### **Opción 2: Script de Actualización**

#### **Comandos Disponibles:**

**🔄 Actualizar Colores:**
```bash
node scripts/update-config.js colors "#FF0000" "#00FF00" "#0000FF"
```

**🏢 Actualizar Información de Negocio:**
```bash
node scripts/update-config.js business "Nuevo Nombre" "+51 999 888 777" "nuevo@email.com"
```

**🌐 Actualizar API:**
```bash
node scripts/update-config.js api "https://nueva-api.com" 15000
```

#### **Ejemplos Prácticos:**

```bash
# Cambiar colores de la marca
node scripts/update-config.js colors "#DC143C" "#2C3E50" "#FFC107"

# Cambiar información de contacto
node scripts/update-config.js business "Mi Agencia" "+51 987 654 321" "contacto@miagencia.com"

# Cambiar URL de la API
node scripts/update-config.js api "https://mi-api-produccion.com" 15000
```

### **Opción 3: Edición Manual**

#### **Pasos:**
1. Accede al servidor de producción
2. Navega a la carpeta `/public/`
3. Edita el archivo `config.json`
4. Guarda los cambios
5. Recarga la aplicación

#### **Ejemplo de Edición:**
```bash
# En el servidor
nano public/config.json

# O usando vim
vim public/config.json
```

## 🔧 Configuración del Servidor

### **Nginx (Recomendado):**
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    root /var/www/tu-app/public;
    index index.html;

    # Permitir acceso al archivo de configuración
    location /config.json {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    # Configuración para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### **Apache:**
```apache
<VirtualHost *:80>
    ServerName tu-dominio.com
    DocumentRoot /var/www/tu-app/public
    
    # Permitir acceso al archivo de configuración
    <Files "config.json">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Pragma "no-cache"
        Header set Expires "0"
    </Files>
    
    # Configuración para SPA
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ /index.html [QSA,L]
</VirtualHost>
```

## 📝 Variables de Entorno (Alternativa)

### **Configuración con .env:**
```bash
# .env
REACT_APP_BUSINESS_NAME="Peru Trips And Adventures"
REACT_APP_BUSINESS_PHONE="+51 1 234 5678"
REACT_APP_BUSINESS_EMAIL="info@perutripsadventures.com"
REACT_APP_API_BASE_URL="https://tg4jd2gc-8080.brs.devtunnels.ms"
REACT_APP_PRIMARY_COLOR="#F54927"
```

### **Uso en Código:**
```typescript
const config = {
  business: {
    name: process.env.REACT_APP_BUSINESS_NAME || 'Peru Trips And Adventures',
    phone: process.env.REACT_APP_BUSINESS_PHONE || '+51 1 234 5678',
    email: process.env.REACT_APP_BUSINESS_EMAIL || 'info@perutripsadventures.com'
  },
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || 'https://tg4jd2gc-8080.brs.devtunnels.ms'
  },
  colors: {
    primary: process.env.REACT_APP_PRIMARY_COLOR || '#F54927'
  }
};
```

## 🚨 Consideraciones de Seguridad

### **Recomendaciones:**
- ✅ No incluir información sensible en `config.json`
- ✅ Usar variables de entorno para credenciales
- ✅ Validar la configuración antes de aplicarla
- ✅ Hacer backup antes de cambios importantes

### **Validación de Configuración:**
```typescript
function validateConfig(config: any): boolean {
  const required = ['business', 'colors', 'api'];
  return required.every(key => config[key] && typeof config[key] === 'object');
}
```

## 🔄 Proceso de Actualización

### **Flujo Recomendado:**
1. **Desarrollo:** Usar `src/config/appConfig.ts`
2. **Testing:** Usar `public/config.json` con datos de prueba
3. **Producción:** Usar `public/config.json` con datos reales

### **Comandos de Despliegue:**
```bash
# Construir para producción
npm run build

# Copiar archivo de configuración
cp public/config.json build/public/

# Desplegar
rsync -avz build/ usuario@servidor:/var/www/tu-app/
```

## 📞 Soporte

Si tienes problemas con la configuración:
1. Verifica que el archivo `config.json` existe en `/public/`
2. Confirma que el formato JSON es válido
3. Revisa los logs del navegador para errores
4. Usa la configuración por defecto como fallback 