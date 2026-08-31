import { useState, useRef } from 'react';
import axios from 'axios';
import { Camera, Loader2, LogOut, Bell, Shield, Moon, Check } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SettingsView({ currentUser, onLogout, onUserUpdated }) {
  const [uploading, setUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setError('');

      // 1. Upload the file
      const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      const newAvatarUrl = uploadRes.data.url;

      // 2. Persist new avatar URL to user profile
      const profileRes = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        { avatar: newAvatarUrl },
        { headers: getAuthHeaders() }
      );

      // 3. Update global user state
      onUserUpdated?.(profileRes.data);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update avatar:', err);
      setError(err.response?.data?.error || 'Failed to update profile picture.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const userAvatar =
    currentUser?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser?.name || 'User')}`;

  return (
    <div className="flex-1 bg-white flex flex-col p-8 overflow-y-auto max-w-3xl">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">Settings & Account</h2>
        <p className="text-xs text-slate-400 mt-0.5">Manage your profile, preferences, and authentication</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium">
          {error}
        </div>
      )}

      {/* Profile Picture Card */}
      <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          className="hidden"
        />

        {/* Clickable Avatar with Hover/Loading Overlay */}
        <div
          className="relative group cursor-pointer shrink-0"
          onClick={() => !uploading && fileInputRef.current?.click()}
          title="Change profile picture"
        >
          <img
            src={userAvatar}
            alt={currentUser?.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm bg-white"
          />

          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200">
            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white">
              <Loader2 size={18} className="animate-spin" />
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-base">{currentUser?.name}</h3>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <Check size={12} /> Saved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 truncate">{currentUser?.email}</p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition disabled:opacity-50"
          >
            {uploading ? 'Uploading picture...' : 'Change profile photo'}
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <Bell size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Notifications</span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Enabled</span>
        </div>

        <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <Shield size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Privacy & Security</span>
          </div>
          <span className="text-xs text-slate-400">JWT Verified</span>
        </div>

        <div className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <Moon size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Dark Mode</span>
          </div>
          <span className="text-xs text-slate-400">System Default</span>
        </div>
      </div>

      {/* Logout Action */}
      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-sm rounded-xl transition border border-rose-100"
      >
        <LogOut size={16} />
        <span>Log Out of Chattr</span>
      </button>
    </div>
  );
}