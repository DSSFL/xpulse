'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    name: 'Vitals',
    href: '/',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.5 12h3l2-4 3 8 2-4h3.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Monitor',
    href: '/monitor',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: 'Analyze',
    href: '/analyze',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    badge: 3,
  },
  {
    name: 'History',
    href: '/history',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: 'Topics',
    href: '/topics',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
      </svg>
    ),
  },
];

const bottomNavItems = [
  {
    name: 'Settings',
    href: '/settings',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[68px] xl:w-[275px] border-r border-x-gray-border bg-x-black flex flex-col">
      {/* Logo */}
      <div className="p-4 xl:px-4 xl:py-6">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/xpulse-logo.png"
            alt="XPulse"
            className="h-8 xl:h-10 w-auto"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 xl:px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-3 py-3 rounded-full transition-colors ${
                    isActive
                      ? 'bg-x-gray-light text-x-white font-bold'
                      : 'text-x-white hover:bg-x-gray-dark'
                  }`}
                >
                  <span className="relative">
                    {item.icon}
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-vital-critical text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="hidden xl:block text-lg">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <div className="px-2 xl:px-3 pb-4">
        <ul className="space-y-1">
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-3 py-3 rounded-full transition-colors ${
                    isActive
                      ? 'bg-x-gray-light text-x-white font-bold'
                      : 'text-x-white hover:bg-x-gray-dark'
                  }`}
                >
                  {item.icon}
                  <span className="hidden xl:block text-lg">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* API Status */}
        <div className="mt-4 px-3 py-2 rounded-xl bg-x-gray-dark border border-x-gray-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-vital-healthy status-pulse" />
            <span className="hidden xl:block text-xs text-x-gray-text">API Connected</span>
          </div>
          <p className="hidden xl:block text-[10px] text-x-gray-text mt-1">
            47/60 requests remaining
          </p>
        </div>

        {/* User Profile - X Style */}
        <div className="mt-4 p-3 rounded-full hover:bg-x-gray-dark transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            {/* Profile Photo */}
            <div className="w-10 h-10 rounded-full bg-x-gray-light flex items-center justify-center overflow-hidden flex-shrink-0">
              <svg className="w-10 h-10 text-x-gray-text" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            {/* Name and Handle */}
            <div className="hidden xl:block flex-1 min-w-0">
              <p className="text-x-white font-bold text-sm truncate">XPulse Admin</p>
              <p className="text-x-gray-text text-sm truncate">@XPulseAdmin</p>
            </div>
            {/* Three dots menu */}
            <div className="hidden xl:block">
              <svg className="w-5 h-5 text-x-gray-text" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/>
                <circle cx="12" cy="12" r="2"/>
                <circle cx="19" cy="12" r="2"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
