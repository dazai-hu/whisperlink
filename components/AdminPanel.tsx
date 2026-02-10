
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ICONS } from '../constants';

const AdminPanel: React.FC = () => {
  const [isAuth, setIsAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        setIsAuth(true);
        fetchUsers();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Access Denied');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/ban`, { method: 'PATCH' });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to toggle ban status", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('WARNING: Permanently erase this identity and all associated whispers? This cannot be undone.')) {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchUsers();
        }
      } catch (err) {
        console.error("Failed to delete user", err);
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 transform transition-all hover:scale-[1.01]">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-xl border-4 border-slate-50 rotate-6 animate-in zoom-in duration-500">
               <ICONS.Lock className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-black text-slate-900 tracking-tighter">Admin Authority</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">WhisperLink Control Core</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Identity</label>
               <input 
                type="text" 
                placeholder="Aadi" 
                autoComplete="username"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold transition-all"
                value={username} onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
               <input 
                type="password" 
                placeholder="••••••••" 
                autoComplete="current-password"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 focus:bg-white outline-none font-bold transition-all"
                value={password} onChange={e => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="text-rose-600 text-[11px] font-black uppercase text-center bg-rose-50 p-3 rounded-xl border border-rose-100 animate-shake">
                {error}
              </div>
            )}
            <button 
              disabled={loading}
              className="w-full py-4.5 bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest border-b-4 border-indigo-800 active:scale-95 transition-all shadow-lg hover:bg-indigo-700 disabled:opacity-50"
            >
               {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Access Vault'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 animate-in fade-in duration-700">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
           <div>
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                   <ICONS.Settings className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-heading font-black text-slate-900 tracking-tighter">Citizen Ledger</h1>
             </div>
             <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 ml-1">Managing all registered identities</p>
           </div>
           <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-white border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95">
              Exit Dashboard
           </button>
        </header>

        <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom-4 duration-700">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-50 border-b border-slate-100">
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Joined Timestamp</th>
                   <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Sanctions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users.map(u => (
                   <tr key={u.id} className={`transition-colors ${u.isBanned ? 'bg-rose-50/40 opacity-80' : 'hover:bg-slate-50/50'}`}>
                     <td className="px-8 py-6">
                       <div className="flex items-center space-x-4">
                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black transition-all ${u.isBanned ? 'bg-rose-100 text-rose-400 grayscale' : 'bg-slate-100 text-slate-400'}`}>
                           {u.avatar ? (
                             <img src={u.avatar} className={`w-full h-full object-cover rounded-xl ${u.isBanned ? 'opacity-50' : ''}`} />
                           ) : (
                             <span className="text-lg">{u.username[0].toUpperCase()}</span>
                           )}
                         </div>
                         <div className="flex flex-col">
                            <span className={`font-black text-sm tracking-tight ${u.isBanned ? 'text-rose-900 line-through' : 'text-slate-900'}`}>{u.username}</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ID: {u.id}</span>
                         </div>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                       <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${u.role === 'admin' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                         {u.role}
                       </span>
                     </td>
                     <td className="px-8 py-6">
                       <div className="flex items-center space-x-2">
                         <span className={`w-2 h-2 rounded-full ${u.isBanned ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${u.isBanned ? 'text-rose-600' : 'text-emerald-600'}`}>
                           {u.isBanned ? 'Revoked' : 'Active'}
                         </span>
                       </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-black text-slate-600 tracking-tight">
                              {formatDate(u.createdAt)}
                           </span>
                           <span className="text-[9px] text-slate-400 font-bold mt-0.5">
                              {new Date(u.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        </div>
                     </td>
                     <td className="px-8 py-6 text-right space-x-2">
                       {u.role !== 'admin' && (
                         <>
                           <button 
                             title={u.isBanned ? "Reinstate Identity" : "Revoke Identity"}
                             onClick={() => handleBan(u.id)}
                             className={`p-3 rounded-2xl border-2 transition-all active:scale-90 ${u.isBanned ? 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-100'}`}
                           >
                             <ICONS.Lock className={`w-5 h-5 ${u.isBanned ? 'animate-bounce' : ''}`} />
                           </button>
                           <button 
                             title="Erase Identity"
                             onClick={() => handleDelete(u.id)}
                             className="p-3 bg-slate-50 border-2 border-slate-100 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                           >
                             <ICONS.Trash className="w-5 h-5" />
                           </button>
                         </>
                       )}
                       {u.role === 'admin' && (
                         <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-2xl border-2 border-indigo-100">Immutable</span>
                       )}
                     </td>
                   </tr>
                 ))}
                 {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center text-slate-300 font-black uppercase tracking-[0.5em]">
                         No identities found in core database.
                      </td>
                    </tr>
                 )}
               </tbody>
             </table>
           </div>
        </div>

        <div className="mt-8 bg-slate-900 rounded-3xl p-8 flex items-center justify-between border-2 border-slate-800 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
           <div className="relative z-10">
              <h4 className="text-white text-xs font-black uppercase tracking-widest mb-1">Administrative Overview</h4>
              <p className="text-slate-400 text-[10px] font-bold">Total Citizen Count: {users.length} | Banned: {users.filter(u => u.isBanned).length}</p>
           </div>
           <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
              <span className="text-xl">📊</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
