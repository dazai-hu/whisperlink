
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
        if (user && user.passwordHash === password) { // Simple check for demo
          onLogin(user);
        } else {
          setError('Invalid username or password');
        }
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-pink-100 flex flex-col">
        {/* Header Section */}
        <div className="p-8 text-center bg-white border-b border-pink-50">
          <div className="w-16 h-16 bg-pink-100 rounded-2xl mx-auto flex items-center justify-center mb-4 transform rotate-6">
            <span className="text-2xl">🍃</span>
          </div>
          <h1 className="text-3xl font-heading font-bold text-gray-800 tracking-tight">WhisperLink</h1>
          <p className="text-gray-400 mt-2 text-sm">Ephemeral whispers, absolute privacy.</p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pink-300">
                  <ICONS.User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter username..."
                  className="w-full pl-11 pr-4 py-3 bg-pink-50/50 border border-pink-100 rounded-2xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none transition-all text-gray-700 placeholder-pink-300/60"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-pink-300">
                  <ICONS.Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-pink-50/50 border border-pink-100 rounded-2xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none transition-all text-gray-700 placeholder-pink-300/60"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-pink-400 hover:bg-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Sign In' : 'Create Whisper ID'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-pink-400 text-sm font-semibold hover:text-pink-600 transition-colors"
            >
              {isLogin ? "New here? Create an account" : "Already have a whisper ID? Sign in"}
            </button>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="bg-gray-50 p-6 text-center">
           <p className="text-[10px] text-gray-400 leading-relaxed uppercase tracking-tighter">
             Privacy Notice: No emails. No phone numbers. No tracking. <br/> 
             Messages self-destruct 5 minutes after being viewed.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
