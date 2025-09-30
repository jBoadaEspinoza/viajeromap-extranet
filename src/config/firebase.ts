import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { firebaseConfig, isFirebaseConfigured, getFirebaseConfigMessage } from './firebaseConfig';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Log configuration status
console.log('Firebase Status:', getFirebaseConfigMessage());

export default app; 