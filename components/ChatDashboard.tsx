
import React, { useState, useEffect } from 'react';
import { User, ChatPreview } from '../types';
import { db } from '../services/dbService';
import { ICONS } from '../constants';
import ProfileSettings from './ProfileSettings';

interface ChatDashboardProps {
  currentUser: User;
  onSelectChat: (userId: string) => void;
  onLogout: () => void;
}

const AdminBadge = () => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[7px] font-black uppercase tracking-widest shadow-sm animate-pulse ml-2">
    Admin
  </span>
);

const ChatDashboard: React.FC<ChatDashboardProps> = ({ currentUser, onSelectChat, onLogout }) => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [localUser, setLocalUser] = useState(currentUser);
  const [avatarLoaded, setAvatarLoaded] = useState<Record<string, boolean>>({});

  const loadChats = async () => {
    try {
      const recent = await db.getRecentChats(localUser.id);
      setChats(recent);
    } catch (e) {
      console.error('Failed to load chats', e);
    }
  };

  useEffect(() => {
    loadChats();
    const handleUpdate = () => {
      const session = localStorage.getItem('whisperlink_session');
      if (session) setLocalUser(JSON.parse(session));
      loadChats();
    };
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(loadChats, 4000);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [localUser.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (!searchQuery.trim()) return;
    if (searchQuery.toLowerCase() === localUser.username.toLowerCase()) {
      setSearchError("No echo whispers.");
      return;
    }

    const foundUser = await db.findUserByUsername(searchQuery);
    if (foundUser) {
      onSelectChat(foundUser.id);
      setSearchQuery('');
    } else {
      setSearchError('Not found.');
    }
  };

  if (showProfile) {
    return (
      <ProfileSettings 
        user={localUser} 
        onClose={() => setShowProfile(false)} 
        onUpdate={(u) => setLocalUser(u)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header with Profile Portal */}
      <div className="p-5 md:p-6 border-b border-slate-100 bg-white sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-3 group text-left outline-none transition-transform active:scale-95"
          >
            <div className="relative">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-2xl overflow-hidden border-2 border-slate-100 transition-all group-hover:border-indigo-600 group-hover:shadow-md flex items-center justify-center">
                {localUser.avatar ? (
                  <img 
                    src={localUser.avatar} 
                    className={`w-full h-full object-cover transition-opacity duration-700 ${avatarLoaded[localUser.id] ? 'opacity-100' : 'opacity-0'}`} 
                    onLoad={() => setAvatarLoaded(prev => ({...prev, [localUser.id]: true}))}
                  />
                ) : (
                  <ICONS.User className="w-6 h-6 text-slate-300" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center">
                <h1 className="font-heading font-black text-slate-900 md:text-lg truncate tracking-tight uppercase">{localUser.username}</h1>
                {localUser.username.toLowerCase() === 'aadi' && <AdminBadge />}
              </div>
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5 opacity-80">Listening...</p>
            </div>
          </button>
          <button 
            onClick={() => setShowProfile(true)}
            className="p-3 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-2xl transition-all"
          >
            <ICONS.Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modern Search */}
      <div className="p-4 bg-white border-b border-slate-50">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search exact Whisper ID"
            className="w-full pl-12 pr-4 py-3 bg-slate-100/80 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder-slate-400 shadow-inner"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ICONS.Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </form>
        {searchError && (
          <p className="mt-2 text-[10px] text-rose-600 px-2 font-black uppercase tracking-widest">{searchError}</p>
        )}
      </div>

      {/* Chat List Scroll View */}
      <div className="flex-1 overflow-y-auto px-2 pb-6 space-y-1 custom-scrollbar">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30 select-none space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center animate-pulse">
               <span className="text-3xl">🪶</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 leading-relaxed">
              Find someone <br/> by their ID above.
            </p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.otherUser.id}
              onClick={() => onSelectChat(chat.otherUser.id)}
              className="w-full p-4 flex items-center space-x-4 rounded-[1.8rem] hover:bg-slate-50 active:bg-slate-100 transition-all group border-2 border-transparent hover:border-slate-100"
            >
              <div className="relative shrink-0">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center text-slate-400 border border-slate-100 transition-transform group-hover:scale-105">
                  {chat.otherUser.avatar ? (
                    <img 
                      src={chat.otherUser.avatar} 
                      className={`w-full h-full object-cover transition-opacity duration-700 ${avatarLoaded[chat.otherUser.id] ? 'opacity-100' : 'opacity-0'}`} 
                      onLoad={() => setAvatarLoaded(prev => ({...prev, [chat.otherUser.id]: true}))}
                    />
                  ) : (
                    <span className="text-xl font-black">{chat.otherUser.username[0].toUpperCase()}</span>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-pink-600 text-white text-[9px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white font-black shadow-lg">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-baseline mb-1">
                  <div className="flex items-center overflow-hidden">
                    <h3 className="text-sm font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{chat.otherUser.username}</h3>
                    {chat.otherUser.username.toLowerCase() === 'aadi' && <AdminBadge />}
                  </div>
                  {chat.lastMessage && (
                    <span className="text-[8px] text-slate-400 font-bold ml-2">
                      {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate font-semibold leading-relaxed">
                  {chat.lastMessage?.type === 'image' ? '🖼️ [Visual Whisper]' : chat.lastMessage?.content || 'Establishing link...'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Secure Logout Footer */}
      <div className="p-6 bg-slate-900 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
        <button 
          onClick={onLogout} 
          className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-[0.3em] transition-all flex items-center justify-center space-x-3 w-full group"
        >
          <ICONS.Back className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
          <span>Exit WhisperLink</span>
        </button>
      </div>
    </div>
  );
};

export default ChatDashboard;
