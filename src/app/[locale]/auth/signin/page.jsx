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
    const { setUser } = useUser();
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
            
            // Debug: Check initial state
            const debugResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/debug/auth`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            if (debugResponse.ok) {
                const debugData = await debugResponse.json();
                console.log('🔍 Initial debug info:', debugData);
            }

            // Get CSRF cookie first - with credentials included and proper domain handling
            console.log('🍪 Fetching CSRF cookie...');
            const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });

            console.log('🍪 CSRF Response status:', csrfResponse.status);
            console.log('🍪 CSRF Response headers:', Object.fromEntries(csrfResponse.headers.entries()));

            if (!csrfResponse.ok) {
                const errorText = await csrfResponse.text();
                console.error('❌ Failed to fetch CSRF cookie:', errorText);
                setError(t('auth.csrfError') + ' - ' + errorText);
                setIsLoading(false);
                return;
            }

            const csrfToken = Cookies.get('XSRF-TOKEN');
            console.log('🔑 CSRF Token:', csrfToken ? 'present' : 'missing');
            console.log('🍪 All cookies:', document.cookie);

            console.log('🚀 Attempting login...');
            const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            console.log('🔐 Login Response status:', loginResponse.status);
            console.log('🔐 Login Response headers:', Object.fromEntries(loginResponse.headers.entries()));

            const data = await loginResponse.json();
            console.log('🔐 Login Response data:', data);

            if (loginResponse.ok) {
                console.log('✅ Login successful, verifying user...');
                
                // After successful login, verify the user is authenticated
                const updatedCsrfToken = Cookies.get('XSRF-TOKEN');
                console.log('🔑 Updated CSRF Token:', updatedCsrfToken ? 'present' : 'missing');
                
                const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-XSRF-TOKEN': updatedCsrfToken ? decodeURIComponent(updatedCsrfToken) : '',
                    }
                });

                console.log('👤 User Response status:', userResponse.status);
                console.log('👤 User Response headers:', Object.fromEntries(userResponse.headers.entries()));

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    console.log('👤 User data:', userData);
                    setUser(userData);
                    localStorage.setItem('auth_user', JSON.stringify(userData));

                    console.log('🎉 Login complete, redirecting...');
                    setTimeout(() => {
                        router.refresh();
                        router.push(`/${locale}/dashboard`);
                    }, 50);

                } else {
                    const userErrorData = await userResponse.json();
                    console.error('❌ User verification failed:', userErrorData);
                    setError(t('auth.authVerificationError') + ' - ' + JSON.stringify(userErrorData));
                }
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
        <section className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">{t('auth.signinTitle')}</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                {success && <p className="text-green-500 text-center mb-4">{success}</p>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <input
                        type="email"
                        name="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder={t('auth.passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400"
                        disabled={isLoading}
                    >
                        {isLoading ? t('auth.signingIn') : t('auth.signin')}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    {t('auth.noAccount')}{' '}
                    <Link href={`/${locale}/auth/register`} className="text-green-600 hover:underline">
                        {t('auth.registerHere')}
                    </Link>
                </p>
            </div>
        </section>
    );
}

export default function SignIn() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignInContent />
        </Suspense>
    );
}