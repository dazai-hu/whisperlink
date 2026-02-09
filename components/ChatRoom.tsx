
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

    const interval = setInterval(fetchChat, 2000);
    return () => clearInterval(interval);
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
    fetchChat();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      await db.sendMessage(currentUserId, otherUserId, 'image', base64);
      fetchChat();
    };
    reader.readAsDataURL(file);
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#fdf6f9]">
      <div className="w-10 h-10 border-4 border-pink-100 border-t-pink-400 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Top Bar */}
      <div className="p-4 border-b border-pink-50 bg-white flex flex-col shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button onClick={onBack} className="p-2 md:hidden text-gray-400 hover:text-pink-400 transition-colors">
              <ICONS.Back className="w-5 h-5" />
            </button>
            <div 
              onClick={() => setShowBio(!showBio)}
              className="w-10 h-10 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl overflow-hidden flex items-center justify-center font-bold text-pink-300 cursor-pointer hover:scale-105 transition-transform"
            >
              {otherUser?.avatar ? (
                <img src={otherUser.avatar} className="w-full h-full object-cover" />
              ) : (
                otherUser?.username[0].toUpperCase()
              )}
            </div>
            <div className="cursor-pointer" onClick={() => setShowBio(!showBio)}>
              <h2 className="font-heading font-bold text-gray-800 leading-none">{otherUser?.username}</h2>
              <div className="flex items-center space-x-1 mt-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">Quiet Session</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             <div className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-pink-50 rounded-full border border-pink-100">
                <ICONS.Clock className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[9px] text-pink-500 font-bold uppercase tracking-tight">5m Ephemeral</span>
             </div>
          </div>
        </div>
        
        {/* Subtle Bio Expansion */}
        {showBio && otherUser?.bio && (
          <div className="mt-4 px-2 py-3 bg-purple-50/50 rounded-2xl animate-in slide-in-from-top-2 duration-300">
            <p className="text-[11px] text-purple-400 italic font-medium leading-relaxed">
              "{otherUser.bio}"
            </p>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-[#fdf6f9]">
        <div className="py-12 text-center">
           <div className="inline-block px-6 py-2.5 bg-white/80 backdrop-blur-md border border-pink-50 rounded-3xl shadow-sm">
             <p className="text-[10px] text-pink-300 font-bold uppercase tracking-[0.3em]">Whisper Link Established</p>
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
      <div className="p-4 bg-white border-t border-pink-50 shadow-[0_-4px_12px_rgba(249,168,212,0.05)]">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3 max-w-4xl mx-auto">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3.5 bg-pink-50 text-pink-400 hover:text-pink-600 hover:bg-pink-100 rounded-2xl transition-all shadow-sm"
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
              placeholder="Whisper something quiet..."
              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-3xl focus:ring-4 focus:ring-pink-100/50 outline-none transition-all text-sm font-medium"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="p-3.5 bg-pink-400 text-white rounded-2xl hover:bg-pink-500 shadow-xl shadow-pink-200 transition-all disabled:opacity-50 disabled:shadow-none active:scale-95"
          >
            <ICONS.Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
