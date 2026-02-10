
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { db } from '../services/dbService';
import { ICONS } from '../constants';

interface ProfileSettingsProps {
  user: User;
  onClose: () => void;
  onUpdate: (user: User) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onClose, onUpdate }) => {
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await db.updateUserProfile(user.id, { bio, avatar });
      onUpdate(updatedUser);
      onClose();
    } catch (e) {
      console.error('Update profile error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-left duration-500 ease-out z-50">
      {/* Settings Header */}
      <div className="px-6 py-6 md:px-8 md:py-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-5">
          <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-all active:scale-90">
            <ICONS.Back className="w-7 h-7" />
          </button>
          <h2 className="text-2xl font-heading font-black text-slate-900 tracking-tighter uppercase">Identity</h2>
        </div>
        <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse"></div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 space-y-12 custom-scrollbar">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-8">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-36 h-36 md:w-48 md:h-48 rounded-[3rem] bg-slate-50 overflow-hidden border-4 border-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105">
              {avatar ? (
                <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-200 flex flex-col items-center">
                   <ICONS.User className="w-16 h-16" />
                   <span className="text-[10px] font-black uppercase tracking-widest mt-2">No Image</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-2xl hover:bg-indigo-700 transition-all transform hover:rotate-6 active:scale-90 border-4 border-white">
              <ICONS.Image className="w-6 h-6" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-heading font-black text-slate-900 text-3xl tracking-tighter">{user.username}</h3>
            <p className="text-[11px] text-slate-400 uppercase font-black tracking-[0.3em] opacity-80">Ghost Member</p>
          </div>
        </div>

        {/* Bio Input */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">The Internal Whisper</label>
          <div className="relative">
            <textarea
              className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:bg-white focus:border-indigo-600 outline-none transition-all text-sm md:text-base font-bold text-slate-800 placeholder-slate-300 h-40 resize-none shadow-inner"
              placeholder="What remains when you are silent?"
              value={bio}
              maxLength={120}
              onChange={(e) => setBio(e.target.value)}
            />
            <div className="absolute bottom-4 right-6">
               <span className="text-[10px] text-slate-300 font-black tracking-widest">{bio.length} / 120</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] border-2 border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <p className="text-[12px] text-slate-300 font-bold leading-relaxed italic opacity-80 relative z-10">
            "Your identity is your only trace in this space. Change it only if you must vanish further."
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="p-6 md:p-10 bg-white border-t border-slate-100 shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-3xl shadow-2xl transition-all flex items-center justify-center space-x-3 uppercase tracking-[0.2em] border-b-4 border-indigo-900 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Update Link Profile</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
