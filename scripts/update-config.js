#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Función para actualizar configuración
function updateConfig(newConfig) {
  const configPath = path.join(__dirname, '../public/config.json');
  
  try {
    // Leer configuración actual
    let currentConfig = {};
    if (fs.existsSync(configPath)) {
      currentConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    // Fusionar con nueva configuración
    const updatedConfig = { ...currentConfig, ...newConfig };
    
    // Escribir archivo actualizado
    fs.writeFileSync(configPath, JSON.stringify(updatedConfig, null, 2));
    
    console.log('✅ Configuración actualizada exitosamente');
    console.log('📁 Archivo:', configPath);
    console.log('🔄 Recarga la aplicación para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error.message);
  }
}

// Ejemplos de uso
if (process.argv.length > 2) {
  const command = process.argv[2];
  
  switch (command) {
    case 'colors':
      updateConfig({
        colors: {
          primary: process.argv[3] || '#F54927',
          secondary: process.argv[4] || '#2C3E50',
          accent: process.argv[5] || '#FFC107'
        }
      });
      break;
      
    case 'business':
      updateConfig({
        business: {
          name: process.argv[3] || 'Peru Trips And Adventures',
          phone: process.argv[4] || '+51 1 234 5678',
          email: process.argv[5] || 'info@perutripsadventures.com'
        }
      });
      break;
      
    case 'api':
      updateConfig({
        api: {
          baseUrl: process.argv[3] || 'https://tg4jd2gc-8080.brs.devtunnels.ms',
          timeout: parseInt(process.argv[4]) || 10000
        }
      });
      break;
      
    default:
      console.log(`
📋 Uso del script de configuración:

🔄 Actualizar colores:
   node scripts/update-config.js colors "#FF0000" "#00FF00" "#0000FF"

🏢 Actualizar información de negocio:
   node scripts/update-config.js business "Nuevo Nombre" "+51 999 888 777" "nuevo@email.com"

🌐 Actualizar API:
   node scripts/update-config.js api "https://nueva-api.com" 15000

📝 Ejemplos:
   node scripts/update-config.js colors "#DC143C" "#2C3E50" "#FFC107"
   node scripts/update-config.js business "Mi Agencia" "+51 987 654 321" "contacto@miagencia.com"
      `);
  }
} else {
  console.log('❌ Debes especificar un comando. Usa: node scripts/update-config.js --help');
} 