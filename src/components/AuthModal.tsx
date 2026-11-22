import React, { useState } from 'react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  saveUserProfile,
  type AppUser
} from '../firebase/config';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: AppUser) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'complete_profile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pendingAuthUser, setPendingAuthUser] = useState<{
    uid: string;
    email: string;
    displayName?: string | null;
    photoURL?: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigMissing, setIsConfigMissing] = useState(false);

  if (!isOpen) return null;

  const handleModalClose = () => {
    setError(null);
    setIsConfigMissing(false);
    setMode('login');
    setPendingAuthUser(null);
    onClose();
  };

  // 1. Google Authentication
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setIsConfigMissing(false);

    try {
      const res = await loginWithGoogle();
      if (res.isConfigMissing) {
        setIsConfigMissing(true);
        setError('El proveedor Google aún no está habilitado en la consola de Firebase.');
      } else if (res.error) {
        setError(res.error);
      } else if (res.user) {
        if (res.needsProfileCompletion) {
          // User exists in Auth but missing phone in Firestore
          setPendingAuthUser({
            uid: res.user.uid,
            email: res.user.email || '',
            displayName: res.user.displayName,
            photoURL: res.user.photoURL
          });
          setName(res.profile?.displayName || res.user.displayName || '');
          setPhone(res.profile?.phone || '');
          setMode('complete_profile');
        } else {
          // Profile is complete
          if (onLoginSuccess) {
            onLoginSuccess({
              displayName: res.profile?.displayName || res.user.displayName,
              email: res.user.email,
              phone: res.profile?.phone,
              photoURL: res.user.photoURL,
              uid: res.user.uid,
              role: res.profile?.role
            });
          }
          handleModalClose();
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
        setIsConfigMissing(true);
        setError('El proveedor Google aún no está habilitado en la consola de Firebase.');
      } else {
        setError(err.message || 'Error al iniciar sesión con Google');
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Email Login & Register
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConfigMissing(false);

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setError('Por favor ingresa tu correo y contraseña.');
        return;
      }

      setLoading(true);
      try {
        const res = await loginWithEmail(email, password);
        if (res.isConfigMissing) {
          setIsConfigMissing(true);
          setError('El servicio de autenticación no está habilitado en la consola de Firebase.');
        } else if (res.error) {
          setError(res.error);
        } else if (res.user) {
          if (res.needsProfileCompletion) {
            setPendingAuthUser({
              uid: res.user.uid || '',
              email: res.user.email || email,
              displayName: res.user.displayName,
              photoURL: res.user.photoURL
            });
            setName(res.profile?.displayName || res.user.displayName || '');
            setPhone(res.profile?.phone || '');
            setMode('complete_profile');
          } else {
            if (onLoginSuccess) {
              onLoginSuccess({
                displayName: res.profile?.displayName || res.user.displayName,
                email: res.user.email,
                phone: res.profile?.phone,
                photoURL: res.user.photoURL,
                uid: res.user.uid,
                role: res.profile?.role
              });
            }
            handleModalClose();
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error al iniciar sesión');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'register') {
      if (!name.trim()) {
        setError('Por favor ingresa tu nombre completo.');
        return;
      }
      if (!phone.trim()) {
        setError('Por favor ingresa tu número de teléfono.');
        return;
      }
      if (!email.trim() || !password) {
        setError('Por favor ingresa un correo y una contraseña.');
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }

      setLoading(true);
      try {
        const res = await registerWithEmail(email, password, name.trim(), phone.trim());
        if (res.isConfigMissing) {
          setIsConfigMissing(true);
          setError('El servicio de autenticación no está habilitado en la consola de Firebase.');
        } else if (res.error) {
          setError(res.error);
        } else if (res.user) {
          if (onLoginSuccess) {
            onLoginSuccess({
              displayName: res.profile?.displayName || name.trim(),
              email: res.user.email,
              phone: res.profile?.phone || phone.trim(),
              photoURL: res.user.photoURL,
              uid: res.user.uid,
              role: res.profile?.role
            });
          }
          handleModalClose();
        }
      } catch (err: any) {
        setError(err.message || 'Error al crear la cuenta');
      } finally {
        setLoading(false);
      }
    }
  };

  // 3. Complete Profile (Firestore document write)
  const handleCompleteProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!phone.trim()) {
      setError('Por favor ingresa tu número de teléfono.');
      return;
    }

    if (!pendingAuthUser) {
      setError('No se encontró la sesión activa del usuario.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await saveUserProfile({
        uid: pendingAuthUser.uid,
        email: pendingAuthUser.email,
        displayName: name.trim(),
        phone: phone.trim(),
        photoURL: pendingAuthUser.photoURL
      });

      if (res.success && res.profile) {
        if (onLoginSuccess) {
          onLoginSuccess({
            displayName: res.profile.displayName,
            email: res.profile.email,
            phone: res.profile.phone,
            photoURL: res.profile.photoURL,
            uid: res.profile.uid,
            role: res.profile.role
          });
        }
        handleModalClose();
      } else {
        setError(res.error || 'Error al guardar el perfil en Firestore');
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar tu información');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleModalClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-title-group">
            <h2 className="auth-modal-title">
              {mode === 'complete_profile'
                ? 'Completa tu Perfil'
                : mode === 'login'
                ? 'Iniciar Sesión'
                : 'Crear Cuenta'}
            </h2>
            <p className="auth-modal-desc">
              {mode === 'complete_profile'
                ? 'Ingresa tu nombre y teléfono para terminar de configurar tu cuenta'
                : 'Accede a SuperBot para gestionar tus productos y servicios'}
            </p>
          </div>
          <button
            className="auth-modal-close"
            onClick={handleModalClose}
            aria-label="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="auth-alert-error">
            <AlertCircle size={18} className="shrink-0" />
            <div className="auth-alert-error-content">
              <span>{error}</span>
              {isConfigMissing && (
                <div className="auth-console-action-box">
                  <p>
                    Para habilitar el servicio en este proyecto, activa los proveedores en la consola de Firebase:
                  </p>
                  <a
                    href="https://console.firebase.google.com/project/super-bot-cic/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-firebase-console"
                  >
                    <span>Ir a Consola de Firebase</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP A: Complete Profile Mode */}
        {mode === 'complete_profile' ? (
          <form onSubmit={handleCompleteProfileSubmit} className="auth-form">
            <div className="complete-profile-banner">
              <ShieldCheck size={18} className="text-cyan-400 shrink-0" />
              <span>Por favor ingresa tus datos de contacto para completar tu perfil en Firestore.</span>
            </div>

            <div className="form-field">
              <label htmlFor="complete-name">Nombre completo</label>
              <div className="input-wrapper">
                <User size={16} className="input-icon" />
                <input
                  id="complete-name"
                  type="text"
                  placeholder="Tu nombre y apellido"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="complete-phone">Número de teléfono / WhatsApp</label>
              <div className="input-wrapper">
                <Phone size={16} className="input-icon" />
                <input
                  id="complete-phone"
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-submit-auth"
              disabled={loading}
            >
              <span>{loading ? 'Guardando en Firestore...' : 'Guardar y Continuar'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* STEP B: Regular Login / Register Mode */
          <>
            {/* Google Sign-In Button */}
            <button
              type="button"
              className="btn-google-auth-prominent"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="22" height="22">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="btn-google-text">
                {loading ? 'Conectando con Google...' : 'Continuar con Google'}
              </span>
            </button>

            <div className="auth-divider">
              <span>o con correo electrónico</span>
            </div>

            {/* Mode Switch Tabs */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
              >
                Crear Cuenta
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="auth-form">
              {mode === 'register' && (
                <>
                  <div className="form-field">
                    <label htmlFor="reg-name">Nombre completo</label>
                    <div className="input-wrapper">
                      <User size={16} className="input-icon" />
                      <input
                        id="reg-name"
                        type="text"
                        placeholder="ej: María González"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="reg-phone">Número de teléfono / WhatsApp</label>
                    <div className="input-wrapper">
                      <Phone size={16} className="input-icon" />
                      <input
                        id="reg-phone"
                        type="tel"
                        placeholder="ej: +52 55 1234 5678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-field">
                <label htmlFor="auth-email">Correo electrónico</label>
                <div className="input-wrapper">
                  <Mail size={16} className="input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="auth-password">Contraseña</label>
                <div className="input-wrapper">
                  <Lock size={16} className="input-icon" />
                  <input
                    id="auth-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit-auth"
                disabled={loading}
              >
                {loading
                  ? 'Procesando...'
                  : mode === 'login'
                  ? 'Iniciar Sesión'
                  : 'Crear Cuenta y Guardar'}
              </button>
            </form>
          </>
        )}

        <div className="auth-footer-notice">
          <span>Tus datos y perfil se resguardan de forma segura en Firestore</span>
        </div>
      </div>
    </div>
  );
};
