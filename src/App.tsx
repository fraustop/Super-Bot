import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Carousel } from './components/Carousel';
import { ChatDrawer } from './components/ChatDrawer';
import { AuthModal } from './components/AuthModal';
import { AdvisorModal } from './components/AdvisorModal';
import { AdminView } from './components/AdminView';
import { ClientPortalView } from './components/ClientPortalView';
import {
  subscribeToAuth,
  logoutUser,
  getLocalSessionUser,
  saveLocalSessionUser,
  getUserProfile,
  type AppUser
} from './firebase/config';
import { subscribeToBotKnowledge } from './services/botKnowledgeService';
import { ShieldCheck, Package, ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('superbot-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  
  // Active user initialized from persisted session
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => getLocalSessionUser());
  
  // Admin & Client view modes
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'public'>('admin');
  const [clientViewMode, setClientViewMode] = useState<'portal' | 'catalog'>('portal');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('superbot-theme', theme);
  }, [theme]);

  // Firebase auth & live Firestore bot knowledge subscriptions
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        const cleanEmail = (firebaseUser.email || '').toLowerCase();
        const role = profile?.role || (cleanEmail === 'gffraustop@gmail.com' ? 'admin' : 'client');

        const mappedUser: AppUser = {
          displayName: profile?.displayName || firebaseUser.displayName,
          email: firebaseUser.email,
          phone: profile?.phone || null,
          photoURL: firebaseUser.photoURL,
          uid: firebaseUser.uid,
          role
        };
        setCurrentUser(mappedUser);
        saveLocalSessionUser(mappedUser);

        // If phone or name are missing, prompt user to complete profile
        if (!profile?.phone || !profile.phone.trim()) {
          setIsAuthOpen(true);
        }
      }
    });

    // Sync bot knowledge from Firestore in the background
    const unsubscribeKnowledge = subscribeToBotKnowledge(() => {
      // knowledge updated in memory and localStorage
    });

    return () => {
      unsubscribeAuth();
      unsubscribeKnowledge();
    };
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setAdminViewMode('admin');
    setClientViewMode('portal');
  };

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    saveLocalSessionUser(user);
    if (user.email?.toLowerCase() === 'gffraustop@gmail.com') {
      setAdminViewMode('admin');
    } else {
      setClientViewMode('portal');
    }
  };

  const isAdmin = currentUser?.email?.toLowerCase() === 'gffraustop@gmail.com';
  const isRegularClient = currentUser && !isAdmin;

  return (
    <div className={`superbot-app ${isChatOpen ? 'chat-is-open' : ''}`}>
      {/* 1. ADMIN USER (gffraustop@gmail.com) */}
      {isAdmin && adminViewMode === 'admin' ? (
        <AdminView
          currentUser={currentUser}
          onLogout={handleLogout}
          onViewPublicSite={() => setAdminViewMode('public')}
          onOpenChat={() => setIsChatOpen(true)}
        />
      ) : isRegularClient && clientViewMode === 'portal' ? (
        /* 2. REGULAR CLIENT (Any other account -> Left panel "Mis productos") */
        <ClientPortalView
          currentUser={currentUser}
          onLogout={handleLogout}
          onViewCatalog={() => setClientViewMode('catalog')}
          onOpenChat={() => setIsChatOpen(true)}
        />
      ) : (
        /* 3. PUBLIC CAROUSEL (Visitors or Logged-in users previewing the catalog) */
        <>
          {/* Banner for logged-in users who are previewing the public site */}
          {isAdmin && adminViewMode === 'public' && (
            <div className="admin-preview-top-bar">
              <div className="preview-top-bar-content">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Estás en modo vista previa pública como Administrador.</span>
              </div>
              <button
                type="button"
                className="btn-return-admin-panel"
                onClick={() => setAdminViewMode('admin')}
              >
                <ArrowLeft size={14} />
                <span>Volver al Panel de Administrador</span>
              </button>
            </div>
          )}

          {isRegularClient && clientViewMode === 'catalog' && (
            <div className="client-preview-top-bar">
              <div className="preview-top-bar-content">
                <Package size={16} className="text-cyan-400" />
                <span>Explorando catálogo público de soluciones.</span>
              </div>
              <button
                type="button"
                className="btn-return-client-panel"
                onClick={() => setClientViewMode('portal')}
              >
                <ArrowLeft size={14} />
                <span>Volver a Mis Productos</span>
              </button>
            </div>
          )}

          <Header
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onOpenAuth={() => setIsAuthOpen(true)}
            currentUser={currentUser}
            onLogout={handleLogout}
          />

          <main className={`superbot-body ${isChatOpen ? 'with-chat-open' : ''}`} id="main-content">
            <Carousel
              onOpenContact={() => setIsChatOpen(true)}
              isChatOpen={isChatOpen}
            />
          </main>
        </>
      )}

      {/* Right Side Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onContactAdvisor={() => {
          setIsAdvisorOpen(true);
        }}
      />

      {/* Advisor Contact Modal (Llamada o WhatsApp) */}
      <AdvisorModal
        isOpen={isAdvisorOpen}
        onClose={() => setIsAdvisorOpen(false)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
