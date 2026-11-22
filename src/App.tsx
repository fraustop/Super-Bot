import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Carousel } from './components/Carousel';
import { AuthModal } from './components/AuthModal';
import { subscribeToAuth, logoutUser } from './firebase/config';
import type { User } from 'firebase/auth';

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('superbot-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [isAuthOpen, setIsAuthOpen] = useState(false);
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
    <div className="superbot-app">
      <Header
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenAuth={() => setIsAuthOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Body: Solutions Carousel for small businesses */}
      <main className="superbot-body" id="main-content">
        <Carousel onOpenContact={() => setIsAuthOpen(true)} />
      </main>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onMockLogin={handleMockLogin}
      />
    </div>
  );
};

export default App;
