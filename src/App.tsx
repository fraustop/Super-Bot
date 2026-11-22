import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Carousel } from './components/Carousel';
import { ChatDrawer } from './components/ChatDrawer';
import { AuthModal } from './components/AuthModal';
import { subscribeToAuth, logoutUser } from './firebase/config';
import { MessageSquareText } from 'lucide-react';
import type { User } from 'firebase/auth';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('superbot-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | { displayName: string | null; email: string | null } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('superbot-theme', theme);
  }, [theme]);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        setCurrentUser(user);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  const handleMockLogin = (mockUser: { displayName: string; email: string }) => {
    setCurrentUser({
      displayName: mockUser.displayName,
      email: mockUser.email
    });
  };

  return (
    <div className={`superbot-app ${isChatOpen ? 'chat-is-open' : ''}`}>
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Body: Solutions Carousel for small businesses (remains fully visible on the left) */}
      <main className={`superbot-body ${isChatOpen ? 'with-chat-open' : ''}`} id="main-content">
        <Carousel
          onOpenContact={() => setIsChatOpen(true)}
          isChatOpen={isChatOpen}
        />
      </main>

      {/* Floating Chat Launcher (visible when chat is closed) */}
      {!isChatOpen && (
        <button
          type="button"
          className="floating-chat-launcher"
          onClick={() => setIsChatOpen(true)}
          aria-label="Abrir chat con Super-Bot"
          title="Pregúntale a Super-Bot"
        >
          <div className="launcher-icon-wrap">
            <img src="/bot-icon.png" alt="Super-Bot" className="launcher-bot-img" />
            <span className="launcher-online-dot"></span>
          </div>
          <span className="launcher-label">¿Dudas? Pregúntale a Super-Bot</span>
          <MessageSquareText size={18} className="launcher-bubble-icon" />
        </button>
      )}

      {/* Right Side Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onContactAdvisor={() => {
          setIsChatOpen(false);
          setIsAuthOpen(true);
        }}
      />

      {/* Authentication & Advisor Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onMockLogin={handleMockLogin}
      />
    </div>
  );
};

export default App;
