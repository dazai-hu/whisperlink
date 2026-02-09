
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
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-6 border-b border-pink-50 bg-gradient-to-b from-white to-pink-50/20">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowProfile(true)}
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-pink-100 rounded-2xl overflow-hidden flex items-center justify-center text-pink-400 shadow-sm transition-transform group-hover:scale-105">
                {localUser.avatar ? (
                  <img src={localUser.avatar} className="w-full h-full object-cover" />
                ) : (
                  <ICONS.User className="w-7 h-7" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div className="text-left">
              <h1 className="font-heading font-bold text-gray-800 leading-tight">{localUser.username}</h1>
              <p className="text-[10px] text-gray-400 truncate w-32 font-medium">{localUser.bio || 'Whispering...'}</p>
            </div>
          </button>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-300 hover:text-red-400 transition-colors rounded-xl hover:bg-red-50"
          >
            <ICONS.Back className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Search / New Chat */}
      <div className="p-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search username..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-pink-100 outline-none transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <ICONS.Search className="absolute left-3.5 top-3 w-4 h-4 text-pink-200" />
        </form>
        {searchError && (
          <p className="mt-2 text-[10px] text-red-400 px-2 font-medium animate-pulse">{searchError}</p>
        )}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {chats.length === 0 ? (
          <div className="mt-12 text-center px-8 space-y-3">
            <div className="w-16 h-16 bg-pink-50 rounded-full mx-auto flex items-center justify-center">
               <span className="text-2xl">🌱</span>
            </div>
            <p className="text-gray-300 text-xs leading-relaxed font-medium">No active whispers. <br/> Start a quiet conversation by searching for a friend.</p>
          </div>
        ) : (
          chats.map((chat) => (
            <button
              key={chat.otherUser.id}
              onClick={() => onSelectChat(chat.otherUser.id)}
              className="w-full p-4 flex items-center space-x-4 rounded-3xl hover:bg-pink-50/50 transition-all group mb-2 border border-transparent hover:border-pink-100"
            >
              <div className="relative">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl overflow-hidden flex items-center justify-center text-purple-300 group-hover:bg-white transition-colors shadow-sm">
                  {chat.otherUser.avatar ? (
                    <img src={chat.otherUser.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold">{chat.otherUser.username[0].toUpperCase()}</span>
                  )}
                </div>
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-pink-400 text-white text-[10px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce font-bold shadow-md">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="text-sm font-bold text-gray-700 truncate group-hover:text-pink-500 transition-colors">{chat.otherUser.username}</h3>
                  {chat.lastMessage && (
                    <span className="text-[9px] text-gray-300 font-bold">
                      {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate opacity-80">
                  {chat.lastMessage?.type === 'image' ? 'Sent a visual whisper' : chat.lastMessage?.content || 'Awaiting first whisper...'}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      <div className="p-4 bg-gray-50/50 text-center border-t border-gray-100">
        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">End-To-End Ephemeral</span>
      </div>
    </div>
  );
};

export default ChatDashboard;
