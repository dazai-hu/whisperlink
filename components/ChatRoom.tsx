
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { db } from '../services/dbService';
import { ICONS, DEFAULT_EPHEMERAL_MS } from '../constants';
import MessageItem from './MessageItem';

interface ChatRoomProps {
  currentUserId: string;
  otherUserId: string;
  onBack: () => void;
}

const AdminBadge = () => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[7px] font-black uppercase tracking-widest shadow-sm animate-pulse ml-2 h-fit">
    Admin
  </span>
);

const DURATIONS = [
  { label: '1m', value: 1 * 60 * 1000 },
  { label: '5m', value: 5 * 60 * 1000 },
  { label: '15m', value: 15 * 60 * 1000 },
  { label: '1h', value: 60 * 60 * 1000 },
];

const ChatRoom: React.FC<ChatRoomProps> = ({ currentUserId, otherUserId, onBack }) => {
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(DEFAULT_EPHEMERAL_MS);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchChat = async () => {
    try {
      const chatMessages = await db.getChatMessages(currentUserId, otherUserId);
      setMessages(chatMessages);
      
      const unread = chatMessages.filter(m => m.receiverId === currentUserId && !m.viewedAt);
      unread.forEach(m => db.markAsViewed(m.id));
    } catch (e) {
      console.error('Fetch chat error', e);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const user = await db.findUserById(otherUserId);
      setOtherUser(user);
      await fetchChat();
      setLoading(false);
    };
    loadData();

    const unsubscribe = db.subscribeToMessages(currentUserId, fetchChat);
    return () => unsubscribe();
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    await db.sendMessage(currentUserId, otherUserId, 'text', inputText, selectedDuration);
    setInputText('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await db.sendMessage(currentUserId, otherUserId, 'image', base64, selectedDuration);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse tracking-[0.3em]">Opening Link</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Mobile-First Header */}
      <div className="px-4 py-4 md:px-8 md:py-6 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-sm">
        <div className="flex items-center space-x-3 md:space-x-5 overflow-hidden">
          <button onClick={onBack} className="p-2 -ml-2 md:hidden text-slate-500 hover:text-indigo-600 transition-all active:scale-90">
            <ICONS.Back className="w-6 h-6" />
          </button>
          <div className="relative shrink-0">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 shadow-sm transition-all">
              {otherUser?.avatar ? (
                <img 
                  src={otherUser.avatar} 
                  className={`w-full h-full object-cover transition-opacity duration-1000 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`} 
                  onLoad={() => setAvatarLoaded(true)}
                />
              ) : (
                <span className="text-lg font-black text-indigo-600 flex items-center justify-center h-full w-full">{otherUser?.username[0].toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center">
              <h2 className="font-heading font-black text-slate-900 text-base md:text-xl truncate tracking-tighter leading-none uppercase">{otherUser?.username}</h2>
              {otherUser?.username.toLowerCase() === 'aadi' && <AdminBadge />}
            </div>
            <p className="text-[9px] text-indigo-500 font-black uppercase tracking-widest mt-1.5 opacity-80 flex items-center">
               <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1.5 animate-pulse"></span>
               Live Link
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
           <div className="hidden sm:flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-2xl border-2 border-indigo-100">
             <ICONS.Clock className="w-3.5 h-3.5 mr-2" />
             <span className="text-[9px] font-black uppercase tracking-widest">Self-Destruct</span>
           </div>
           <div className="p-3 bg-slate-50 rounded-xl text-slate-400 group cursor-help hidden md:block border border-slate-100">
             <ICONS.Lock className="w-4 h-4" />
           </div>
        </div>
      </div>

      {/* Clean Transcript View */}
      <div className="flex-1 overflow-y-auto px-5 md:px-12 pt-12 pb-6 scroll-smooth custom-scrollbar bg-white">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 select-none space-y-6">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center rotate-12">
                <span className="text-4xl">💬</span>
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-900 text-center leading-relaxed">
               Silence is heavy. <br/> 
               Break it with a whisper.
             </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem 
              key={msg.id} 
              message={msg} 
              isMe={msg.senderId === currentUserId}
              onViewed={() => db.markAsViewed(msg.id)}
            />
          ))
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Touch-Optimized Input Area */}
      <div className="p-4 md:p-8 bg-white/95 backdrop-blur-md border-t border-slate-100 z-30">
        <form onSubmit={handleSendMessage} className="flex flex-col space-y-3 max-w-5xl mx-auto">
          {/* Custom Duration Selector */}
          <div className="flex items-center justify-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1">Lifespan:</span>
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setSelectedDuration(d.value)}
                className={`px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all tracking-widest border-2 ${
                  selectedDuration === d.value 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                  : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3 md:space-x-5">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 md:p-4.5 bg-slate-50 text-slate-400 hover:text-indigo-600 border-2 border-slate-100 rounded-[1.2rem] transition-all active:scale-90 hover:bg-indigo-50 hover:border-indigo-100 shadow-sm"
            >
              <ICONS.Image className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            
            <div className="flex-1 relative group">
              <input
                type="text"
                placeholder="Type your whisper..."
                className="w-full px-6 py-3.5 md:px-10 md:py-5 bg-slate-50 border-2 border-transparent rounded-[2rem] focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm md:text-base font-bold text-slate-900 shadow-inner"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              disabled={!inputText.trim()}
              className="p-3.5 md:p-4.5 bg-pink-600 text-white rounded-[1.2rem] hover:bg-pink-700 shadow-xl shadow-pink-100 transition-all disabled:opacity-20 active:scale-95 border-b-4 border-pink-800 flex items-center justify-center transform"
            >
              <ICONS.Send className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
