// Firebase Configuration
// Este archivo contiene la configuración de Firebase con valores por defecto
// En producción, estos valores deben ser reemplazados por las variables de entorno

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB5-dmKuk15UXhDH-ramo7yEema1oXeHV0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "gestionafacil-92adb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gestionafacil-92adb",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "gestionafacil-92adb.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1049595259951",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1049595259951:web:63a7ffd6407b5e04ac2ada"
};

// Función para verificar si Firebase está configurado correctamente
export const isFirebaseConfigured = (): boolean => {
  return !firebaseConfig.apiKey.includes('demo') && 
         !firebaseConfig.projectId.includes('demo');
};

// Función para obtener mensaje de configuración
export const getFirebaseConfigMessage = (): string => {
  if (isFirebaseConfigured()) {
    return 'Firebase configurado correctamente';
  }
  return 'Firebase no está configurado. Usando modo demo.';
}; 