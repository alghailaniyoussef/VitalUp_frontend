'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';

export default function RegisterPage() {
    console.log('RegisterPage rendered');
    const router = useRouter();
    const { setUser } = useUser();
    const { t, locale } = useI18n();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(form),
            });

            if (res.ok) {
                const data = await res.json();
                
                if (data.email_verification_required) {
                    // Redirect to login page with success message
                    router.push(`/${locale}/auth/signin?message=registration_success`);
                } else {
                    // Fallback for existing users without verification
                    if (data.user) {
                        const userData = {
                            ...data.user,
                            is_admin: Boolean(data.user.is_admin),
                            level: data.user.level || 1,
                            points: data.user.points || 0
                        };
                        localStorage.setItem('auth_user', JSON.stringify(userData));
                        setUser(userData);
                    }
                    
                    // After successful registration, fetch user data to ensure we have the latest
                    try {
                        const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${data.token}`,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (userRes.ok) {
                            const userData = await userRes.json();
                            setUser(userData);
                            localStorage.setItem('auth_user', JSON.stringify(userData));
                        }
                    } catch (userErr) {
                        console.error('Error fetching user after registration:', userErr);
                    }
                    
                    // Add a small delay to ensure data is stored before redirect
                        setTimeout(() => {
                            router.refresh(); // Force refresh to update context
                            router.push(`/${locale}/auth/signin`);
                        }, 100);
                }
            } else {
                const data = await res.json();
                setError(data.message || t('auth.registerError'));
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(t('auth.connectionError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
                <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">{t('auth.registerTitle')}</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleRegister} className="space-y-4">
                    <input name="name" value={form.name} onChange={handleChange} type="text" placeholder={t('auth.namePlaceholder')} required className="w-full px-4 py-2 border rounded-lg" />
                    <input name="email" value={form.email} onChange={handleChange} type="email" placeholder={t('auth.emailPlaceholder')} required className="w-full px-4 py-2 border rounded-lg" />
                    <input name="password" value={form.password} onChange={handleChange} type="password" placeholder={t('auth.passwordPlaceholder')} required className="w-full px-4 py-2 border rounded-lg" />
                    <input name="password_confirmation" value={form.password_confirmation} onChange={handleChange} type="password" placeholder={t('auth.confirmPasswordPlaceholder')} required className="w-full px-4 py-2 border rounded-lg" />
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full bg-green-600 text-white py-2 rounded-lg ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-green-700'}`}
                    >
                        {isLoading ? t('auth.processing') : t('auth.register')}
                    </button>
                </form>
                <p className="mt-4 text-center text-sm">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link href={`/${locale}/auth/signin`} className="text-green-600 hover:underline">
                        {t('auth.signinHere')}
                    </Link>
                </p>
            </div>
        </section>
    );
}
