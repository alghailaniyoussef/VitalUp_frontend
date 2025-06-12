'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '@/context/I18nContext';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutPage() {
  const { t, locale } = useI18n();
  const { user } = useUser();

  const features = [
    {
      icon: '🧠',
      title: t('about.features.quizzes.title'),
      description: t('about.features.quizzes.description')
    },
    {
      icon: '💪',
      title: t('about.features.challenges.title'),
      description: t('about.features.challenges.description')
    },
    {
      icon: '🏆',
      title: t('about.features.badges.title'),
      description: t('about.features.badges.description')
    },
    {
      icon: '📊',
      title: t('about.features.progress.title'),
      description: t('about.features.progress.description')
    }
  ];

  const steps = [
    {
      number: '01',
      title: t('about.howToPlay.step1.title'),
      description: t('about.howToPlay.step1.description'),
      icon: '📝'
    },
    {
      number: '02',
      title: t('about.howToPlay.step2.title'),
      description: t('about.howToPlay.step2.description'),
      icon: '🎯'
    },
    {
      number: '03',
      title: t('about.howToPlay.step3.title'),
      description: t('about.howToPlay.step3.description'),
      icon: '🌟'
    },
    {
      number: '04',
      title: t('about.howToPlay.step4.title'),
      description: t('about.howToPlay.step4.description'),
      icon: '🚀'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-green-50">
      {/* Hero Section */}
      <section
        className="relative py-20 px-6 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/hero-background2.png)' }}
      >
        {/* Overlay */}
        <div className="absolute inset-0  bg-opacity-70 backdrop-blur-sm z-0"></div>

        {/* Content container */}
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center mb-6">
              <Image
                src="/logo.png"
                alt={t('alt.logo')}
                width={120}
                height={56}
                className="h-auto w-auto"
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-400 via-teal-500 to-green-400 bg-clip-text text-transparent mb-6 drop-shadow-lg">
              {t('about.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed drop-shadow">
              {t('about.hero.subtitle')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            {!user ? (
              <>
                <Link
                  href={`/${locale}/auth/register`}
                  className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t('about.hero.joinNow')}
                </Link>
                <Link
                  href={`/${locale}/auth/signin`}
                  className="bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold border-2 border-teal-600 hover:bg-teal-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t('about.hero.signIn')}
                </Link>
              </>
            ) : (
              <Link
                href={`/${locale}/dashboard`}
                className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t('about.hero.goToDashboard')}
              </Link>
            )}
          </motion.div>
        </div>
      </section>


      {/* About Us Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('about.whoWeAre.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              {t('about.whoWeAre.description')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-teal-200 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-teal-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              {t('about.howToPlay.title')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('about.howToPlay.subtitle')}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-teal-200 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                        {step.icon}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-teal-600 via-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {t('about.cta.title')}
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              {t('about.cta.subtitle')}
            </p>

            {!user ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/${locale}/auth/register`}
                  className="bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t('about.cta.startJourney')}
                </Link>
                <Link
                  href={`/${locale}/auth/signin`}
                  className="bg-transparent text-white px-8 py-4 rounded-xl font-semibold border-2 border-white hover:bg-white hover:text-teal-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {t('about.cta.alreadyMember')}
                </Link>
              </div>
            ) : (
              <Link
                href={`/${locale}/dashboard`}
                className="inline-block bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {t('about.cta.continuePlaying')}
              </Link>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}