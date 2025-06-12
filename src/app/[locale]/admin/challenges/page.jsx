'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import { toast } from 'react-toastify';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminChallenges() {
    const { user, isLoading } = useUser();
    const { t, locale } = useI18n();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // Remove separate locale state, use context locale directly
    const [showModal, setShowModal] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        points_reward: 10,
        difficulty: 'beginner',
        category: 'physical',
        duration_days: 7,
        goals: [],
        badge_rewards: [],
        is_active: true,
        start_date: '',
        end_date: ''
    });
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user && !user.is_admin) {
            router.push('/dashboard');
            return;
        }

        if (!isLoading && !user) {
            router.push('/auth/signin');
            return;
        }

        if (user && user.is_admin) {
            fetchChallenges(currentPage, locale);
        }
    }, [user, isLoading, router, currentPage, locale]);

    const handleLocaleChange = (newLocale) => {
        // Navigate to the new locale route
        router.push(`/${newLocale}/admin/challenges`);
    };

    const fetchChallenges = async (page = 1, localeParam = locale) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            if (!token) {
                console.error('No token found');
                setLoading(false);
                return;
            }
            
            // Fetch challenges filtered by current locale for proper pagination
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/challenges?page=${page}&locale=${localeParam}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Error details:', errorData);
                setChallenges([]);
                setTotalPages(1);
                return;
            }
            
            const data = await res.json();
            if (Array.isArray(data)) {
                setChallenges(data);
                setTotalPages(1);
            } else if (data.data) {
                setChallenges(data.data);
                setTotalPages(Math.ceil(data.total / data.per_page));
            } else {
                setChallenges([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error loading challenges:', err);
            setChallenges([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (challenge) => {
        // Handle goals and badge_rewards as arrays
        const goals = Array.isArray(challenge.goals) ? challenge.goals : [];
        const badgeRewards = Array.isArray(challenge.badge_rewards) ? challenge.badge_rewards : [];
        
        // Format dates for datetime-local inputs
        const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
        };
            
        setFormData({
            ...challenge,
            goals: goals,
            badge_rewards: badgeRewards,
            start_date: formatDateForInput(challenge.start_date),
            end_date: formatDateForInput(challenge.end_date)
        });
        setEditingChallenge(true);
        setShowModal(true);
    };

    const handleNew = () => {
        setFormData({
            title: '',
            description: '',
            points_reward: 10,
            difficulty: 'beginner',
            category: 'physical',
            duration_days: 7,
            goals: [''],
            badge_rewards: [0],
            start_date: '',
            end_date: '',
            is_active: true
        });
        setEditingChallenge(false);
        setShowModal(true);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : 
                    type === 'number' ? parseInt(value, 10) : value
        }));
    };
    


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Filter out empty goals and zero badge rewards
            const filteredGoals = formData.goals.filter(goal => goal.trim() !== '');
            const filteredBadgeRewards = formData.badge_rewards.filter(badgeId => badgeId > 0);
            
            const submitData = {
                ...formData,
                points_reward: parseInt(formData.points_reward, 10),
                duration_days: parseInt(formData.duration_days, 10),
                goals: filteredGoals,
                badge_rewards: filteredBadgeRewards
            };

            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push('/auth/signin');
                return;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/challenges${editingChallenge ? `/${formData.id}` : ''}`, {
                method: editingChallenge ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(submitData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save challenge');
            }

            await fetchChallenges();
            setShowModal(false);
            toast.success(editingChallenge ? t('admin.challenges.updateSuccess') : t('admin.challenges.createSuccess'));
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || t('admin.challenges.error'));
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('admin.challenges.confirmDelete'))) return;
        
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push('/auth/signin');
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/challenges/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!res.ok) throw new Error('Failed to delete challenge');
            
            await fetchChallenges(currentPage);
            toast.success(t('admin.challenges.deleteSuccess'));
        } catch (err) {
            console.error('Error deleting challenge:', err);
            toast.error(t('admin.challenges.deleteError'));
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-admin-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-admin-accent border-t-transparent mx-auto mb-4"></div>
                    <p className="text-admin-text text-lg">{t('admin.challenges.loading')}</p>
                </div>
            </div>
        );
    }

    if (!user || !user.is_admin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-admin-bg">
            {/* Header */}
            <div className="bg-admin-card/80 backdrop-blur-sm border-b border-admin-border sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleLocaleChange('en')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        locale === 'en'
                                            ? 'bg-admin-accent text-white'
                                            : 'bg-admin-border text-admin-text hover:bg-admin-border/70'
                                    }`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => handleLocaleChange('es')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        locale === 'es'
                                            ? 'bg-admin-accent text-white'
                                            : 'bg-admin-border text-admin-text hover:bg-admin-border/70'
                                    }`}
                                >
                                    ES
                                </button>
                            </div>
                        </div>
                        <div className="text-center flex-1">
                            <h1 className="text-4xl font-bold text-admin-text mb-2">{t('admin.challenges.title')}</h1>
                            <p className="text-admin-text/70 text-lg">{t('admin.challenges.subtitle')}</p>
                        </div>
                        <button
                            onClick={handleNew}
                            className="bg-admin-accent text-white px-6 py-3 rounded-xl hover:bg-admin-accent/90 transition-colors font-semibold shadow-glow"
                        >
                            {t('admin.challenges.createButton')}
                        </button>
                    </div>
                </div>
            </div>
            
            <AdminNavigation currentPage="challenges" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
                    </div>
                ) : challenges.filter(challenge => challenge.locale === locale).length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-admin-text/60 text-lg">{t('common.noChallengesFound', { locale: locale.toUpperCase() })}</p>
                    </div>
                ) : (
                    /* Challenges Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map((challenge) => (
                        <div key={challenge.id} className="bg-admin-card rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 overflow-hidden border border-admin-border">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-admin-text mb-2">{challenge.title}</h3>
                                        <p className="text-admin-text/70 text-sm line-clamp-2">{challenge.description}</p>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(challenge)}
                                            className="p-2 text-admin-accent hover:bg-admin-accent/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(challenge.id)}
                                            className="p-2 text-admin-error hover:bg-admin-error/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            challenge.category === 'physical' ? 'bg-admin-error/20 text-admin-error' :
                                            challenge.category === 'mental' ? 'bg-admin-accent/20 text-admin-accent' :
                                            challenge.category === 'social' ? 'bg-admin-success/20 text-admin-success' :
                                            'bg-admin-info/20 text-admin-info'
                                        }`}>
                                            {t(`admin.challenges.categories.${challenge.category}`)}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            challenge.difficulty === 'beginner' ? 'bg-admin-success/20 text-admin-success' :
                                            challenge.difficulty === 'intermediate' ? 'bg-admin-warning/20 text-admin-warning' :
                                            'bg-admin-error/20 text-admin-error'
                                        }`}>
                                            {t(`admin.challenges.difficulties.${challenge.difficulty}`)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm text-admin-text/70">
                                        <span>🏆 {challenge.points_reward} points</span>
                                        <span>📅 {challenge.duration_days} days</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            challenge.is_active ? 'bg-admin-success/20 text-admin-success' : 'bg-admin-border text-admin-text/60'
                                        }`}>
                                            {challenge.is_active ? t('admin.challenges.status.active') : t('admin.challenges.status.inactive')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                <div className="bg-admin-card px-4 py-3 flex items-center justify-between border-t border-admin-border sm:px-6 mt-8">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-admin-border text-sm font-medium rounded-md text-admin-text bg-admin-card hover:bg-admin-accent/10 disabled:opacity-50"
                        >
                            {t('admin.challenges.pagination.previous')}
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-admin-border text-sm font-medium rounded-md text-admin-text bg-admin-card hover:bg-admin-accent/10 disabled:opacity-50"
                        >
                            {t('admin.challenges.pagination.next')}
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-admin-text">
                                {t('admin.challenges.pagination.showing', { current: currentPage, total: totalPages })}
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-admin-border bg-admin-card text-sm font-medium text-admin-text hover:bg-admin-accent/10 disabled:opacity-50"
                                >
                                    <span className="sr-only">{t('admin.challenges.pagination.previous')}</span>
                                    &larr;
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`relative inline-flex items-center px-4 py-2 border ${currentPage === page ? 'bg-admin-accent/20 border-admin-accent text-admin-accent' : 'border-admin-border bg-admin-card text-admin-text hover:bg-admin-accent/10'} text-sm font-medium`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-admin-border bg-admin-card text-sm font-medium text-admin-text hover:bg-admin-accent/10 disabled:opacity-50"
                                >
                                    <span className="sr-only">{t('admin.challenges.pagination.next')}</span>
                                    &rarr;
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-admin-card backdrop-blur-sm rounded-2xl shadow-glow max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-admin-border">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-admin-text">
                                        {editingChallenge ? t('admin.challenges.modal.editTitle') : t('admin.challenges.modal.createTitle')}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-admin-text/60 hover:text-admin-text transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.challenges.modal.title')}</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.challenges.modal.description')}</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.challenges.modal.category')}</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            >
                                                <option value="physical">{t('admin.challenges.categories.physical')}</option>
                                                  <option value="mental">{t('admin.challenges.categories.mental')}</option>
                                                  <option value="social">{t('admin.challenges.categories.social')}</option>
                                                  <option value="environmental">{t('admin.challenges.categories.environmental')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-admin-text mb-2">{t('admin.challenges.modal.difficulty')}</label>
                                            <select
                                                name="difficulty"
                                                value={formData.difficulty}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            >
                                                <option value="beginner">{t('admin.challenges.difficulties.beginner')}</option>
                                                  <option value="intermediate">{t('admin.challenges.difficulties.intermediate')}</option>
                                                  <option value="advanced">{t('admin.challenges.difficulties.advanced')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-admin-text mb-2">{t('admin.challenges.modal.points')}</label>
                                            <input
                                                type="number"
                                                name="points_reward"
                                                value={formData.points_reward}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-admin-text mb-2">{t('admin.challenges.modal.duration')}</label>
                                            <input
                                                type="number"
                                                name="duration_days"
                                                value={formData.duration_days}
                                                onChange={handleChange}
                                                min="1"
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-admin-text mb-2">{t('admin.challenges.modal.locale')}</label>
                                            <select
                                                name="locale"
                                                value={formData.locale || locale}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            >
                                                <option value="en">{t('admin.challenges.modal.locales.en')}</option>
                                                <option value="es">{t('admin.challenges.modal.locales.es')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-admin-text mb-2">{t('admin.challenges.modal.startDate')}</label>
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    name="start_date"
                                                    value={formData.start_date || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                    placeholder={t('placeholder.selectStartDateTime')}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-5 h-5 text-admin-text/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-admin-text mb-2">{t('admin.challenges.modal.endDate')}</label>
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    name="end_date"
                                                    value={formData.end_date || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                    placeholder={t('admin.challenges.modal.endDatePlaceholder')}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-5 h-5 text-admin-text/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.challenges.modal.goals')}</label>
                                            <div className="space-y-2">
                                                {formData.goals.map((goal, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={goal}
                                                            onChange={(e) => {
                                                                const newGoals = [...formData.goals];
                                                                newGoals[index] = e.target.value;
                                                                setFormData(prev => ({ ...prev, goals: newGoals }));
                                                            }}
                                                            placeholder={t('admin.challenges.modal.goalPlaceholder')}
                                                            className="flex-1 px-4 py-2 border border-admin-border rounded-lg focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent bg-admin-card text-admin-text"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newGoals = formData.goals.filter((_, i) => i !== index);
                                                                setFormData(prev => ({ ...prev, goals: newGoals }));
                                                            }}
                                                            className="px-3 py-2 bg-admin-error text-white rounded-lg hover:bg-admin-error/90"
                                                        >
                                                            {t('admin.challenges.modal.remove')}
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, goals: [...prev.goals, ''] }));
                                                    }}
                                                    className="w-full px-4 py-2 border-2 border-dashed border-admin-border rounded-lg text-admin-text/60 hover:border-admin-accent hover:text-admin-accent"
                                                >
                                                    {t('admin.challenges.modal.addGoal')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.challenges.modal.badgeRewards')}</label>
                                            <div className="space-y-2">
                                                {formData.badge_rewards.map((badgeId, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="number"
                                                            value={badgeId}
                                                            onChange={(e) => {
                                                                const newBadges = [...formData.badge_rewards];
                                                                newBadges[index] = parseInt(e.target.value) || 0;
                                                                setFormData(prev => ({ ...prev, badge_rewards: newBadges }));
                                                            }}
                                                            placeholder={t('admin.challenges.modal.badgeIdPlaceholder')}
                                                            min="1"
                                                            className="flex-1 px-4 py-2 border border-admin-border rounded-lg focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent bg-admin-card text-admin-text"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newBadges = formData.badge_rewards.filter((_, i) => i !== index);
                                                                setFormData(prev => ({ ...prev, badge_rewards: newBadges }));
                                                            }}
                                                            className="px-3 py-2 bg-admin-error text-white rounded-lg hover:bg-admin-error/90"
                                                        >
                                                            {t('admin.challenges.modal.remove')}
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, badge_rewards: [...prev.badge_rewards, 0] }));
                                                    }}
                                                    className="w-full px-4 py-2 border-2 border-dashed border-admin-border rounded-lg text-admin-text/60 hover:border-admin-accent hover:text-admin-accent"
                                                >
                                                    {t('admin.challenges.modal.addBadgeReward')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="flex items-center space-x-3">
                                                <input
                                                    type="checkbox"
                                                    name="is_active"
                                                    checked={formData.is_active}
                                                    onChange={handleChange}
                                                    className="w-5 h-5 text-admin-accent border-admin-border rounded focus:ring-admin-accent/20"
                                                />
                                                <span className="text-sm font-semibold text-admin-text">{t('admin.challenges.modal.activeChallenge')}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 pt-6 border-t border-admin-border">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 border border-admin-border text-admin-text rounded-xl hover:bg-admin-border/20 font-semibold transition-colors"
                                        >
                                            {t('admin.challenges.modal.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-gradient-to-r from-admin-accent to-admin-info hover:from-admin-accent/90 hover:to-admin-info/90 text-white rounded-xl font-semibold shadow-glow transform hover:scale-105 transition-all duration-200"
                                        >
                                            {editingChallenge ? t('admin.challenges.modal.updateButton') : t('admin.challenges.modal.createButton')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}