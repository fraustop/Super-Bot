import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth';

// Firebase configuration from environment variables or sensible defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'super-bot.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'super-bot',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'super-bot.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.warn('Firebase initialization error:', error);
  }
}

export { auth, googleProvider };

// Authentication Helpers
export async function loginWithGoogle(): Promise<{ user?: User; error?: string }> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto. Revisa el archivo .env.local'
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    return { error: error.message || 'Error al iniciar sesión con Google' };
  }
}

export async function loginWithEmail(email: string, password: string): Promise<{ user?: User; error?: string }> {
  if (!isFirebaseConfigured || !auth) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto. Revisa el archivo .env.local'
    };
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (error: any) {
    console.error('Email Sign-In Error:', error);
    let message = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Correo electrónico o contraseña incorrectos';
    } else if (error.code === 'auth/invalid-email') {
      message = 'El formato de correo no es válido';
    }
    return { error: message };
  }
}

export async function registerWithEmail(email: string, password: string): Promise<{ user?: User; error?: string }> {
  if (!isFirebaseConfigured || !auth) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto. Revisa el archivo .env.local'
    };
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (error: any) {
    console.error('Email Registration Error:', error);
    let message = 'Error al registrar usuario';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Este correo electrónico ya está registrado';
    } else if (error.code === 'auth/weak-password') {
      message = 'La contraseña debe tener al menos 6 caracteres';
    }
    return { error: message };
  }
}

export async function logoutUser(): Promise<{ error?: string }> {
  if (!auth) return {};
  try {
    await signOut(auth);
    return {};
  } catch (error: any) {
    return { error: error.message || 'Error al cerrar sesión' };
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}
