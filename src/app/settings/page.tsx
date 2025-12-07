'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UserSettings {
  name: string;
  handle: string;
  bio: string;
  profilePicture: string;
  display: {
    theme: 'dark' | 'light';
    compactMode: boolean;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'display' | 'account'>('profile');
  const [settings, setSettings] = useState<UserSettings>({
    name: 'XPulse Admin',
    handle: '@XPulseAdmin',
    bio: 'Monitoring threats and narratives in real-time',
    profilePicture: '',
    display: {
      theme: 'dark',
      compactMode: false,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedHandle = localStorage.getItem('xpulse_handle');
    const savedName = localStorage.getItem('xpulse_name');
    const savedBio = localStorage.getItem('xpulse_bio');
    const savedProfilePicture = localStorage.getItem('xpulse_profile_picture');
    const savedSettings = localStorage.getItem('xpulse_settings');

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsed }));
    }

    if (savedHandle) {
      setSettings(prev => ({ ...prev, handle: savedHandle.startsWith('@') ? savedHandle : `@${savedHandle}` }));
    }
    if (savedName) {
      setSettings(prev => ({ ...prev, name: savedName }));
    }
    if (savedBio) {
      setSettings(prev => ({ ...prev, bio: savedBio }));
    }
    if (savedProfilePicture) {
      setSettings(prev => ({ ...prev, profilePicture: savedProfilePicture }));
    }
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    setSaveMessage('');

    // Save to localStorage
    localStorage.setItem('xpulse_handle', settings.handle.replace('@', ''));
    localStorage.setItem('xpulse_name', settings.name);
    localStorage.setItem('xpulse_bio', settings.bio);
    if (settings.profilePicture) {
      localStorage.setItem('xpulse_profile_picture', settings.profilePicture);
    }
    localStorage.setItem('xpulse_settings', JSON.stringify({
      display: settings.display,
    }));

    setTimeout(() => {
      setIsSaving(false);
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    }, 500);
  };

  const handleLogout = () => {
    localStorage.removeItem('xpulse_handle');
    localStorage.removeItem('xpulse_topics');
    localStorage.removeItem('xpulse_name');
    localStorage.removeItem('xpulse_bio');
    localStorage.removeItem('xpulse_profile_picture');
    localStorage.removeItem('xpulse_settings');
    router.push('/?signout=true');
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, profilePicture: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProfilePicture = () => {
    setSettings(prev => ({ ...prev, profilePicture: '' }));
    localStorage.removeItem('xpulse_profile_picture');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tabs = [
    { id: 'profile' as const, name: 'Profile' },
    { id: 'display' as const, name: 'Display' },
    { id: 'account' as const, name: 'Account' },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* X-style sticky header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-[#2F3336]">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-[#E7E9EA]">Settings</h1>
        </div>

        {/* X-style tab navigation */}
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#E7E9EA]'
                  : 'text-[#71767B] hover:bg-[#E7E9EA]/5'
              }`}
            >
              <span>{tab.name}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className="mx-4 mt-4 p-4 rounded-xl bg-[#00BA7C]/10 border border-[#00BA7C] flex items-center gap-3">
          <svg className="w-5 h-5 text-[#00BA7C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[#00BA7C] font-medium">{saveMessage}</span>
        </div>
      )}

      {/* Content */}
      <div className="max-w-[600px] mx-auto">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div>
            {/* Profile Picture Section */}
            <div className="px-4 py-6 border-b border-[#2F3336]">
              <h2 className="text-[17px] font-bold text-[#E7E9EA] mb-4">Profile picture</h2>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-[#333639] flex items-center justify-center overflow-hidden border-2 border-[#2F3336]">
                  {settings.profilePicture ? (
                    <img src={settings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-[#71767B]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-[#E7E9EA] text-black text-sm font-bold hover:bg-[#D7D9DB] transition-colors"
                  >
                    Upload
                  </button>
                  {settings.profilePicture && (
                    <button
                      onClick={handleRemoveProfilePicture}
                      className="px-4 py-2 rounded-full border border-[#536471] text-[#E7E9EA] text-sm font-bold hover:bg-[#E7E9EA]/10 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              </div>
              <p className="text-[#71767B] text-[13px] mt-3">Square image, at least 400x400px, max 5MB</p>
            </div>

            {/* Name */}
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <label className="block text-[#71767B] text-[13px] mb-1">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
                className="w-full bg-transparent text-[#E7E9EA] text-[17px] outline-none placeholder-[#71767B]"
              />
            </div>

            {/* Handle */}
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <label className="block text-[#71767B] text-[13px] mb-1">Username</label>
              <div className="flex items-center gap-1">
                <span className="text-[#71767B] text-[17px]">@</span>
                <input
                  type="text"
                  value={settings.handle.replace('@', '')}
                  onChange={(e) => setSettings(prev => ({ ...prev, handle: e.target.value }))}
                  placeholder="username"
                  className="flex-1 bg-transparent text-[#E7E9EA] text-[17px] outline-none placeholder-[#71767B]"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <label className="block text-[#71767B] text-[13px] mb-1">Bio</label>
              <textarea
                value={settings.bio}
                onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself..."
                rows={3}
                className="w-full bg-transparent text-[#E7E9EA] text-[15px] outline-none placeholder-[#71767B] resize-none"
              />
              <p className="text-[#71767B] text-[13px] mt-1">{settings.bio.length}/160</p>
            </div>

            {/* Save Button */}
            <div className="px-4 py-4">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-3 rounded-full bg-[#E7E9EA] text-black font-bold text-[15px] hover:bg-[#D7D9DB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Display Tab */}
        {activeTab === 'display' && (
          <div>
            {/* Theme */}
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-[#E7E9EA]">Theme</h3>
                  <p className="text-[13px] text-[#71767B]">Select your preferred theme</p>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSettings(prev => ({ ...prev, display: { ...prev.display, theme: 'dark' } }))}
                  className={`flex-1 py-3 rounded-xl border transition-colors ${
                    settings.display.theme === 'dark'
                      ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-[#1D9BF0]'
                      : 'border-[#2F3336] text-[#71767B] hover:bg-[#16181C]'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setSettings(prev => ({ ...prev, display: { ...prev.display, theme: 'light' } }))}
                  className={`flex-1 py-3 rounded-xl border transition-colors ${
                    settings.display.theme === 'light'
                      ? 'border-[#1D9BF0] bg-[#1D9BF0]/10 text-[#1D9BF0]'
                      : 'border-[#2F3336] text-[#71767B] hover:bg-[#16181C]'
                  }`}
                >
                  Light
                </button>
              </div>
              <p className="text-[#71767B] text-[13px] mt-2">Light theme coming soon</p>
            </div>

            {/* Compact Mode */}
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[15px] font-bold text-[#E7E9EA]">Compact mode</h3>
                  <p className="text-[13px] text-[#71767B]">Reduce spacing for more content</p>
                </div>
                <button
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    display: { ...prev.display, compactMode: !prev.display.compactMode }
                  }))}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    settings.display.compactMode ? 'bg-[#1D9BF0]' : 'bg-[#3E4144]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                    settings.display.compactMode ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>

            {/* Save Button */}
            <div className="px-4 py-4">
              <button
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="w-full py-3 rounded-full bg-[#E7E9EA] text-black font-bold text-[15px] hover:bg-[#D7D9DB] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div>
            {/* Current Session */}
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <h3 className="text-[15px] font-bold text-[#E7E9EA] mb-1">Current session</h3>
              <p className="text-[13px] text-[#71767B]">
                Logged in as <span className="text-[#E7E9EA]">{settings.handle}</span>
              </p>
            </div>

            {/* Logout */}
            <div className="px-4 py-4 border-b border-[#2F3336]">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-full border border-[#F4212E] text-[#F4212E] font-bold text-[15px] hover:bg-[#F4212E]/10 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Log out
              </button>
              <p className="text-[#71767B] text-[13px] mt-3 text-center">
                This will clear your session and return you to the sign-in page
              </p>
            </div>

            {/* Danger Zone */}
            <div className="px-4 py-6">
              <h3 className="text-[15px] font-bold text-[#F4212E] mb-3">Danger zone</h3>
              <div className="p-4 rounded-xl border border-[#F4212E]/30 bg-[#F4212E]/5">
                <h4 className="text-[15px] font-bold text-[#E7E9EA] mb-1">Clear all data</h4>
                <p className="text-[13px] text-[#71767B] mb-3">
                  This will permanently delete all your saved preferences and profile data.
                </p>
                <button
                  onClick={() => {
                    if (confirm('Are you sure? This action cannot be undone.')) {
                      localStorage.clear();
                      router.push('/?signout=true');
                    }
                  }}
                  className="px-4 py-2 rounded-full bg-[#F4212E] text-white text-sm font-bold hover:bg-[#F4212E]/90 transition-colors"
                >
                  Clear all data
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
