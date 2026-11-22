import React, { useState } from 'react';
import {
  Package,
  Boxes,
  Bot,
  LogOut,
  Sparkles,
  User,
  Clock
} from 'lucide-react';
import type { AppUser } from '../firebase/config';

interface ClientPortalViewProps {
  currentUser: AppUser | null;
  onLogout: () => void;
  onViewCatalog: () => void;
  onOpenChat: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  currentUser,
  onLogout,
  onViewCatalog,
  onOpenChat
}) => {
  const [activeMenu, setActiveMenu] = useState<'products' | 'catalog'>('products');

  return (
    <div className="client-portal-layout">
      {/* Left Sidebar Panel */}
      <aside className="client-sidebar">
        {/* User Profile Card */}
        <div className="client-user-box">
          <div className="client-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Usuario" className="avatar-img" />
            ) : (
              <User size={22} className="text-cyan-400" />
            )}
          </div>
          <div className="client-meta">
            <h4 className="client-name">
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Cliente'}
            </h4>
            <span className="client-email">{currentUser?.email}</span>
            <span className="client-badge">Cuenta de Cliente</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="client-nav">
          <div className="nav-section-label">Mi Cuenta</div>
          
          {/* Tag "Mis productos" requested by user */}
          <button
            type="button"
            className={`client-nav-btn ${activeMenu === 'products' ? 'active' : ''}`}
            onClick={() => setActiveMenu('products')}
          >
            <Package size={18} className="nav-icon" />
            <span className="nav-label">Mis productos</span>
            <span className="nav-pill-badge">Activo</span>
          </button>

          <button
            type="button"
            className="client-nav-btn"
            onClick={onViewCatalog}
          >
            <Boxes size={18} className="nav-icon" />
            <span className="nav-label">Catálogo de Soluciones</span>
          </button>

          <button
            type="button"
            className="client-nav-btn"
            onClick={onOpenChat}
          >
            <Bot size={18} className="nav-icon" />
            <span className="nav-label">Hablar con Super-Bot</span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="client-sidebar-footer">
          <button
            type="button"
            className="btn-client-logout"
            onClick={onLogout}
          >
            <LogOut size={16} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="client-main-area">
        {activeMenu === 'products' && (
          <div className="client-products-section">
            <div className="products-header-row">
              <div>
                <h2 className="products-main-title">Mis productos</h2>
                <p className="products-sub-title">
                  Administra y consulta el estado de las herramientas digitales vinculadas a tu negocio.
                </p>
              </div>
              <button
                type="button"
                className="btn-portal-quote"
                onClick={onOpenChat}
              >
                <Sparkles size={16} />
                <span>Cotizar nueva solución</span>
              </button>
            </div>

            {/* Placeholder state: more configuration coming soon */}
            <div className="products-empty-card">
              <div className="empty-icon-wrapper">
                <Package size={42} className="text-cyan-400" />
              </div>
              <h3 className="empty-title">Panel de Mis Productos</h3>
              <p className="empty-description">
                Tu cuenta está activa y conectada. Actualmente no tienes productos contratados o activados para esta cuenta.
              </p>
              
              <div className="empty-status-tag">
                <Clock size={14} />
                <span>Módulo en preparación: Más adelante lo vamos a configurar para desplegar tus servicios contratados.</span>
              </div>

              <div className="empty-action-box">
                <p className="empty-cta-text">
                  ¿Te gustaría cotizar una <strong>Página Web (desde $300 MXN)</strong>, una <strong>App Operativa ($500 MXN)</strong> o un <strong>Bot de WhatsApp ($1,000 MXN/mes)</strong>?
                </p>
                <div className="empty-buttons-row">
                  <button
                    type="button"
                    className="btn-empty-action-chat"
                    onClick={onOpenChat}
                  >
                    <Bot size={16} />
                    <span>Platicar con Super-Bot para cotizar</span>
                  </button>
                  <button
                    type="button"
                    className="btn-empty-action-catalog"
                    onClick={onViewCatalog}
                  >
                    <Boxes size={16} />
                    <span>Ver soluciones en el catálogo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
