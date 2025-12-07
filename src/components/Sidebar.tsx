'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTrackedUser } from '@/contexts/TrackedUserContext';

const navItems = [
  {
    name: 'Vitals',
    href: '/',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]">
        <path d="M12 1.696L.622 8.807l1.06 1.696L3 9.679V19.5C3 20.881 4.119 22 5.5 22h13c1.381 0 2.5-1.119 2.5-2.5V9.679l1.318.824 1.06-1.696L12 1.696zM12 16.5c-1.933 0-3.5-1.567-3.5-3.5s1.567-3.5 3.5-3.5 3.5 1.567 3.5 3.5-1.567 3.5-3.5 3.5z" />
      </svg>
    ),
  },
  {
    name: 'Monitor',
    href: '/monitor',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]">
        <path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-8.5 6.5c0-4.694 3.806-8.5 8.5-8.5s8.5 3.806 8.5 8.5c0 1.986-.682 3.815-1.824 5.262l4.781 4.781-1.414 1.414-4.781-4.781c-1.447 1.142-3.276 1.824-5.262 1.824-4.694 0-8.5-3.806-8.5-8.5z" />
      </svg>
    ),
  },
  {
    name: 'Analyze',
    href: '/analyze',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]">
        <path d="M8.75 21V3h2v18h-2zM18 21V8.5h2V21h-2zM4 21l.004-10h2L6 21H4zm9.248 0v-7h2v7h-2z" />
      </svg>
    ),
  },
  {
    name: 'Signal',
    href: '/signal',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]">
        <path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958zM12 20c-1.306 0-2.417-.835-2.829-2h5.658c-.412 1.165-1.523 2-2.829 2zm-6.866-4l.847-6.698C6.364 6.272 8.941 4 11.996 4s5.627 2.268 6.013 5.295L18.864 16H5.134z" />
      </svg>
    ),
    badge: 3,
  },
  {
    name: 'Get XPulse',
    href: '/get-xpulse',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]">
        <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13v4.414l3.293 3.293 1.414-1.414L13 10.586V7h-2z" />
      </svg>
    ),
  },
];

