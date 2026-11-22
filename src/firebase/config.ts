import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
  type Auth
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
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
// User Profiles & Authentication Helpers
// ============================================================================
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  role: 'admin' | 'client';
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface AppUser {
  displayName: string | null;
  email: string | null;
  phone?: string | null;
  photoURL?: string | null;
  uid?: string;
  role?: 'admin' | 'client';
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

/**
 * Retrieves the full user profile from Firestore collection `users`.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db || !uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (err) {
    console.warn('Error fetching user profile from Firestore:', err);
  }
  return null;
}

/**
 * Saves or updates a user profile document in Firestore collection `users/{uid}`.
 */
export async function saveUserProfile(profileData: {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  photoURL?: string | null;
}): Promise<{ success: boolean; profile?: UserProfile; error?: string }> {
  const cleanEmail = profileData.email.trim().toLowerCase();
  const isAdmin = cleanEmail === 'gffraustop@gmail.com';
  const role: 'admin' | 'client' = isAdmin ? 'admin' : 'client';

  const userProfile: UserProfile = {
    uid: profileData.uid,
    email: cleanEmail,
    displayName: profileData.displayName.trim(),
    phone: profileData.phone.trim(),
    role,
    photoURL: profileData.photoURL || null,
    updatedAt: serverTimestamp()
  };

  // Update session
  saveLocalSessionUser({
    uid: profileData.uid,
    email: cleanEmail,
    displayName: userProfile.displayName,
    phone: userProfile.phone,
    photoURL: userProfile.photoURL,
    role
  });

  if (auth?.currentUser && auth.currentUser.uid === profileData.uid) {
    try {
      await updateProfile(auth.currentUser, {
        displayName: userProfile.displayName
      });
    } catch {
      // ignore
    }
  }

  if (db) {
    try {
      const userDocRef = doc(db, 'users', profileData.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        userProfile.createdAt = serverTimestamp();
      }
      await setDoc(userDocRef, userProfile, { merge: true });
      return { success: true, profile: userProfile };
    } catch (err: any) {
      console.error('Error writing user profile to Firestore:', err);
      return { success: false, error: err.message || 'Error al guardar perfil en Firestore' };
    }
  }

  return { success: true, profile: userProfile };
}

/**
 * Sign in or sign up with Google via Firebase Auth.
 * Automatically inspects Firestore to see if name or phone are missing.
 */
export async function loginWithGoogle(): Promise<{
  user?: User;
  profile?: UserProfile | null;
  needsProfileCompletion?: boolean;
  error?: string;
  isConfigMissing?: boolean;
}> {
  if (!isFirebaseConfigured || !auth || !googleProvider) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto.'
    };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const profile = await getUserProfile(result.user.uid);

    const hasPhone = Boolean(profile?.phone && profile.phone.trim().length > 0);
    const hasName = Boolean(
      (profile?.displayName && profile.displayName.trim().length > 0) ||
      (result.user.displayName && result.user.displayName.trim().length > 0)
    );

    const needsProfileCompletion = !hasPhone || !hasName;

    const cleanEmail = (result.user.email || '').toLowerCase();
    const role = cleanEmail === 'gffraustop@gmail.com' ? 'admin' : 'client';

    saveLocalSessionUser({
      displayName: profile?.displayName || result.user.displayName,
      email: result.user.email,
      phone: profile?.phone || null,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
      role
    });

    return {
      user: result.user,
      profile,
      needsProfileCompletion
    };
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
      return {
        error: 'El proveedor Google no está habilitado en la consola de Firebase aún.',
        isConfigMissing: true
      };
    }
    return { error: error.message || 'Error al iniciar sesión con Google' };
  }
}

/**
 * Sign in with Email and Password.
 * Inspects Firestore to check if phone is missing.
 */
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{
  user?: User | AppUser;
  profile?: UserProfile | null;
  needsProfileCompletion?: boolean;
  error?: string;
  isConfigMissing?: boolean;
}> {
  if (!isFirebaseConfigured || !auth) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto.'
    };
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(result.user.uid);

    const hasPhone = Boolean(profile?.phone && profile.phone.trim().length > 0);
    const hasName = Boolean(
      (profile?.displayName && profile.displayName.trim().length > 0) ||
      (result.user.displayName && result.user.displayName.trim().length > 0)
    );

    const needsProfileCompletion = !hasPhone || !hasName;
    const cleanEmail = (result.user.email || email).toLowerCase();
    const role = cleanEmail === 'gffraustop@gmail.com' ? 'admin' : 'client';

    saveLocalSessionUser({
      displayName: profile?.displayName || result.user.displayName || email.split('@')[0],
      email: result.user.email,
      phone: profile?.phone || null,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
      role
    });

    return {
      user: result.user,
      profile,
      needsProfileCompletion
    };
  } catch (error: any) {
    console.error('Email Sign-In Error:', error);
    if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
      return {
        error: 'El servicio de autenticación no está habilitado en la consola de Firebase aún.',
        isConfigMissing: true
      };
    }
    let message = 'Error al iniciar sesión';
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password' ||
      error.code === 'auth/invalid-credential'
    ) {
      message = 'Correo electrónico o contraseña incorrectos';
    } else if (error.code === 'auth/invalid-email') {
      message = 'El formato de correo no es válido';
    }
    return { error: message };
  }
}

/**
 * Register a new user with Email, Password, Name, and Phone.
 * Immediately saves the user profile document in Firestore collection `users`.
 */
export async function registerWithEmail(
  email: string,
  password: string,
  displayName: string,
  phone: string
): Promise<{
  user?: User | AppUser;
  profile?: UserProfile;
  error?: string;
  isConfigMissing?: boolean;
}> {
  if (!isFirebaseConfigured || !auth) {
    return {
      error: 'Firebase aún no está configurado con las credenciales de tu proyecto.'
    };
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);

    const saveRes = await saveUserProfile({
      uid: result.user.uid,
      email: result.user.email || email,
      displayName,
      phone,
      photoURL: null
    });

    return {
      user: result.user,
      profile: saveRes.profile
    };
  } catch (error: any) {
    console.error('Email Registration Error:', error);
    if (error.code === 'auth/configuration-not-found' || error.message?.includes('CONFIGURATION_NOT_FOUND')) {
      return {
        error: 'El servicio de autenticación no está habilitado en la consola de Firebase aún.',
        isConfigMissing: true
      };
    }
    let message = 'Error al registrar usuario';
    if (error.code === 'auth/email-already-in-use') {
      message = 'Este correo electrónico ya está registrado. Inicia sesión.';
    } else if (error.code === 'auth/weak-password') {
      message = 'La contraseña debe tener al menos 6 caracteres';
    } else if (error.code === 'auth/invalid-email') {
      message = 'El formato de correo no es válido';
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
