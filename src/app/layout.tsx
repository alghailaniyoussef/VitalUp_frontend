'use client';

import './globals.css';
import EnhancedNavigation from '@/components/EnhancedNavigation';
import { UserProvider } from '@/context/UserContext';
import { I18nProvider } from '@/context/I18nContext';
import Footer from '@/components/Footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col text-gray-900 font-sans">
        <I18nProvider>
          <UserProvider>
            <EnhancedNavigation />
            <main className="flex-1 bg-gradient-to-br from-teal-05 via-teal-150 to-teal-100" >
              {children}
            </main>
            <Footer />
          </UserProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
