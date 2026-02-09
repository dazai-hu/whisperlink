
import React, { useState } from 'react';
import { User } from '../types';
import { db } from '../services/dbService';
import { ICONS } from '../constants';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const user = await db.findUserByUsername(username);
        // Simple direct login simulation if DB check fails, 
        // but since we are using real API, we just wait for the response.
        const res = await fetch(`${window.location.origin}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        if (!res.ok) throw new Error('Invalid credentials');
        const userData = await res.json();
        onLogin(userData);
      } else {
        if (username.length < 3) throw new Error('Username too short');
        if (password.length < 6) throw new Error('Password must be 6+ characters');
        const newUser = await db.createUser(username, password);
        onLogin(newUser);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#fdf2f8]">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-2 border-pink-100 flex flex-col transform hover:scale-[1.01] transition-transform duration-500">
        {/* Header Section */}
        <div className="p-10 text-center bg-white border-b-2 border-pink-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 animate-pulse"></div>
          <div className="w-20 h-20 bg-pink-100 rounded-[2rem] mx-auto flex items-center justify-center mb-6 transform rotate-6 border-2 border-pink-200 shadow-inner">
            <span className="text-3xl">🍃</span>
          </div>
          <h1 className="text-4xl font-heading font-black text-gray-900 tracking-tighter">WhisperLink</h1>
          <p className="text-gray-500 mt-3 text-xs font-black uppercase tracking-[0.2em] opacity-70">Ephemeral Privacy</p>
        </div>

        {/* Form Section */}
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-pink-500">
                  <ICONS.User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Your unique ID"
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-pink-200/50 focus:border-pink-300 outline-none transition-all text-gray-900 font-bold placeholder-pink-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] ml-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-pink-500">
                  <ICONS.Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-[1.8rem] focus:ring-4 focus:ring-pink-200/50 focus:border-pink-300 outline-none transition-all text-gray-900 font-bold placeholder-pink-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-[11px] font-black uppercase text-center bg-red-50 p-4 rounded-2xl border-2 border-red-100 animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-pink-500 hover:bg-pink-600 text-white font-black rounded-[1.8rem] shadow-xl shadow-pink-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center uppercase tracking-widest border-b-4 border-pink-700"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Sign In' : 'Create Whisper ID'
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t-2 border-pink-50 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-pink-600 text-xs font-black uppercase tracking-widest hover:text-pink-800 transition-colors"
            >
              {isLogin ? "Join the silence" : "Return to sign in"}
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-50 p-8 text-center">
           <p className="text-[9px] text-gray-400 font-black leading-relaxed uppercase tracking-[0.15em] opacity-80">
             Self-destructing whispers. <br/> 
             No logs. No traces. No regrets.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
