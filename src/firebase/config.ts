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
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : ({} as Record<string, string>);

// Live Firebase configuration for project super-bot-cic
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyBRXJRVdM3O6RNXtPKGJi8J3kPYtFBSouY',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'super-bot-cic.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'super-bot-cic',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'super-bot-cic.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '143781160080',
  appId: env.VITE_FIREBASE_APP_ID || '1:143781160080:web:13ebd4717cbfda68a9e415'
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key_here'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (error) {
    console.warn('Firebase initialization error:', error);
  }
}

export { auth, db, googleProvider };

// ============================================================================
// Advisor Request Document Storage
// ============================================================================
export interface AdvisorRequest {
  preference: 'call' | 'whatsapp';
  phone: string;
  name?: string;
  notes?: string;
  status: 'pending' | 'contacted' | 'closed';
  source: string;
  createdAt?: any;
  dateString?: string;
}

export async function saveAdvisorRequest(
  data: Omit<AdvisorRequest, 'status' | 'source' | 'createdAt' | 'dateString'>
): Promise<{ id?: string; error?: string }> {
  if (!db) {
    return { error: 'La base de datos de Firebase no está disponible en este momento.' };
  }

  try {
    const docData: AdvisorRequest = {
      preference: data.preference,
      phone: data.phone.trim(),
      name: data.name?.trim() || '',
      notes: data.notes || '',
      status: 'pending',
      source: 'superbot_web',
      createdAt: serverTimestamp(),
      dateString: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'advisor_requests'), docData);
    return { id: docRef.id };
  } catch (err: any) {
    console.error('Error saving advisor request to Firestore:', err);
    return { error: err.message || 'Error al registrar la solicitud en Firebase' };
  }
}

// ============================================================================
// Authentication Helpers & Local Session Fallback
// ============================================================================
export interface AppUser {
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  uid?: string;
}

const SESSION_USER_KEY = 'superbot_active_user_session';

export function getLocalSessionUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function saveLocalSessionUser(user: AppUser): void {
  try {
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  } catch {
    // ignore
  }
}

export function clearLocalSessionUser(): void {
  try {
    localStorage.removeItem(SESSION_USER_KEY);
  } catch {
    // ignore
  }
}

export async function loginWithGoogle(): Promise<{ user?: User; error?: string; isConfigMissing?: boolean }> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto.'
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    saveLocalSessionUser({
      displayName: result.user.displayName,
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid
    });
    return { user: result.user };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
      return {
        error: 'Firebase Authentication no está habilitado en tu consola de Firebase aún.',
        isConfigMissing: true
      };
    }
    return { error: error.message || 'Error al iniciar sesión con Google' };
  }
}

export async function loginWithEmail(email: string, password: string): Promise<{ user?: User | AppUser; error?: string; isConfigMissing?: boolean }> {
  if (!isFirebaseConfigured || !auth) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto.'
    };
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    saveLocalSessionUser({
      displayName: result.user.displayName || email.split('@')[0],
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid
    });
    return { user: result.user };
  } catch (error: any) {
    console.error('Email Sign-In Error:', error);
    if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
      return {
        error: 'Firebase Authentication no está habilitado en tu consola de Firebase aún.',
        isConfigMissing: true
      };
    }
    let message = 'Error al iniciar sesión';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Correo electrónico o contraseña incorrectos';
    } else if (error.code === 'auth/invalid-email') {
      message = 'El formato de correo no es válido';
    }
    return { error: message };
  }
}

export async function registerWithEmail(email: string, password: string): Promise<{ user?: User | AppUser; error?: string; isConfigMissing?: boolean }> {
  if (!isFirebaseConfigured || !auth) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto.'
    };
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    saveLocalSessionUser({
      displayName: result.user.displayName || email.split('@')[0],
      email: result.user.email,
      photoURL: result.user.photoURL,
      uid: result.user.uid
    });
    return { user: result.user };
  } catch (error: any) {
    console.error('Email Registration Error:', error);
    if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
      return {
        error: 'Firebase Authentication no está habilitado en tu consola de Firebase aún.',
        isConfigMissing: true
      };
    }
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
  clearLocalSessionUser();
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
