import { ReactNode } from 'react';

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export default function LocaleLayout({ children }: LocaleLayoutProps) {
  return (
    <>
      {children}
    </>
  );
}

// Generate static params for supported locales
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'ar' }
  ];
}