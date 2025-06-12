'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';

function SignInContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { setUser, refreshUser } = useUser();
    const { t, locale } = useI18n();
    
    useEffect(() => {
        const verification = searchParams.get('verification');
        const message = searchParams.get('message');
        
        if (verification === 'success') {
            setSuccess(t('auth.emailVerifiedSuccess'));
        } else if (verification === 'invalid') {
            setError(t('auth.verificationInvalid'));
        } else if (verification === 'already-verified') {
            setSuccess(t('auth.emailAlreadyVerified'));
        } else if (message === 'registration_success') {
            setSuccess(t('auth.registrationSuccess'));
        }
    }, [searchParams, t]);
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            console.log('🔍 Starting login process...');
            console.log('🌐 API URL:', process.env.NEXT_PUBLIC_API_URL);
            


            console.log('🚀 Attempting token-based login...');
            const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            console.log('🔐 Login Response status:', loginResponse.status);
            console.log('🔐 Login Response headers:', Object.fromEntries(loginResponse.headers.entries()));

            const data = await loginResponse.json();
            console.log('🔐 Login Response data:', data);

            if (loginResponse.ok) {
                console.log('✅ Login successful!');
                console.log('🎫 Token received:', data.token ? 'present' : 'missing');
                
                // Store user data and token in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                
                // Also store token in cookies for middleware access
                Cookies.set('auth_token', data.token, { expires: 7, secure: true, sameSite: 'strict' });
                
                // Update UserContext with the logged-in user
                setUser(data.user);
                
                // Refresh user data to ensure admin status is properly loaded
                await refreshUser();
                
                // Set flag to show welcome modal on dashboard
                localStorage.setItem('showWelcomeModal', 'true');
                
                // Send welcome email for new users or returning users
                try {
                    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/send-welcome-email`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${data.token}`,
                        },
                        body: JSON.stringify({ user_id: data.user.id, email: data.user.email }),
                    });
                } catch (emailError) {
                    console.log('Welcome email sending failed:', emailError);
                    // Don't block login if email fails
                }
                
                // Redirect to dashboard
                router.push(`/${locale}/dashboard`);
            } else {
                console.error('❌ Login failed:', data);
                if (data.email_verification_required) {
                    setError(t('auth.emailVerificationRequired'));
                } else {
                    setError(data.message || t('auth.loginError') + ' - ' + JSON.stringify(data));
                }
            }
        } catch (err) {
            console.error('💥 Login error:', err);
            setError(t('auth.connectionError') + ' - ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-gradient-to-br from-white to-teal-50 shadow-xl rounded-2xl p-8 border border-teal-200">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent mb-6 text-center">{t('auth.signinTitle')}</h2>
                {error && <p className="text-red-500 bg-red-50 border border-red-200 rounded-lg p-3 text-center mb-4">{error}</p>}
                {success && <p className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 text-center mb-4">{success}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        name="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-teal-200 rounded-lg bg-gradient-to-r from-white to-teal-50 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder={t('auth.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-teal-200 rounded-lg bg-gradient-to-r from-white to-teal-50 focus:border-teal-400 focus:ring-2 focus:ring-teal-200 transition-all"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-teal-600 to-green-600 text-white py-3 rounded-lg hover:from-teal-700 hover:to-green-700 disabled:from-teal-400 disabled:to-green-400 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? t('auth.signingIn') : t('auth.signin')}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    {t('auth.noAccount')}{' '}
                    <Link href={`/${locale}/auth/register`} className="bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent font-semibold hover:from-teal-700 hover:to-green-700">
                        {t('auth.registerHere')}
                    </Link>
                </p>
            </div>
        </section>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<div>{/* Loading will be handled by I18n context */}</div>}>
            <SignInContent />
        </Suspense>
    );
}