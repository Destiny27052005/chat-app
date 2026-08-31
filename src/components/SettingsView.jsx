import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  User,
  Moon,
  Sun,
  ShieldCheck,
  Bell,
  LogOut,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  UploadCloud
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function SettingsView({ currentUser, onUserUpdated, onLogout }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(currentUser?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Apply Dark Mode class to <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleStartEditing = () => {
    setNameInput(currentUser?.name || '');
    setIsEditingName(true);
  };

  const handleCancelEditing = () => {
    setNameInput(currentUser?.name || '');
    setIsEditingName(false);
  };

  // 1. Update Name
  const handleSaveName = async () => {
    if (!nameInput.trim() || nameInput.trim() === currentUser?.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setSavingName(true);
      const res = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        { name: nameInput.trim() },
        { headers: getAuthHeaders() }
      );
      onUserUpdated(res.data);
      setIsEditingName(false);
    } catch (err) {
      console.error('Failed to update name:', err);
      alert(err.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  // 2. Change Profile Photo
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadingAvatar(true);
      const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      });

      const updateRes = await axios.put(
        `${API_BASE_URL}/auth/profile`,
        { avatar: uploadRes.data.url },
        { headers: getAuthHeaders() }
      );

      onUserUpdated(updateRes.data);
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      alert('Failed to upload profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 3. Delete Account
  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      'Are you sure you want to delete your account? This cannot be undone. Type "DELETE" to confirm:'
    );

    if (confirmation === 'DELETE') {
      try {
        setDeletingAccount(true);
        await axios.delete(`${API_BASE_URL}/auth/account`, {
          headers: getAuthHeaders(),
        });
        localStorage.removeItem('token');
        onLogout();
      } catch (err) {
        console.error('Account deletion error:', err);
        alert(err.response?.data?.message || 'Failed to delete account');
      } finally {
        setDeletingAccount(false);
      }
    }
  };

  return (
    <div className="flex-1 h-full bg-[#fafafc] dark:bg-slate-950 p-6 md:p-10 overflow-y-auto transition-colors">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings & Account</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Manage your profile, preferences, and authentication
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative group">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 dark:border-slate-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-100 dark:border-indigo-900">
                  {currentUser?.name?.charAt(0) || <User size={24} />}
                </div>
              )}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 bg-black/40 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition"
                title="Upload Photo"
              >
                {uploadingAvatar ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </div>

            <div className="min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="text-sm font-bold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={savingName}
                    className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md"
                  >
                    {savingName ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditing}
                    className="p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 truncate">
                    {currentUser?.name}
                  </h3>
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition"
                    title="Edit Name"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              )}
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{currentUser?.email}</p>
              <label
                htmlFor="avatar-upload"
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer inline-block mt-1"
              >
                Change profile photo
              </label>
            </div>
          </div>
        </div>

        {/* Preferences List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl divide-y divide-slate-100 dark:divide-slate-800 shadow-xs">
          <div className="p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                <Bell size={18} />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notifications</span>
            </div>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Enabled</span>
          </div>

          <div className="p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                <ShieldCheck size={18} />
              </div>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Privacy & Security</span>
            </div>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500">JWT Verified</span>
          </div>

          {/* Dark Mode Toggle */}
          <div className="p-4.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl">
                {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Dark Mode</span>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {isDarkMode ? 'Dark theme enabled' : 'Light theme enabled'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                isDarkMode ? 'bg-indigo-600 justify-end' : 'bg-slate-200 dark:bg-slate-700 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md transition" />
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3.5 px-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 rounded-2xl text-xs font-bold hover:bg-rose-100/70 dark:hover:bg-rose-950/40 transition flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Log Out of Chattr</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="w-full py-3.5 px-4 bg-transparent text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-2xl text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            {deletingAccount ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span>Delete Account Permanently</span>
          </button>
        </div>
      </div>
    </div>
  );
}