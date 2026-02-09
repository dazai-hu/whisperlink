
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
        {/* Timestamp / Meta info */}
        <div className={`flex items-center space-x-2 mb-1 px-1 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
          <span className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {timeLeft && (
            <span className="flex items-center space-x-1 text-[9px] text-pink-400 font-bold animate-pulse">
               <ICONS.Clock className="w-2.5 h-2.5" />
               <span>{timeLeft}</span>
            </span>
          )}
        </div>

        {/* Content Bubble */}
        <div 
          onClick={handleReveal}
          className={`
            cursor-pointer p-4 rounded-3xl transition-all duration-300 shadow-sm
            ${isMe ? 'bg-white border-2 border-pink-50 rounded-tr-none text-gray-700' : 'bg-pink-400 text-white rounded-tl-none shadow-pink-100'}
            ${!revealed && !isMe ? 'blur-md hover:blur-none scale-[0.98]' : 'scale-100'}
          `}
        >
          {message.type === 'text' ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border border-white/20">
              <img 
                src={message.content} 
                alt="Whisper Attachment" 
                className={`max-w-full h-auto object-cover rounded-xl transition-all duration-700 ${!revealed && !isMe ? 'brightness-50' : 'brightness-100'}`}
              />
              {!revealed && !isMe && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 flex items-center space-x-2">
                      <ICONS.Image className="w-3 h-3 text-white" />
                      <span className="text-[10px] text-white font-bold uppercase">Tap to see whisper</span>
                   </div>
                </div>
              )}
            </div>
          )}
          
          {/* Instruction to reveal if not viewed */}
          {!message.viewedAt && !isMe && !revealed && (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
               {/* Click logic is handled by parent div */}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className={`mt-1 flex items-center px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
           {isMe && message.viewedAt && (
             <span className="text-[8px] text-gray-300 uppercase font-bold tracking-widest">Seen</span>
           )}
           {isMe && !message.viewedAt && (
             <span className="text-[8px] text-pink-300 uppercase font-bold tracking-widest">Sent</span>
           )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
