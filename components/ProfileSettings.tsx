
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
      console.error(e);
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
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-pink-50 flex items-center space-x-4">
        <button onClick={onClose} className="p-2 text-gray-400 hover:text-pink-400 transition-colors">
          <ICONS.Back className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-heading font-bold text-gray-800">Profile Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-pink-50 overflow-hidden border-4 border-white shadow-lg flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <ICONS.User className="w-16 h-16 text-pink-200" />
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-3 bg-pink-400 text-white rounded-2xl shadow-lg hover:bg-pink-500 transition-all transform hover:scale-110"
            >
              <ICONS.Image className="w-5 h-5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange} 
            />
          </div>
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Tap to change avatar</p>
        </div>

        {/* Bio Section */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-1">Your Whisper Bio</label>
          <textarea
            className="w-full px-4 py-3 bg-pink-50/50 border border-pink-100 rounded-2xl focus:ring-2 focus:ring-pink-200 focus:border-pink-300 outline-none transition-all text-sm text-gray-700 placeholder-pink-300/60 h-32 resize-none"
            placeholder="Tell a quiet story about yourself..."
            value={bio}
            maxLength={120}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="flex justify-end">
            <span className="text-[10px] text-gray-300 font-bold">{bio.length}/120</span>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-2xl">
          <p className="text-[10px] text-purple-400 leading-relaxed italic">
            "Your profile is visible to anyone who searches for your exact username. Stay safe, stay quiet."
          </p>
        </div>
      </div>

      <div className="p-6 border-t border-pink-50 bg-gray-50/50">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 bg-pink-400 hover:bg-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProfileSettings;
