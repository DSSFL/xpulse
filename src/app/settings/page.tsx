'use client';

import { useState, useEffect, useRef } from 'react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'display'>('profile');
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

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
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
    { id: 'profile' as const, name: 'Profile', icon: '👤' },
    { id: 'display' as const, name: 'Display', icon: '🎨' },
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-x-white mb-2">Settings</h1>
          <p className="text-x-gray-text">Manage your XPulse account and preferences</p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className="mb-6 p-4 rounded-xl bg-vital-healthy/10 border border-vital-healthy flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 text-vital-healthy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-vital-healthy font-medium">{saveMessage}</span>
          </div>
        )}

        <div className="flex gap-6">
          {/* Sidebar Tabs */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-x-gray-dark border border-x-gray-border rounded-2xl p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab.id
                      ? 'bg-x-gray-light text-x-white font-medium'
                      : 'text-x-gray-text hover:bg-x-gray hover:text-x-white'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div className="bg-x-gray-dark border border-x-gray-border rounded-2xl p-8">

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-x-white mb-4">Profile Settings</h2>
                    <p className="text-x-gray-text mb-6">Manage your public profile information</p>
                  </div>

                  {/* Profile Picture */}
                  <div>
                    <label className="block text-x-white font-medium mb-3">Profile Picture</label>
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24 rounded-full bg-x-gray-light flex items-center justify-center overflow-hidden border-2 border-x-gray-border">
                        {settings.profilePicture ? (
                          <img src={settings.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-12 h-12 text-x-gray-text" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg bg-pulse-blue text-white font-medium hover:bg-pulse-blue/90 transition-colors"
                        >
                          Upload Photo
                        </button>
                        {settings.profilePicture && (
                          <button
                            onClick={handleRemoveProfilePicture}
                            className="px-4 py-2 rounded-lg bg-x-gray-light text-x-white hover:bg-x-gray-border transition-colors"
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
                    <p className="text-x-gray-text text-sm mt-2">Recommended: Square image, at least 400x400px, max 5MB</p>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-x-white font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your Name"
                      className="w-full px-4 py-3 rounded-xl bg-x-gray-light border border-x-gray-border text-x-white placeholder-x-gray-text focus:outline-none focus:border-pulse-blue focus:ring-2 focus:ring-pulse-blue/20 transition-all"
                    />
                  </div>

                  {/* Handle */}
                  <div>
                    <label className="block text-x-white font-medium mb-2">X Handle</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-x-gray-text">@</span>
                      <input
                        type="text"
                        value={settings.handle.replace('@', '')}
                        onChange={(e) => setSettings(prev => ({ ...prev, handle: e.target.value }))}
                        placeholder="username"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-x-gray-light border border-x-gray-border text-x-white placeholder-x-gray-text focus:outline-none focus:border-pulse-blue focus:ring-2 focus:ring-pulse-blue/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-x-white font-medium mb-2">Bio</label>
                    <textarea
                      value={settings.bio}
                      onChange={(e) => setSettings(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-x-gray-light border border-x-gray-border text-x-white placeholder-x-gray-text focus:outline-none focus:border-pulse-blue focus:ring-2 focus:ring-pulse-blue/20 transition-all resize-none"
                    />
                    <p className="text-x-gray-text text-sm mt-2">{settings.bio.length}/160 characters</p>
                  </div>
                </div>
              )}

              {/* Display Tab */}
              {activeTab === 'display' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-x-white mb-4">Display Settings</h2>
                    <p className="text-x-gray-text mb-6">Customize how XPulse looks and feels</p>
                  </div>

                  <div className="space-y-4">
                    {/* Theme */}
                    <div className="p-4 rounded-xl bg-x-gray/50 border border-x-gray-border">
                      <p className="text-x-white font-medium mb-3">Theme</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, display: { ...prev.display, theme: 'dark' } }))}
                          className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                            settings.display.theme === 'dark'
                              ? 'bg-pulse-blue text-white'
                              : 'bg-x-gray-light text-x-gray-text hover:text-x-white'
                          }`}
                        >
                          🌙 Dark
                        </button>
                        <button
                          onClick={() => setSettings(prev => ({ ...prev, display: { ...prev.display, theme: 'light' } }))}
                          className={`flex-1 px-4 py-3 rounded-lg transition-all ${
                            settings.display.theme === 'light'
                              ? 'bg-pulse-blue text-white'
                              : 'bg-x-gray-light text-x-gray-text hover:text-x-white'
                          }`}
                        >
                          ☀️ Light
                        </button>
                      </div>
                      <p className="text-x-gray-text text-sm mt-2">Light theme coming soon</p>
                    </div>

                    {/* Compact Mode */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-x-gray/50 border border-x-gray-border">
                      <div>
                        <p className="text-x-white font-medium">Compact Mode</p>
                        <p className="text-x-gray-text text-sm">Reduce spacing for more content</p>
                      </div>
                      <button
                        onClick={() => setSettings(prev => ({
                          ...prev,
                          display: { ...prev.display, compactMode: !prev.display.compactMode }
                        }))}
                        className={`relative w-14 h-8 rounded-full transition-colors ${
                          settings.display.compactMode ? 'bg-pulse-blue' : 'bg-x-gray-border'
                        }`}
                      >
                        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                          settings.display.compactMode ? 'translate-x-6' : ''
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-8 border-t border-x-gray-border">
                <button
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-pulse-purple to-pulse-blue text-white font-bold text-lg hover:shadow-lg hover:shadow-pulse-purple/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
