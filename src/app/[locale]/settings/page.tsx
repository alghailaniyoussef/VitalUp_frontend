'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import { useRouter } from 'next/navigation';

interface UserPreferences {
  notification_preferences: {
    quiz_reminders: boolean;
    challenge_updates: boolean;
    achievement_alerts: boolean;
    weekly_summaries: boolean;
    marketing_emails: boolean;
    email_frequency: 'daily' | 'three_days' | 'weekly';
    channel: string;
  };
  privacy_settings: {
    profile_visibility: 'private' | 'public';
    share_achievements: boolean;
    share_progress: boolean;
  };
  data_processing_consents: {
    analytics: boolean;
    personalization: boolean;
    third_party_sharing: boolean;
  };
  interests?: string[];
  available_interest_categories?: string[];
  available_interest_categories_translated?: { [key: string]: string };
  available_interests_translated?: { [key: string]: string };
}

export default function SettingsPage() {
  const { user } = useUser();
  const { t, locale, setLocale } = useI18n();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            router.push(`/${locale}/auth/signin`);
            return;
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`, {
          method: 'GET',
          headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept-Language': locale
          },
        });
        if (response.ok) {
          const data = await response.json();
          setPreferences(data);
        }
      } catch (error) {
        console.error('Error fetching preferences:', error);
      }
    };

    if (user) {
      fetchPreferences();
    }
  }, [user, locale]); // Added locale as dependency to refresh when language changes

  const handlePreferenceChange = (category: keyof UserPreferences, key: string, value: boolean | string | string[]) => {
    if (!preferences) return;

    setPreferences(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: {
          ...prev[category],
          [key]: value
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences || !user) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push(`/${locale}/auth/signin`);
        setSaveStatus('error');
        return;
      }
      
      // Prepare data for submission, including interests
      const dataToSubmit = {
        notification_preferences: preferences.notification_preferences,
        privacy_settings: preferences.privacy_settings,
        data_processing_consents: preferences.data_processing_consents,
        interests: preferences.interests || []
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': locale,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !preferences) {
    return <div className="p-4 text-teal-700">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-personal-bg via-primary-50 to-personal-bg py-12">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-personal-accent via-personal-info to-personal-accent w-16 h-16 rounded-full flex items-center justify-center mr-4 shadow-soft">
              <span className="text-white text-2xl">⚙️</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-personal-text via-personal-accent to-personal-text bg-clip-text text-transparent">{t('settings.title')}</h1>
          </div>
          <p className="text-xl text-personal-text/80 bg-personal-card/50 backdrop-blur-sm px-8 py-4 rounded-2xl border border-personal-border/30 max-w-3xl mx-auto">{t('settings.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Preferences Section */}
        <section className="bg-gradient-to-br from-personal-card via-white to-personal-card backdrop-blur-sm rounded-2xl shadow-personal p-10 border border-personal-border/30 hover:border-personal-border/50 transition-all duration-300">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-br from-personal-accent via-personal-info to-personal-accent p-4 rounded-full mr-6 shadow-soft">
              <span className="text-white text-2xl">🔔</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-personal-text via-personal-accent to-personal-text bg-clip-text text-transparent">{t('settings.notifications.title')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.notifications.quizReminders')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.quiz_reminders}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'quiz_reminders', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.notifications.challengeUpdates')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.challenge_updates}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'challenge_updates', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.notifications.achievementAlerts')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.achievement_alerts}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'achievement_alerts', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.notifications.weeklySummaries')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.weekly_summaries}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'weekly_summaries', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.notifications.marketingEmails')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.marketing_emails}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'marketing_emails', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="space-y-2">
                <label className="block text-teal-600">{t('settings.notifications.channel')}</label>
                <select
                  value={preferences.notification_preferences.channel}
                  onChange={(e) => handlePreferenceChange('notification_preferences', 'channel', e.target.value)}
                  className="select select-bordered w-full bg-gradient-to-r from-white to-teal-50 border-teal-200 focus:border-teal-400 text-teal-700"
                >
                  <option value="email">{t('settings.notifications.channels.email')}</option>
                  <option value="push">{t('settings.notifications.channels.push')}</option>
                  <option value="sms">{t('settings.notifications.channels.sms')}</option>
                  <option value="all">{t('settings.notifications.channels.all')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-teal-600">{t('settings.notifications.emailFrequency')}</label>
                <select
                  value={preferences.notification_preferences.email_frequency}
                  onChange={(e) => handlePreferenceChange('notification_preferences', 'email_frequency', e.target.value)}
                  className="select select-bordered w-full bg-gradient-to-r from-white to-teal-50 border-teal-200 focus:border-teal-400 text-teal-700"
                >
                  <option value="daily">{t('settings.notifications.frequency.daily')}</option>
                  <option value="three_days">{t('settings.notifications.frequency.threeDays')}</option>
                  <option value="weekly">{t('settings.notifications.frequency.weekly')}</option>
                </select>
              </div>
          </div>
        </section>

        {/* Privacy Settings Section */}
        <section className="bg-gradient-to-br from-personal-card via-white to-personal-card backdrop-blur-sm rounded-2xl shadow-personal p-10 border border-personal-border/30 hover:border-personal-border/50 transition-all duration-300">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-br from-personal-info via-personal-accent to-personal-info p-4 rounded-full mr-6 shadow-soft">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-personal-text via-personal-info to-personal-text bg-clip-text text-transparent">{t('settings.privacy.title')}</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-green-600">{t('settings.privacy.profileVisibility')}</label>
              <select
                value={preferences.privacy_settings.profile_visibility}
                onChange={(e) => handlePreferenceChange('privacy_settings', 'profile_visibility', e.target.value)}
                className="select select-bordered w-full bg-gradient-to-r from-white to-green-50 border-green-200 focus:border-green-400 text-green-700"
              >
                <option value="public">{t('settings.privacy.visibility.public')}</option>
                <option value="friends">{t('settings.privacy.visibility.friends')}</option>
                <option value="private">{t('settings.privacy.visibility.private')}</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-green-700 font-medium">{t('settings.privacy.shareAchievements')}</label>
              <input
                type="checkbox"
                checked={preferences.privacy_settings.share_achievements}
                onChange={(e) => handlePreferenceChange('privacy_settings', 'share_achievements', e.target.checked)}
                className="toggle toggle-success bg-green-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-green-700 font-medium">{t('settings.privacy.shareProgress')}</label>
              <input
                type="checkbox"
                checked={preferences.privacy_settings.share_progress}
                onChange={(e) => handlePreferenceChange('privacy_settings', 'share_progress', e.target.checked)}
                className="toggle toggle-success bg-green-100"
              />
            </div>
          </div>
        </section>

        {/* Data Processing Consents Section */}
        <section className="bg-gradient-to-br from-personal-card via-white to-personal-card backdrop-blur-sm rounded-2xl shadow-personal p-10 border border-personal-border/30 hover:border-personal-border/50 transition-all duration-300">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-br from-personal-warning via-personal-accent to-personal-warning p-4 rounded-full mr-6 shadow-soft">
              <span className="text-white text-2xl">📊</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-personal-text via-personal-warning to-personal-text bg-clip-text text-transparent">{t('settings.sections.dataProcessing')}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.dataProcessing.analytics')}</label>
              <input
                type="checkbox"
                checked={preferences.data_processing_consents.analytics}
                onChange={(e) => handlePreferenceChange('data_processing_consents', 'analytics', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.dataProcessing.personalization')}</label>
              <input
                type="checkbox"
                checked={preferences.data_processing_consents.personalization}
                onChange={(e) => handlePreferenceChange('data_processing_consents', 'personalization', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-700 font-medium">{t('settings.dataProcessing.thirdPartySharing')}</label>
              <input
                type="checkbox"
                checked={preferences.data_processing_consents.third_party_sharing}
                onChange={(e) => handlePreferenceChange('data_processing_consents', 'third_party_sharing', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>
          </div>
        </section>

        {/* Interests Section */}
        <section className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-xl p-8 border border-green-200 hover:border-green-300 transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4 text-green-800">{t('settings.sections.interests')}</h2>
          <p className="text-green-600 mb-4">{t('settings.interests.description')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preferences.available_interest_categories?.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`interest-${category}`}
                  checked={preferences.interests?.includes(category) || false}
                  onChange={(e) => {
                    const currentInterests = preferences.interests || [];
                    const newInterests = e.target.checked
                      ? [...currentInterests, category]
                      : currentInterests.filter(i => i !== category);
                    
                    setPreferences(prev => {
                      if (!prev) return prev;
                      return {
                        ...prev,
                        interests: newInterests
                      };
                    });
                  }}
                  className="checkbox checkbox-success"
                />
                <label htmlFor={`interest-${category}`} className="text-green-700 capitalize">
                  {preferences.available_interest_categories_translated?.[category] || category}
                </label>
              </div>
            ))}
          </div>
        </section>

        {/* Language Preferences Section */}
        <section className="bg-gradient-to-br from-personal-card via-white to-personal-card backdrop-blur-sm rounded-2xl shadow-personal p-10 border border-personal-border/30 hover:border-personal-border/50 transition-all duration-300">
          <div className="flex items-center mb-8">
            <div className="bg-gradient-to-br from-personal-accent via-personal-info to-personal-accent p-4 rounded-full mr-6 shadow-soft">
              <span className="text-white text-2xl">🌐</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-personal-text via-personal-accent to-personal-text bg-clip-text text-transparent">{t('settings.language.title')}</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-teal-700 font-medium text-lg">{t('settings.language.preferredLanguage')}</label>
                <p className="text-teal-600 text-sm mt-1">{t('settings.language.description')}</p>
              </div>
              <div className="flex space-x-4">
                <button
                   type="button"
                   onClick={() => setLocale('en')}
                   className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 ${
                     locale === 'en'
                       ? 'border-personal-accent bg-personal-accent text-white shadow-glow'
                       : 'border-personal-border bg-white text-personal-text hover:border-personal-accent'
                   }`}
                 >
                   <svg className="w-5 h-4" viewBox="0 0 640 480" xmlns="http://www.w3.org/2000/svg">
                     <defs>
                       <clipPath id="us-settings">
                         <path d="M0 0h640v480H0z"/>
                       </clipPath>
                     </defs>
                     <g clipPath="url(#us-settings)">
                       <path d="M0 0h640v480H0z" fill="#fff"/>
                       <path d="M0 0h640v37h-640zM0 74h640v37h-640zM0 148h640v37h-640zM0 222h640v37h-640zM0 296h640v37h-640zM0 370h640v37h-640zM0 444h640v36h-640z" fill="#d22630"/>
                       <path d="M0 0h364v258H0z" fill="#46467f"/>
                     </g>
                   </svg>
                   <span className="font-medium">{t('common.english')}</span>
                 </button>
                 <button
                   type="button"
                   onClick={() => setLocale('es')}
                   className={`flex items-center space-x-2 px-4 py-2 rounded-xl border-2 transition-all duration-300 ${
                     locale === 'es'
                       ? 'border-personal-accent bg-personal-accent text-white shadow-glow'
                       : 'border-personal-border bg-white text-personal-text hover:border-personal-accent'
                   }`}
                 >
                   <svg className="w-5 h-4" viewBox="0 0 750 500" xmlns="http://www.w3.org/2000/svg">
                     <rect width="750" height="500" fill="#c60b1e"/>
                     <rect width="750" height="250" y="125" fill="#ffc400"/>
                   </svg>
                   <span className="font-medium">{t('common.spanish')}</span>
                 </button>
              </div>
            </div>
          </div>
        </section>

         {/* Save Button */}
         <div className="flex justify-center pt-12">
           <button
             type="submit"
             disabled={isSaving}
             className="bg-gradient-to-r from-personal-accent via-personal-info to-personal-accent hover:from-personal-accent/90 hover:to-personal-accent/90 text-white font-bold py-5 px-16 rounded-2xl shadow-personal hover:shadow-glow transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
           >
             {isSaving ? (
               <div className="flex items-center">
                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                 {t('settings.buttons.saving')}
               </div>
             ) : (
               <div className="flex items-center">
                 <span className="mr-2">💾</span>
                 {t('settings.buttons.save')}
               </div>
             )}
           </button>
         </div>
         
         {/* Status Messages */}
         <div className="flex justify-center pt-4">
           {saveStatus === 'success' && (
             <span className="text-green-600 font-medium">{t('settings.messages.saveSuccess')}</span>
           )}
           {saveStatus === 'error' && (
             <span className="text-red-600 font-medium">{t('settings.messages.saveError')}</span>
           )}
         </div>
        </form>
      </div>
    </div>
  );
}