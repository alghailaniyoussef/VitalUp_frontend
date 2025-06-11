'use client';
import Image from "next/image";
import Link from "next/link";
import { useI18n } from '@/context/I18nContext';

export default function Features() {
    const { t } = useI18n();
    
    return (
        <section className="px-8 py-20 bg-gradient-to-br from-teal-50 via-white to-green-50">
            <h3 className="text-3xl font-semibold text-center bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent mb-12">{t('features.title')}</h3>
            <div className="grid md:grid-cols-3 gap-10">
                <div className="text-center bg-gradient-to-br from-white to-teal-50 p-8 rounded-2xl shadow-lg border border-teal-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Image src="/reminder.png" alt={t('features.smartReminders.title')} width={40} height={40} className="filter brightness-0 invert" />
                    </div>
                    <h4 className="text-xl font-bold text-teal-800 mb-3">{t('features.smartReminders.title')}</h4>
                    <p className="text-teal-600">{t('features.smartReminders.description')}</p>
                </div>
                <div className="text-center bg-gradient-to-br from-white to-green-50 p-8 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Image src="/progress.png" alt={t('features.progressTracking.title')} width={40} height={40} className="filter brightness-0 invert" />
                    </div>
                    <h4 className="text-xl font-bold text-green-800 mb-3">{t('features.progressTracking.title')}</h4>
                    <p className="text-green-600">{t('features.progressTracking.description')}</p>
                </div>
                <div className="text-center bg-gradient-to-br from-white to-teal-50 p-8 rounded-2xl shadow-lg border border-teal-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Image src="/community.png" alt={t('features.communityChallenges.title')} width={40} height={40} className="filter brightness-0 invert" />
                    </div>
                    <h4 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-green-700 bg-clip-text text-transparent mb-3">{t('features.communityChallenges.title')}</h4>
                    <p className="text-gray-600">{t('features.communityChallenges.description')}</p>
                </div>
            </div>
        </section>
    );
}
