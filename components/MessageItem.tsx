
import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { ICONS, DEFAULT_EPHEMERAL_MS } from '../constants';

interface MessageItemProps {
  message: Message;
  isMe: boolean;
  onViewed: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isMe, onViewed }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Load slightly before it enters viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (message.viewedAt && message.expiresAt) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = message.expiresAt! - now;
        if (diff <= 0) {
          setTimeLeft(0);
          return;
        }
        setTimeLeft(diff);
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

  const formatTime = (ms: number) => {
    if (ms >= 3600000) {
      const hrs = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      return `${hrs}h ${mins}m`;
    }
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = message.duration || DEFAULT_EPHEMERAL_MS;
  const ephemeralProgress = timeLeft !== null ? Math.max(0.1, timeLeft / totalDuration) : 1;

  return (
    <div 
      ref={containerRef}
      style={{ opacity: ephemeralProgress }}
      className={`group flex flex-col space-y-1 mb-10 md:mb-14 animate-in fade-in slide-in-from-bottom-3 duration-1000 w-full transition-opacity ease-out`}
    >
      {/* Transcript Header */}
      <div className={`flex items-baseline space-x-3 mb-2 px-1 md:px-4 ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] ${isMe ? 'text-pink-600' : 'text-indigo-600'}`}>
          {isMe ? 'Outgoing' : 'Incoming'}
        </span>
        <span className="text-[8px] md:text-[9px] text-slate-300 font-bold tracking-tight">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {timeLeft !== null && (
          <span className="flex items-center space-x-1.5 text-[8px] md:text-[9px] font-black text-rose-500 animate-pulse bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 shadow-sm">
             <ICONS.Clock className="w-2.5 h-2.5" />
             <span>Fading: {formatTime(timeLeft)}</span>
          </span>
        )}
      </div>

      {/* Transcript Line & Content */}
      <div className={`relative px-0 md:px-4 w-full flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div 
          onClick={handleReveal}
          className={`
            relative max-w-[95%] md:max-w-2xl w-full md:w-auto md:min-w-[280px] py-4 md:py-6 transition-all duration-700 cursor-pointer
            ${isMe ? 'border-r-[3px] md:border-r-4 border-pink-500 text-right pr-5 md:pr-10' : 'border-l-[3px] md:border-l-4 border-indigo-500 text-left pl-5 md:pl-10'}
            ${!revealed && !isMe ? 'bg-slate-50 rounded-2xl filter blur-xl scale-[0.98] opacity-40' : 'bg-transparent'}
            hover:bg-slate-50/30 rounded-2xl
          `}
        >
          {message.type === 'text' ? (
            <p className={`text-sm md:text-base lg:text-lg leading-relaxed font-bold tracking-tight ${isMe ? 'text-slate-800' : 'text-slate-900'}`}>
              {message.content}
            </p>
          ) : (
            <div className={`relative overflow-hidden rounded-2xl md:rounded-[2.5rem] shadow-2xl transition-all duration-700 border-4 border-white ${!revealed && !isMe ? 'h-36' : 'max-h-[75dvh]'}`}>
              {/* Only render image source if in view (Lazy Loading) */}
              {isInView ? (
                <img 
                  src={message.content} 
                  alt="Whisper Frame" 
                  className={`w-full h-auto object-contain transition-all duration-1000 ease-in-out ${imageLoaded ? 'opacity-100' : 'opacity-0 scale-95'} ${!revealed && !isMe ? 'brightness-50' : 'brightness-100 hover:scale-[1.02]'}`}
                  onLoad={() => setImageLoaded(true)}
                />
              ) : (
                <div className="w-full h-64 bg-slate-50" />
              )}
              
              {/* Refined Skeleton Loader */}
              {(!imageLoaded || !isInView) && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-indigo-50/50 to-slate-50 bg-[length:200%_100%] animate-shimmer" 
                     style={{ animation: 'shimmer 2s infinite linear' }}
                />
              )}

              {/* Reveal Overlay */}
              {!revealed && !isMe && (
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 transition-opacity duration-500">
                   <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-xl border border-white/30">
                      <ICONS.Image className="w-6 h-6 text-white" />
                   </div>
                   <div className="px-6 py-2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-2xl transform transition-transform group-hover:scale-110">Witness Visual</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Metadata & Read Confirmation Icons */}
      <div className={`px-1 md:px-4 flex items-center ${isMe ? 'justify-end' : 'justify-start'} space-x-2`}>
         {isMe && (
           <div className="flex items-center space-x-1">
             <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full ${message.viewedAt ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
               {message.viewedAt ? 'Read' : 'Sent'}
             </span>
             {message.viewedAt ? (
               <ICONS.CheckDouble className="w-3 h-3 text-indigo-500" />
             ) : (
               <ICONS.Check className="w-3 h-3 text-slate-300" />
             )}
           </div>
         )}
         {!isMe && !revealed && (
           <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">New Whisper</span>
         )}
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default MessageItem;
