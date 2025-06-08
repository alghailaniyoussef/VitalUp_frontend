'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';

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
  const { t, locale } = useI18n();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': locale,
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
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
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
      
      // Prepare data for submission, including interests
      const dataToSubmit = {
        notification_preferences: preferences.notification_preferences,
        privacy_settings: preferences.privacy_settings,
        data_processing_consents: preferences.data_processing_consents,
        interests: preferences.interests || []
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/preferences`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': locale,
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
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
    return <div className="p-4">{t('common.loading')}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 bg-gradient-to-b from-green-50 to-blue-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-teal-800">{t('settings.title')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Notification Preferences Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100 hover:border-teal-200 transition-all duration-300">
          <h2 className="text-xl font-semibold mb-6 text-teal-700 border-b border-teal-100 pb-2">{t('settings.sections.notifications')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.notifications.quizReminders')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.quiz_reminders}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'quiz_reminders', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.notifications.challengeUpdates')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.challenge_updates}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'challenge_updates', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.notifications.achievementAlerts')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.achievement_alerts}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'achievement_alerts', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.notifications.weeklySummaries')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.weekly_summaries}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'weekly_summaries', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.notifications.marketingEmails')}</label>
              <input
                type="checkbox"
                checked={preferences.notification_preferences.marketing_emails}
                onChange={(e) => handlePreferenceChange('notification_preferences', 'marketing_emails', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="space-y-2">
                <label className="block text-gray-700">{t('settings.notifications.channel')}</label>
                <select
                  value={preferences.notification_preferences.channel}
                  onChange={(e) => handlePreferenceChange('notification_preferences', 'channel', e.target.value)}
                  className="select select-bordered w-full bg-white/70 border-teal-200 focus:border-teal-400 text-teal-700"
                >
                  <option value="email">{t('settings.notifications.channels.email')}</option>
                  <option value="push">{t('settings.notifications.channels.push')}</option>
                  <option value="sms">{t('settings.notifications.channels.sms')}</option>
                  <option value="all">{t('settings.notifications.channels.all')}</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-700">{t('settings.notifications.emailFrequency')}</label>
                <select
                  value={preferences.notification_preferences.email_frequency}
                  onChange={(e) => handlePreferenceChange('notification_preferences', 'email_frequency', e.target.value)}
                  className="select select-bordered w-full bg-white/70 border-teal-200 focus:border-teal-400 text-teal-700"
                >
                  <option value="daily">{t('settings.notifications.frequency.daily')}</option>
                  <option value="three_days">{t('settings.notifications.frequency.threeDays')}</option>
                  <option value="weekly">{t('settings.notifications.frequency.weekly')}</option>
                </select>
              </div>
          </div>
        </section>

        {/* Privacy Settings Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100 hover:border-teal-200 transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4">{t('settings.sections.privacy')}</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-gray-700">{t('settings.privacy.profileVisibility')}</label>
              <select
                value={preferences.privacy_settings.profile_visibility}
                onChange={(e) => handlePreferenceChange('privacy_settings', 'profile_visibility', e.target.value)}
                className="select select-bordered w-full bg-white/70 border-teal-200 focus:border-teal-400 text-teal-700"
              >
                <option value="public">{t('settings.privacy.visibility.public')}</option>
                <option value="friends">{t('settings.privacy.visibility.friends')}</option>
                <option value="private">{t('settings.privacy.visibility.private')}</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.privacy.shareAchievements')}</label>
              <input
                type="checkbox"
                checked={preferences.privacy_settings.share_achievements}
                onChange={(e) => handlePreferenceChange('privacy_settings', 'share_achievements', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.privacy.shareProgress')}</label>
              <input
                type="checkbox"
                checked={preferences.privacy_settings.share_progress}
                onChange={(e) => handlePreferenceChange('privacy_settings', 'share_progress', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>
          </div>
        </section>

        {/* Data Processing Consents Section */}
        <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100 hover:border-teal-200 transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4">{t('settings.sections.dataProcessing')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.dataProcessing.analytics')}</label>
              <input
                type="checkbox"
                checked={preferences.data_processing_consents.analytics}
                onChange={(e) => handlePreferenceChange('data_processing_consents', 'analytics', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.dataProcessing.personalization')}</label>
              <input
                type="checkbox"
                checked={preferences.data_processing_consents.personalization}
                onChange={(e) => handlePreferenceChange('data_processing_consents', 'personalization', e.target.checked)}
                className="toggle toggle-success bg-teal-100"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-teal-600 font-medium">{t('settings.dataProcessing.thirdPartySharing')}</label>
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
        <section className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-teal-100 hover:border-teal-200 transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4">{t('settings.sections.interests')}</h2>
          <p className="text-gray-600 mb-4">{t('settings.interests.description')}</p>
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
                <label htmlFor={`interest-${category}`} className="text-teal-600 capitalize">
                  {preferences.available_interest_categories_translated?.[category] || category}
                </label>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end space-x-4">
          {saveStatus === 'success' && (
            <span className="text-teal-600 font-medium">{t('settings.messages.saveSuccess')}</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 font-medium">{t('settings.messages.saveError')}</span>
          )}
          <button
            type="submit"
            disabled={isSaving}
            className={`btn bg-teal-600 hover:bg-teal-700 text-white border-none ${isSaving ? 'loading' : ''}`}>
            {isSaving ? t('settings.buttons.saving') : t('settings.buttons.save')}
          </button>
        </div>
      </form>
    </div>
  );
}