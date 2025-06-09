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
            // Get CSRF cookie first - with credentials included and proper domain handling
            const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sanctum/csrf-cookie`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!csrfResponse.ok) {
                console.error('Failed to fetch CSRF cookie:', await csrfResponse.text());
                setError(t('auth.csrfError'));
                setIsLoading(false);
                return;
            }

            const csrfToken = Cookies.get('XSRF-TOKEN');

            const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : '', // 💥 aquí está la clave
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await loginResponse.json();

            if (loginResponse.ok) {
                // After successful login, verify the user is authenticated
                const updatedCsrfToken = Cookies.get('XSRF-TOKEN');
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

                if (userResponse.ok) {
                    const userData = await userResponse.json(); // 💥 aquí se define correctamente
                    setUser(userData); // ✅ ahora sí puedes acceder a userData.user
                    localStorage.setItem('auth_user', JSON.stringify(userData));

                    setTimeout(() => {
                        router.refresh(); // forzar relectura del layout y contextos
                        router.push(`/${locale}/dashboard`);
                    }, 50);

                }
                else {
                    setError(t('auth.authVerificationError'));
                }
            } else {
                if (data.email_verification_required) {
                    setError(t('auth.emailVerificationRequired'));
                } else {
                    setError(data.message || t('auth.loginError'));
                }
            }
        } catch (err) {
            console.error('Login error:', err);
            setError(t('auth.connectionError'));
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