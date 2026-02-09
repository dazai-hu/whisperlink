
import React, { useState, useEffect } from 'react';
import { AuthState, User } from './types';
import Auth from './components/Auth';
import ChatDashboard from './components/ChatDashboard';
import ChatRoom from './components/ChatRoom';
import { db } from './services/dbService';

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);

  // Persistence check on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('whisperlink_session');
    if (storedUser) {
      setAuthState({
        user: JSON.parse(storedUser),
        isAuthenticated: true,
      });
    }
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

  if (!authState.isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#fdf6f9] flex flex-col md:flex-row max-w-6xl mx-auto shadow-2xl md:rounded-3xl overflow-hidden md:my-8 transition-all duration-500">
      {/* Sidebar / Dashboard */}
      <div className={`w-full md:w-80 border-r border-pink-100 flex flex-col bg-white ${activeChatUserId ? 'hidden md:flex' : 'flex'}`}>
        <ChatDashboard 
          currentUser={authState.user!} 
          onSelectChat={setActiveChatUserId} 
          onLogout={handleLogout}
        />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-[#fdf6f9] relative ${!activeChatUserId ? 'hidden md:flex' : 'flex'}`}>
        {activeChatUserId ? (
          <ChatRoom 
            currentUserId={authState.user!.id} 
            otherUserId={activeChatUserId} 
            onBack={() => setActiveChatUserId(null)} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center animate-pulse">
               <svg className="w-16 h-16 text-pink-200" viewBox="0 0 24 24" fill="currentColor">
                 <path d="M12 2C6.47 2 2 6.47 2 12c0 1.88.52 3.65 1.43 5.17L2.05 21l3.83-1.38C7.35 20.48 9.12 21 11 21c5.53 0 10-4.47 10-10S16.53 2 11 2z" />
               </svg>
            </div>
            <h2 className="text-2xl font-heading text-pink-400 font-semibold">Start a Whisper</h2>
            <p className="text-gray-400 max-w-xs">Select a whisper or search for a friend's exact username to begin a private, ephemeral conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
