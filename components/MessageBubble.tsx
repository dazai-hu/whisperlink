
import React, { useState, useEffect } from 'react';
import { Message } from '../types';
import { ICONS } from '../constants';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  onViewed: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, onViewed }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (message.viewedAt && message.expiresAt) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = message.expiresAt! - now;
        if (diff <= 0) {
          setTimeLeft('Expired');
          return;
        }
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [message.viewedAt, message.expiresAt]);

  const handleReveal = () => {
    if (!message.viewedAt && !isMe) {
      onViewed();
    }
    setRevealed(true);
  };

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`max-w-[85%] sm:max-w-[70%] relative group`}>
        {/* Metadata info */}
        <div className={`flex items-center space-x-2 mb-1.5 px-2 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
          <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest opacity-80">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {timeLeft && (
            <span className="flex items-center space-x-1 text-[10px] text-pink-600 font-black animate-pulse bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200 shadow-sm">
               <ICONS.Clock className="w-2.5 h-2.5" />
               <span>{timeLeft}</span>
            </span>
          )}
        </div>

        {/* Content Bubble */}
        <div 
          onClick={handleReveal}
          className={`
            cursor-pointer p-4 rounded-[1.8rem] transition-all duration-500 shadow-md border-2
            ${isMe ? 'bg-white border-pink-100 rounded-tr-none text-gray-900' : 'bg-pink-500 border-pink-600 text-white rounded-tl-none shadow-pink-200'}
            ${!revealed && !isMe ? 'blur-xl hover:blur-lg scale-[0.96] opacity-60' : 'scale-100 opacity-100'}
          `}
        >
          {message.type === 'text' ? (
            <p className={`text-sm leading-relaxed whitespace-pre-wrap font-bold ${isMe ? 'text-gray-800' : 'text-white'}`}>
              {message.content}
            </p>
          ) : (
            <div className="relative overflow-hidden rounded-[1.2rem] border-2 border-white/30 shadow-inner bg-pink-100/20">
              <img 
                src={message.content} 
                alt="Whisper Attachment" 
                className={`max-w-full h-auto object-cover rounded-[1rem] transition-all duration-1000 ${!revealed && !isMe ? 'brightness-50' : 'brightness-100'} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && <div className="absolute inset-0 bg-pink-200 animate-pulse" />}
              {!revealed && !isMe && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white/30 backdrop-blur-xl px-5 py-2.5 rounded-full border-2 border-white/50 flex items-center space-x-3 shadow-xl transform group-hover:scale-110 transition-transform">
                      <ICONS.Image className="w-4 h-4 text-white drop-shadow-md" />
                      <span className="text-[11px] text-white font-black uppercase tracking-widest drop-shadow-md">Tap to Reveal</span>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className={`mt-1.5 flex items-center px-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
           {isMe && message.viewedAt && (
             <span className="text-[9px] text-purple-600 font-black uppercase tracking-[0.2em] bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">Read</span>
           )}
           {isMe && !message.viewedAt && (
             <span className="text-[9px] text-pink-400 font-black uppercase tracking-[0.2em]">Sent</span>
           )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
