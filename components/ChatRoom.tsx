
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { db } from '../services/dbService';
import { ICONS } from '../constants';
import MessageBubble from './MessageBubble';

interface ChatRoomProps {
  currentUserId: string;
  otherUserId: string;
  onBack: () => void;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ currentUserId, otherUserId, onBack }) => {
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBio, setShowBio] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchChat = async () => {
    const chatMessages = await db.getChatMessages(currentUserId, otherUserId);
    setMessages(chatMessages);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const user = await db.findUserById(otherUserId);
      setOtherUser(user);
      await fetchChat();
      setLoading(false);
      scrollToBottom();
    };
    loadData();

    const unsubscribe = db.subscribeToMessages(currentUserId, fetchChat);
    return () => unsubscribe();
  }, [currentUserId, otherUserId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    await db.sendMessage(currentUserId, otherUserId, 'text', inputText);
    setInputText('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await db.sendMessage(currentUserId, otherUserId, 'image', base64);
    };
    reader.readAsDataURL(file);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-pink-50">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin"></div>
        <span className="absolute text-[8px] font-black text-pink-500 uppercase tracking-tighter">Quiet</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Top Bar */}
      <div className="p-4 border-b-2 border-pink-100 bg-white flex flex-col shadow-md z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2.5 md:hidden text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-all rounded-xl border border-transparent hover:border-pink-100">
              <ICONS.Back className="w-5 h-5" />
            </button>
            <div 
              onClick={() => setShowBio(!showBio)}
              className="relative w-11 h-11 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl overflow-hidden flex items-center justify-center font-black text-pink-600 cursor-pointer hover:scale-105 transition-all shadow-sm ring-2 ring-white"
            >
              {otherUser?.avatar ? (
                <img 
                  src={otherUser.avatar} 
                  className={`w-full h-full object-cover transition-opacity duration-1000 ${avatarLoaded ? 'opacity-100' : 'opacity-0'}`} 
                  onLoad={() => setAvatarLoaded(true)}
                />
              ) : (
                otherUser?.username[0].toUpperCase()
              )}
              {!avatarLoaded && otherUser?.avatar && <div className="absolute inset-0 bg-pink-100 animate-pulse" />}
            </div>
            <div className="cursor-pointer" onClick={() => setShowBio(!showBio)}>
              <h2 className="font-heading font-black text-gray-900 leading-none tracking-tight text-lg">{otherUser?.username}</h2>
              <div className="flex items-center space-x-1.5 mt-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Active Whisper</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <div className="hidden sm:flex items-center space-x-2 px-4 py-2 bg-pink-600 rounded-2xl border border-pink-700 shadow-lg shadow-pink-100">
                <ICONS.Clock className="w-3.5 h-3.5 text-white" />
                <span className="text-[10px] text-white font-black uppercase tracking-widest">5m Ephemeral</span>
             </div>
          </div>
        </div>
        
        {/* Bio Expansion */}
        {showBio && otherUser?.bio && (
          <div className="mt-4 px-4 py-4 bg-purple-50 border border-purple-100 rounded-3xl animate-in slide-in-from-top-4 duration-300 shadow-sm">
            <p className="text-[12px] text-purple-700 italic font-bold leading-relaxed">
              "{otherUser.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-pink-50/20">
        <div className="py-16 text-center">
           <div className="inline-block px-8 py-3 bg-white border-2 border-pink-100 rounded-[2.5rem] shadow-sm transform -rotate-1">
             <p className="text-[10px] text-pink-500 font-black uppercase tracking-[0.4em]">Connection Established</p>
           </div>
        </div>

        {messages.map((msg) => (
          <MessageBubble 
            key={msg.id} 
            message={msg} 
            isMe={msg.senderId === currentUserId}
            onViewed={() => db.markAsViewed(msg.id)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t-2 border-pink-100 shadow-[0_-8px_20px_rgba(244,114,182,0.06)] z-20">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3 max-w-4xl mx-auto">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-pink-50 text-pink-500 hover:text-pink-700 hover:bg-pink-100 rounded-[1.5rem] transition-all border border-pink-100 active:scale-90"
          >
            <ICONS.Image className="w-5 h-5" />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload}
          />
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Whisper softly..."
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] focus:ring-4 focus:ring-pink-200/50 focus:border-pink-300 outline-none transition-all text-sm font-bold text-gray-800 placeholder-pink-300"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-4 bg-pink-500 text-white rounded-[1.5rem] hover:bg-pink-600 shadow-xl shadow-pink-200 transition-all disabled:opacity-30 disabled:shadow-none active:scale-95 border-b-4 border-pink-700"
          >
            <ICONS.Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
