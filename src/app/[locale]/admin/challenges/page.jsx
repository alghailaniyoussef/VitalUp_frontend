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
                    'Authorization': `Bearer ${token}`,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'include',
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

            const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/challenges${editingChallenge ? `/${formData.id}` : ''}`, {
                method: editingChallenge ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : ''
                },
                credentials: 'include',
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
            const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/challenges/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(csrfToken)
                },
                credentials: 'include',
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">{t('admin.challenges.loading')}</p>
                </div>
            </div>
        );
    }

    if (!user || !user.is_admin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleLocaleChange('en')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        locale === 'en'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    EN
                                </button>
                                <button
                                    onClick={() => handleLocaleChange('es')}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                        locale === 'es'
                                            ? 'bg-teal-600 text-white'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    ES
                                </button>
                            </div>
                        </div>
                        <div className="text-center flex-1">
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('admin.challenges.title')}</h1>
                            <p className="text-gray-600 text-lg">{t('admin.challenges.subtitle')}</p>
                        </div>
                        <button
                            onClick={handleNew}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg"
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                ) : challenges.filter(challenge => challenge.locale === locale).length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No challenges found for {locale.toUpperCase()} locale</p>
                    </div>
                ) : (
                    /* Challenges Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map((challenge) => (
                        <div key={challenge.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">{challenge.title}</h3>
                                        <p className="text-gray-600 text-sm line-clamp-2">{challenge.description}</p>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        <button
                                            onClick={() => handleEdit(challenge)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(challenge.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                                            challenge.category === 'physical' ? 'bg-red-100 text-red-800' :
                                            challenge.category === 'mental' ? 'bg-purple-100 text-purple-800' :
                                            challenge.category === 'social' ? 'bg-green-100 text-green-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {t(`admin.challenges.categories.${challenge.category}`)}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                            challenge.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                                            challenge.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {t(`admin.challenges.difficulties.${challenge.difficulty}`)}
                                        </span>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>🏆 {challenge.points_reward} points</span>
                                        <span>📅 {challenge.duration_days} days</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            challenge.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-8">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {t('admin.challenges.pagination.previous')}
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {t('admin.challenges.pagination.next')}
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                {t('admin.challenges.pagination.showing', { current: currentPage, total: totalPages })}
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">{t('admin.challenges.pagination.previous')}</span>
                                    &larr;
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`relative inline-flex items-center px-4 py-2 border ${currentPage === page ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
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
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {editingChallenge ? t('admin.challenges.modal.editTitle') : t('admin.challenges.modal.createTitle')}
                                    </h2>
                                    <button
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.challenges.modal.title')}</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.challenges.modal.description')}</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.challenges.modal.category')}</label>
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            >
                                                <option value="physical">{t('admin.challenges.categories.physical')}</option>
                                                  <option value="mental">{t('admin.challenges.categories.mental')}</option>
                                                  <option value="social">{t('admin.challenges.categories.social')}</option>
                                                  <option value="environmental">{t('admin.challenges.categories.environmental')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.challenges.modal.difficulty')}</label>
                                            <select
                                                name="difficulty"
                                                value={formData.difficulty}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            >
                                                <option value="beginner">{t('admin.challenges.difficulties.beginner')}</option>
                                                  <option value="intermediate">{t('admin.challenges.difficulties.intermediate')}</option>
                                                  <option value="advanced">{t('admin.challenges.difficulties.advanced')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.challenges.modal.points')}</label>
                                            <input
                                                type="number"
                                                name="points_reward"
                                                value={formData.points_reward}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.challenges.modal.duration')}</label>
                                            <input
                                                type="number"
                                                name="duration_days"
                                                value={formData.duration_days}
                                                onChange={handleChange}
                                                min="1"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.challenges.modal.locale')}</label>
                                            <select
                                                name="locale"
                                                value={formData.locale || locale}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                required
                                            >
                                                <option value="en">{t('admin.challenges.modal.locales.en')}</option>
                                                <option value="es">{t('admin.challenges.modal.locales.es')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.challenges.modal.startDate')}</label>
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    name="start_date"
                                                    value={formData.start_date || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                                    placeholder={t('placeholder.selectStartDateTime')}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.challenges.modal.endDate')}</label>
                                            <div className="relative">
                                                <input
                                                    type="datetime-local"
                                                    name="end_date"
                                                    value={formData.end_date || ''}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
                                                    placeholder={t('admin.challenges.modal.endDatePlaceholder')}
                                                />
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.challenges.modal.goals')}</label>
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
                                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newGoals = formData.goals.filter((_, i) => i !== index);
                                                                setFormData(prev => ({ ...prev, goals: newGoals }));
                                                            }}
                                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
                                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500"
                                                >
                                                    {t('admin.challenges.modal.addGoal')}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.challenges.modal.badgeRewards')}</label>
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
                                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newBadges = formData.badge_rewards.filter((_, i) => i !== index);
                                                                setFormData(prev => ({ ...prev, badge_rewards: newBadges }));
                                                            }}
                                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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
                                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500"
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
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <span className="text-sm font-semibold text-gray-700">{t('admin.challenges.modal.activeChallenge')}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 pt-6 border-t">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                                        >
                                            {t('admin.challenges.modal.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
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