
import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import Auth from './components/Auth';
import ChatDashboard from './components/ChatDashboard';
import ChatRoom from './components/ChatRoom';
import AdminPanel from './components/AdminPanel';
import { db } from './services/dbService';
import { ICONS } from './constants';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [isAdminRoute, setIsAdminRoute] = useState(window.location.pathname === '/admin');

  useEffect(() => {
    const handlePopState = () => setIsAdminRoute(window.location.pathname === '/admin');
    window.addEventListener('popstate', handlePopState);
    
    const storedUser = localStorage.getItem('whisperlink_session');
    if (storedUser) {
      setAuthState({
        user: JSON.parse(storedUser),
        isAuthenticated: true,
      });
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (user: User) => {
    localStorage.setItem('whisperlink_session', JSON.stringify(user));
    setAuthState({ user, isAuthenticated: true });
  };

  const handleLogout = () => {
    localStorage.removeItem('whisperlink_session');
    setAuthState({ user: null, isAuthenticated: false });
    setActiveChatUserId(null);
  };

  if (isAdminRoute) {
    return <AdminPanel />;
  }

  if (!authState.isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="h-[100dvh] w-full bg-slate-100 flex items-center justify-center md:p-4 lg:p-6 overflow-hidden">
      <div className="h-full w-full max-w-7xl flex flex-col md:flex-row bg-white md:rounded-[2.5rem] md:shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Navigation Sidebar */}
        <aside className={`
          w-full md:w-[320px] lg:w-[380px] flex flex-col bg-white border-r border-slate-100 transition-all duration-500 ease-in-out z-20
          ${activeChatUserId ? 'hidden md:flex' : 'flex'}
        `}>
          <ChatDashboard 
            currentUser={authState.user!} 
            onSelectChat={setActiveChatUserId} 
            onLogout={handleLogout}
          />
        </aside>

        {/* Main Conversation Panel */}
        <main className={`
          flex-1 flex flex-col bg-slate-50 relative overflow-hidden transition-all duration-500 ease-in-out
          ${!activeChatUserId ? 'hidden md:flex' : 'flex'}
        `}>
          {activeChatUserId ? (
            <ChatRoom 
              currentUserId={authState.user!.id} 
              otherUserId={activeChatUserId} 
              onBack={() => setActiveChatUserId(null)} 
            />
          ) : (
            <div className="hidden md:flex flex-1 flex-col items-center justify-center p-12 text-center bg-white">
              <div className="relative mb-12">
                <div className="w-44 h-44 lg:w-56 lg:h-56 bg-indigo-50/50 rounded-[4rem] flex items-center justify-center animate-pulse duration-[4000ms] shadow-inner">
                   <span className="text-6xl lg:text-8xl select-none filter drop-shadow-lg">🕊️</span>
                </div>
                <div className="absolute -bottom-4 -right-4 w-14 h-14 bg-pink-600 rounded-3xl flex items-center justify-center text-white shadow-2xl animate-bounce ring-4 ring-white">
                  <ICONS.Lock className="w-6 h-6" />
                </div>
              </div>
              <div className="space-y-4 max-w-sm mx-auto">
                <h2 className="text-4xl font-heading text-slate-900 font-black tracking-tighter">Enter the Silence</h2>
                <p className="text-slate-500 text-sm font-bold leading-relaxed uppercase tracking-[0.2em] opacity-60">
                  Every whisper is ephemeral. <br/> 
                  Vanishing within 5 minutes of being seen.
                </p>
                <div className="pt-8 flex justify-center space-x-2">
                   <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                   <div className="w-1.5 h-1.5 bg-indigo-300 rounded-full"></div>
                   <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
