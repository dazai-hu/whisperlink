
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
    
    if (username.trim().length < 1) {
      setError("Name required");
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(`${window.location.origin}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      onLogin(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-5 md:p-8 bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-slate-200 flex flex-col transform transition-all">
        {/* Graphic Header */}
        <div className="p-10 md:p-12 text-center bg-slate-50 border-b-2 border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 -mr-12 -mt-12 rounded-full"></div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-3xl mx-auto flex items-center justify-center mb-6 transform rotate-3 border-2 border-slate-200 shadow-sm relative z-10">
            <span className="text-3xl md:text-4xl">🍃</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-black text-slate-900 tracking-tighter">
            {isLogin ? 'Login' : 'Registration'}
          </h1>
          <p className="text-slate-500 mt-2 text-[10px] font-black uppercase tracking-[0.4em] opacity-60">WhisperLink Privacy</p>
        </div>

        {/* Input Area */}
        <div className="p-8 md:p-12 space-y-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative group">
                <ICONS.User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.2rem] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-slate-900 font-bold placeholder-slate-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <ICONS.Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[1.2rem] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-slate-900 font-bold placeholder-slate-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-rose-600 text-[11px] font-black uppercase text-center bg-rose-50 p-4 rounded-xl border border-rose-200 animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4.5 bg-slate-900 hover:bg-black text-white font-black rounded-[1.2rem] shadow-xl transition-all active:scale-[0.97] uppercase tracking-widest flex items-center justify-center border-b-4 border-slate-700 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="text-center pt-2">
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-indigo-600 text-xs font-black uppercase tracking-widest hover:text-indigo-800 hover:underline decoration-2 underline-offset-4 transition-all"
            >
              {isLogin ? "Go to Registration" : "Go to Login"}
            </button>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] leading-loose opacity-70">
            Encrypted in Transit. <br/> 
            Self-destructing by Design.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
