'use client';
import Image from "next/image";
import Link from "next/link";
import { useI18n } from '@/context/I18nContext';

export default function Features() {
    const { t } = useI18n();
    
    return (
        <section className="px-8 py-20 bg-white">
            <h3 className="text-3xl font-semibold text-center text-green-800 mb-12">{t('features.title')}</h3>
            <div className="grid md:grid-cols-3 gap-10">
                <div className="text-center">
                    <Image src="/reminder.png" alt={t('features.smartReminders.title')} width={100} height={100} className="mx-auto mb-4" />
                    <h4 className="text-xl font-bold">{t('features.smartReminders.title')}</h4>
                    <p className="text-gray-600">{t('features.smartReminders.description')}</p>
                </div>
                <div className="text-center">
                    <Image src="/progress.png" alt={t('features.progressTracking.title')} width={100} height={100} className="mx-auto mb-4" />
                    <h4 className="text-xl font-bold">{t('features.progressTracking.title')}</h4>
                    <p className="text-gray-600">{t('features.progressTracking.description')}</p>
                </div>
                <div className="text-center">
                    <Image src="/community.png" alt={t('features.communityChallenges.title')} width={100} height={100} className="mx-auto mb-4" />
                    <h4 className="text-xl font-bold">{t('features.communityChallenges.title')}</h4>
                    <p className="text-gray-600">{t('features.communityChallenges.description')}</p>
                </div>
            </div>
        </section>
    );
}
