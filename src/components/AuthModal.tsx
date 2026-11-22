import React, { useState } from 'react';
import { loginWithGoogle } from '../firebase/config';
import {
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Package
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: { displayName: string | null; email: string | null }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigMissing, setIsConfigMissing] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setIsConfigMissing(false);

    try {
      const res = await loginWithGoogle();
      if (res.isConfigMissing) {
        setIsConfigMissing(true);
        setError(
          'El proveedor Google aún no ha sido activado en la consola de Firebase para el proyecto super-bot-cic.'
        );
      } else if (res.error) {
        setError(res.error);
      } else if (res.user) {
        if (onLoginSuccess) {
          onLoginSuccess({
            displayName: res.user.displayName,
            email: res.user.email
          });
        }
        onClose();
      }
    } catch (err: any) {
      if (
        err.code === 'auth/configuration-not-found' ||
        err.message?.includes('CONFIGURATION_NOT_FOUND')
      ) {
        setIsConfigMissing(true);
        setError(
          'El proveedor Google aún no ha sido activado en la consola de Firebase para el proyecto super-bot-cic.'
        );
      } else {
        setError(err.message || 'Error al iniciar sesión con Google');
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
            <h2 className="auth-modal-title">Iniciar Sesión</h2>
            <p className="auth-modal-desc">
              Acceso seguro con Firebase Authentication y tu cuenta de Google
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

        {/* Roles information */}
        <div className="auth-roles-info-card">
          <div className="roles-info-item">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <div className="roles-info-text">
              <strong>gffraustop@gmail.com</strong>
              <span>Acceso directo al panel de Administrador (Bot Entrenador)</span>
            </div>
          </div>
          <div className="roles-info-item">
            <Package size={18} className="text-cyan-400 shrink-0" />
            <div className="roles-info-text">
              <strong>Cualquier otra cuenta de Google</strong>
              <span>Acceso directo al panel de Cliente (Mis productos)</span>
            </div>
          </div>
        </div>

        {/* Error / Missing config alert */}
        {error && (
          <div className="auth-alert-error">
            <AlertCircle size={18} className="shrink-0" />
            <div className="auth-alert-error-content">
              <span>{error}</span>
              {isConfigMissing && (
                <div className="auth-console-action-box">
                  <p>
                    Para habilitarlo, ve a la consola de Firebase, haz clic en <strong>Comenzar</strong> y activa el proveedor <strong>Google</strong>:
                  </p>
                  <a
                    href="https://console.firebase.google.com/project/super-bot-cic/authentication/providers"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-open-firebase-console"
                  >
                    <span>Abrir Consola de Firebase</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* The single authentic Google Sign-In button */}
        <div className="auth-action-area">
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
              {loading ? 'Conectando con Google...' : 'Iniciar sesión con Google'}
            </span>
          </button>
        </div>

        <div className="auth-footer-notice">
          <span>Autenticación oficial de Google gestionada por Firebase</span>
        </div>
      </div>
    </div>
  );
};
