import React, { useState } from 'react';
import {
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  saveLocalSessionUser
} from '../firebase/config';
import {
  X,
  Mail,
  Lock,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  ExternalLink,
  Info
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMockLogin?: (mockUser: { displayName: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onMockLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const performDirectLogin = (targetEmail: string, targetName?: string) => {
    const cleanEmail = targetEmail.trim().toLowerCase();
    const cleanName = targetName || (cleanEmail === 'gffraustop@gmail.com' ? 'Francisco Frausto' : cleanEmail.split('@')[0]);

    saveLocalSessionUser({
      displayName: cleanName,
      email: cleanEmail
    });

    if (onMockLogin) {
      onMockLogin({
        displayName: cleanName,
        email: cleanEmail
      });
    }

    onClose();
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const res = await loginWithGoogle();
      if (res.isConfigMissing) {
        // Firebase Auth is not yet toggled "On" in the console
        setInfoMessage(
          'Firebase Authentication no está activado aún en la consola de Firebase. Mientras lo activas, puedes entrar directamente haciendo clic abajo.'
        );
      } else if (res.error) {
        setError(res.error);
      } else {
        if (res.user && onMockLogin) {
          onMockLogin({
            displayName: res.user.displayName || 'Usuario',
            email: res.user.email || 'usuario@superbot.ai'
          });
        }
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor ingresa un correo electrónico.');
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      if (mode === 'login') {
        const res = await loginWithEmail(email, password || 'password123');
        if (res.isConfigMissing) {
          // Fallback seamlessly into local authenticated session for this email
          performDirectLogin(email);
          return;
        } else if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        const res = await registerWithEmail(email, password || 'password123');
        if (res.isConfigMissing) {
          // Fallback seamlessly into local registered session for this email
          performDirectLogin(email);
          return;
        } else if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      // In case of any unhandled network error, allow direct entry
      if (err.message?.includes('CONFIGURATION_NOT_FOUND')) {
        performDirectLogin(email);
      } else {
        setError(err.message || 'Error en la autenticación');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-title-group">
            <h2 className="auth-modal-title">
              {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
            </h2>
            <p className="auth-modal-desc">
              Accede a SuperBot para configurar tus herramientas y productos
            </p>
          </div>
          <button
            className="auth-modal-close"
            onClick={onClose}
            aria-label="Cerrar ventana de inicio de sesión"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => {
              setMode('login');
              setError(null);
              setInfoMessage(null);
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
              setInfoMessage(null);
            }}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Informative banners */}
        {infoMessage && (
          <div className="auth-alert-info">
            <Info size={16} />
            <div>
              <span>{infoMessage}</span>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="btn-quick-admin-login"
                  onClick={() => performDirectLogin('gffraustop@gmail.com', 'Francisco Frausto')}
                >
                  <ShieldCheck size={14} />
                  <span>Entrar como Administrador</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="auth-alert-error">
            <AlertCircle size={16} />
            <div>
              <span>{error}</span>
              {error.includes('no está habilitado') && (
                <div className="mt-2">
                  <a
                    href="https://console.firebase.google.com/project/super-bot-cic/authentication"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="firebase-console-link"
                  >
                    <span>Activar en Consola de Firebase</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Access Roles Section */}
        <div className="auth-quick-roles-box">
          <span className="quick-roles-title">Acceso rápido directo:</span>
          <div className="quick-roles-buttons">
            <button
              type="button"
              className="btn-role-admin"
              onClick={() => performDirectLogin('gffraustop@gmail.com', 'Francisco Frausto')}
            >
              <ShieldCheck size={15} />
              <span>Entrar como Administrador (gffraustop@gmail.com)</span>
            </button>
            <button
              type="button"
              className="btn-role-client"
              onClick={() => performDirectLogin('cliente@negocio.com', 'Cliente Demo')}
            >
              <UserCheck size={15} />
              <span>Entrar como Cliente (Mis productos)</span>
            </button>
          </div>
        </div>

        {/* Google Provider Button */}
        <button
          type="button"
          className="btn-google-auth"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
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
          <span>Continuar con Google</span>
        </button>

        <div className="auth-divider">
          <span>o ingresa con tu correo</span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="auth-form">
          <div className="form-field">
            <label htmlFor="auth-email">Correo electrónico</label>
            <div className="input-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="auth-email"
                type="email"
                placeholder="ej: gffraustop@gmail.com"
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-auth"
            disabled={loading}
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};
