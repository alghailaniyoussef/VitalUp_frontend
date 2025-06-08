'use client';

import Image from "next/image";
import Link from "next/link";
import { useI18n } from '@/context/I18nContext';

export default function Home() {
  const { t, locale } = useI18n();

  return (
    <section className="flex flex-col-reverse md:flex-row items-center justify-between px-6 md:px-20 py-20">
      <div className="max-w-xl space-y-6">
        <h2 className="text-3xl md:text-4xl font-extrabold text-teal-400 leading-tight">
          {t('home.hero.title')}
        </h2>
        <p className="text-lg text-teal-700">
          {t('home.hero.description')}
        </p>
        <div className="flex flex-wrap gap-4">
          <Link 
            href={`/${locale}/auth/register`} 
            className="bg-teal-500 text-white px-6 py-3 rounded-full shadow-md hover:bg-teal-800 transition"
          >
            {t('home.hero.cta.primary')}
          </Link>
          <Link 
            href={`/${locale}/features`} 
            className="text-teal-700 underline underline-offset-4 hover:text-teal-900 transition"
          >
            {t('home.hero.cta.secondary')}
          </Link>
        </div>
      </div>
      <div className="mb-12 md:mb-0 md:ml-12">
        <Image
          src="/hero.png"
          alt={t('home.hero.imageAlt')}
          width={500}
          height={400}
          className="rounded-xl shadow-2xl border-5 border-teal-200"
        />
      </div>
    </section>
  );
}