const bottomNavItems = [
  {
    name: 'Settings',
    href: '/settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]">
        <path d="M10.54 1.75h2.92l1.57 2.36c.11.17.32.25.53.21l2.53-.59 2.17 2.17-.58 2.54c-.04.2.04.41.21.53l2.36 1.57v2.92l-2.36 1.57c-.17.11-.25.32-.21.53l.58 2.54-2.17 2.17-2.53-.59c-.2-.04-.42.04-.53.21l-1.57 2.36h-2.92l-1.58-2.36c-.11-.17-.32-.25-.52-.21l-2.54.59-2.17-2.17.58-2.54c.04-.2-.03-.41-.21-.53l-2.35-1.57v-2.92L4.1 8.97c.17-.12.25-.33.21-.53L3.73 5.9 5.9 3.73l2.54.59c.2.04.41-.04.52-.21l1.58-2.36zm1.07 2l-.98 1.47C10.05 6.08 9 6.5 7.99 6.27l-1.46-.34-.6.6.33 1.46c.24 1.01-.18 2.07-1.05 2.64l-1.46.98v.78l1.46.98c.87.57 1.29 1.63 1.05 2.64l-.33 1.46.6.6 1.46-.34c1.01-.23 2.06.19 2.64 1.05l.98 1.47h.78l.97-1.47c.58-.86 1.63-1.28 2.65-1.05l1.45.34.61-.6-.34-1.46c-.23-1.01.18-2.07 1.05-2.64l1.47-.98v-.78l-1.47-.98c-.87-.57-1.28-1.63-1.05-2.64l.34-1.46-.61-.6-1.45.34c-1.02.23-2.07-.19-2.65-1.05l-.97-1.47h-.78zM12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { trackedHandle, userInfo } = useTrackedUser();

  return (
    <>
    {/* Desktop Sidebar */}
    <aside className="hidden md:fixed md:flex left-0 top-0 h-screen w-[68px] xl:w-[275px] border-r border-[#2F3336] bg-black flex-col">
      {/* Logo */}
      <div className="p-3 xl:px-3 xl:py-3">
        <Link href="/" className="flex items-center justify-center xl:justify-start w-[50px] h-[50px] xl:w-auto rounded-full hover:bg-[#181818] transition-colors">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/xpulse-logo.png"
            alt="XPulse"
            className="h-8 xl:h-8 w-auto xl:ml-3"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 xl:px-3 py-1">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-center xl:justify-start gap-5 p-3 rounded-full transition-colors hover:bg-[#181818] ${
                    isActive ? 'font-bold' : 'font-normal'
                  }`}
                >
                  <span className="relative text-[#E7E9EA]">
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#1D9BF0] text-[11px] font-bold rounded-full flex items-center justify-center text-white px-1">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className={`hidden xl:block text-xl text-[#E7E9EA] ${isActive ? 'font-bold' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 xl:px-3 pb-3">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center justify-center xl:justify-start gap-5 p-3 rounded-full transition-colors hover:bg-[#181818] ${
                    isActive ? 'font-bold' : 'font-normal'
                  }`}
                >
                  <span className="text-[#E7E9EA]">{item.icon}</span>
                  <span className={`hidden xl:block text-xl text-[#E7E9EA] ${isActive ? 'font-bold' : ''}`}>
                    {item.name}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* User Profile - X Style */}
        <div className="mt-3 p-3 rounded-full hover:bg-[#181818] transition-colors cursor-pointer">
          <div className="flex items-center justify-center xl:justify-start gap-3">
            {/* Profile Photo */}
            <div className="w-10 h-10 rounded-full bg-[#333639] flex items-center justify-center overflow-hidden flex-shrink-0">
              {userInfo?.profile_image_url ? (
                <img src={userInfo.profile_image_url} alt={userInfo.name} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-6 h-6 text-[#71767B]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5.651 19h12.698c-.337-1.8-1.023-3.21-1.945-4.19C15.318 13.65 13.838 13 12 13s-3.317.65-4.404 1.81c-.922.98-1.608 2.39-1.945 4.19zm.486-5.56C7.627 11.85 9.648 11 12 11s4.373.85 5.863 2.44c1.477 1.58 2.366 3.8 2.632 6.46l.11 1.1H3.395l.11-1.1c.266-2.66 1.155-4.88 2.632-6.46zM12 4c-1.105 0-2 .9-2 2s.895 2 2 2 2-.9 2-2-.895-2-2-2zM8 6c0-2.21 1.791-4 4-4s4 1.79 4 4-1.791 4-4 4-4-1.79-4-4z" />
                </svg>
              )}
            </div>
            {/* Name and Handle */}
            <div className="hidden xl:block flex-1 min-w-0">
              <p className="text-[#E7E9EA] font-bold text-[15px] truncate">
                {userInfo?.name || trackedHandle || 'XPulse'}
              </p>
              <p className="text-[#71767B] text-[15px] truncate">
                @{userInfo?.username || trackedHandle || 'xpulse'}
              </p>
            </div>
            {/* Three dots menu */}
            <div className="hidden xl:block">
              <svg className="w-5 h-5 text-[#E7E9EA]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 12c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm9 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm7 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </aside>

    {/* Mobile Bottom Navigation */}
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-[#2F3336] z-50" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.slice(0, 4).map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                isActive ? 'text-[#1D9BF0]' : 'text-[#71767B]'
              }`}
            >
              <span className="relative">
                {item.icon}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#1D9BF0] text-[11px] font-bold rounded-full flex items-center justify-center text-white px-1">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        {/* Settings in mobile nav */}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
            pathname === '/settings' ? 'text-[#1D9BF0]' : 'text-[#71767B]'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[26px] h-[26px]">
            <path d="M10.54 1.75h2.92l1.57 2.36c.11.17.32.25.53.21l2.53-.59 2.17 2.17-.58 2.54c-.04.2.04.41.21.53l2.36 1.57v2.92l-2.36 1.57c-.17.11-.25.32-.21.53l.58 2.54-2.17 2.17-2.53-.59c-.2-.04-.42.04-.53.21l-1.57 2.36h-2.92l-1.58-2.36c-.11-.17-.32-.25-.52-.21l-2.54.59-2.17-2.17.58-2.54c.04-.2-.03-.41-.21-.53l-2.35-1.57v-2.92L4.1 8.97c.17-.12.25-.33.21-.53L3.73 5.9 5.9 3.73l2.54.59c.2.04.41-.04.52-.21l1.58-2.36zm1.07 2l-.98 1.47C10.05 6.08 9 6.5 7.99 6.27l-1.46-.34-.6.6.33 1.46c.24 1.01-.18 2.07-1.05 2.64l-1.46.98v.78l1.46.98c.87.57 1.29 1.63 1.05 2.64l-.33 1.46.6.6 1.46-.34c1.01-.23 2.06.19 2.64 1.05l.98 1.47h.78l.97-1.47c.58-.86 1.63-1.28 2.65-1.05l1.45.34.61-.6-.34-1.46c-.23-1.01.18-2.07 1.05-2.64l1.47-.98v-.78l-1.47-.98c-.87-.57-1.28-1.63-1.05-2.64l.34-1.46-.61-.6-1.45.34c-1.02.23-2.07-.19-2.65-1.05l-.97-1.47h-.78zM12 8c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </div>
    </nav>
    </>
  );
}
