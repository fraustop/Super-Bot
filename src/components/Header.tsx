import { Sun, Moon, LogIn, LogOut } from 'lucide-react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  currentUser: User | { displayName: string | null; email: string | null } | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onOpenAuth,
  currentUser,
  onLogout
}) => {
  return (
    <header className="superbot-header">
      <div className="header-container">
        {/* Left side: Icon, Title & Subtitle */}
        <div className="header-brand">
          <div className="bot-icon-wrapper">
            <img
              src="/bot-icon.png"
              alt="SuperBot"
              className="bot-avatar-img"
              width={68}
              height={68}
            />
            <span className="bot-status-indicator" title="En línea"></span>
          </div>
          <div className="header-text-group">
            <h1 className="header-title">SuperBot</h1>
            <span className="header-subtitle">La inteligencia artificial a tu servicio</span>
          </div>
        </div>

        {/* Right side: Login & Theme Toggle */}
        <div className="header-actions">
          {currentUser ? (
            <div className="user-profile-widget">
              <div className="user-info">
                <span className="user-name">
                  {currentUser.displayName || currentUser.email?.split('@')[0] || 'Usuario'}
                </span>
                <span className="user-email">{currentUser.email}</span>
              </div>
              <button
                type="button"
                className="btn-header-action btn-logout"
                onClick={onLogout}
                title="Cerrar sesión"
                aria-label="Cerrar sesión"
              >
                <LogOut size={18} />
                <span className="btn-text">Salir</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-header-action btn-login"
              onClick={onOpenAuth}
              aria-label="Iniciar sesión con Google o correo"
            >
              <LogIn size={18} />
              <span className="btn-text">Iniciar sesión</span>
            </button>
          )}

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? (
              <Sun size={19} className="theme-icon sun-icon" />
            ) : (
              <Moon size={19} className="theme-icon moon-icon" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
