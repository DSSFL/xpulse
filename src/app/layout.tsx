import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { TrackedUserProvider } from '@/contexts/TrackedUserContext';

export const metadata: Metadata = {
  title: 'XPulse - Real-time Narrative Intelligence',
  description: 'The vital signs of what\'s happening on X',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-x-black text-x-white antialiased">
        <TrackedUserProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 md:ml-[68px] xl:ml-[275px] pb-20 md:pb-0">
              {children}
            </main>
          </div>
        </TrackedUserProvider>
      </body>
    </html>
  );
}
