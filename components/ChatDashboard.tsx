
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

const ChatDashboard: React.FC<ChatDashboardProps> = ({ currentUser, onSelectChat, onLogout }) => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [localUser, setLocalUser] = useState(currentUser);
  const [avatarLoaded, setAvatarLoaded] = useState<Record<string, boolean>>({});

  const loadChats = async () => {
    const recent = await db.getRecentChats(localUser.id);
    setChats(recent);
  };

  useEffect(() => {
    loadChats();
    const handleUpdate = () => {
      const session = localStorage.getItem('whisperlink_session');
      if (session) setLocalUser(JSON.parse(session));
      loadChats();
    };
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(loadChats, 3000);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [localUser.id]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    if (searchQuery.toLowerCase() === localUser.username.toLowerCase()) {
      setSearchError("You can't whisper to yourself.");
      return;
    }

    const foundUser = await db.findUserByUsername(searchQuery);
    if (foundUser) {
      onSelectChat(foundUser.id);
      setSearchQuery('');
    } else {
      setSearchError('User not found. Exact username required.');
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
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 border-r border-pink-200">
      {/* Header */}
      <div className="p-6 border-b border-pink-200 bg-gradient-to-b from-white to-pink-50">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-3 group text-left"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl overflow-hidden flex items-center justify-center text-pink-500 shadow-md ring-2 ring-white transition-transform group-hover:scale-105">
                {localUser.avatar ? (
                  <img 
                    src={localUser.avatar} 
                    className={`w-full h-full object-cover transition-opacity duration-700 ${avatarLoaded[localUser.id] ? 'opacity-100' : 'opacity-0'}`} 
                    onLoad={() => setAvatarLoaded(prev => ({...prev, [localUser.id]: true}))}
                  />
                ) : (
                  <ICONS.User className="w-7 h-7" />
                )}
                {!avatarLoaded[localUser.id] && localUser.avatar && <div className="absolute inset-0 bg-pink-100 animate-pulse" />}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>
            <div>
              <h1 className="font-heading font-bold text-gray-900 leading-tight">{localUser.username}</h1>
              <p className="text-[10px] text-gray-600 truncate w-32 font-bold uppercase tracking-tight">
                {localUser.bio || 'Whispering...'}
              </p>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="p-2.5 text-gray-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            <ICONS.Back className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search / New Chat */}
      <div className="p-4 bg-pink-50/30">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search exact username..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-pink-100 rounded-2xl text-sm font-semibold focus:ring-4 focus:ring-pink-200/50 focus:border-pink-300 outline-none transition-all shadow-sm placeholder-pink-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ICONS.Search className="absolute left-4 top-3.5 w-4 h-4 text-pink-400" />
        </form>
        {searchError && (
          <p className="mt-2 text-[10px] text-red-500 px-2 font-bold animate-bounce uppercase tracking-wider">{searchError}</p>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 mt-2">
        {chats.length === 0 ? (
          <div className="mt-12 text-center px-8 space-y-4">
            <div className="w-20 h-20 bg-pink-50 rounded-full mx-auto flex items-center justify-center shadow-inner">
               <span className="text-3xl animate-bounce">🌱</span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed font-bold uppercase tracking-widest opacity-60">No whispers yet.</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.otherUser.id}
              onClick={() => onSelectChat(chat.otherUser.id)}
              className="w-full p-4 flex items-center space-x-4 rounded-3xl bg-white hover:bg-pink-50/80 transition-all group border-2 border-transparent hover:border-pink-200 shadow-sm hover:shadow-md"
            >
              <div className="relative">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl overflow-hidden flex items-center justify-center text-purple-500 group-hover:bg-white transition-colors shadow-inner border border-purple-100">
                  {chat.otherUser.avatar ? (
                    <img 
                      src={chat.otherUser.avatar} 
                      className={`w-full h-full object-cover transition-opacity duration-700 ${avatarLoaded[chat.otherUser.id] ? 'opacity-100' : 'opacity-0'}`} 
                      onLoad={() => setAvatarLoaded(prev => ({...prev, [chat.otherUser.id]: true}))}
                    />
                  ) : (
                    <span className="text-xl font-bold">{chat.otherUser.username[0].toUpperCase()}</span>
                  )}
                  {!avatarLoaded[chat.otherUser.id] && chat.otherUser.avatar && <div className="absolute inset-0 bg-purple-50 animate-pulse" />}
                </div>
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-pulse font-black shadow-lg">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-black text-gray-800 truncate group-hover:text-pink-600 transition-colors uppercase tracking-tight">{chat.otherUser.username}</h3>
                  {chat.lastMessage && (
                    <span className="text-[9px] text-gray-400 font-black">
                      {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate font-semibold">
                  {chat.lastMessage?.type === 'image' ? '🖼️ Visual whisper' : chat.lastMessage?.content || 'Awaiting first whisper...'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-4 bg-gray-100 text-center border-t border-pink-100">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Encrypted & Ephemeral</span>
      </div>
    </div>
  );
};

export default ChatDashboard;
