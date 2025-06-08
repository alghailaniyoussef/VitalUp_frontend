'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { toast } from 'react-toastify';
import AdminNavigation from '@/components/AdminNavigation';
import { useI18n } from '@/context/I18nContext';

export default function AdminBadges() {
    const { user, isLoading } = useUser();
    const { t ,locale } = useI18n();
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBadge, setEditingBadge] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // Remove separate locale state, use context locale directly
    const [selectedBadge, setSelectedBadge] = useState({
        name: '',
        description: '',
        icon: '',
        icon_path: '',
        type: 'quiz',
        requirements: [''],
        points_reward: 0,
        is_active: true
    });

    // Predefined icons
    const predefinedIcons = [
        { name: 'Trophy', icon: '🏆', value: 'trophy' },
        { name: 'Medal', icon: '🏅', value: 'medal' },
        { name: 'Star', icon: '⭐', value: 'star' },
        { name: 'Crown', icon: '👑', value: 'crown' },
        { name: 'Fire', icon: '🔥', value: 'fire' },
        { name: 'Lightning', icon: '⚡', value: 'lightning' },
        { name: 'Diamond', icon: '💎', value: 'diamond' },
        { name: 'Shield', icon: '🛡️', value: 'shield' },
        { name: 'Target', icon: '🎯', value: 'target' },
        { name: 'Rocket', icon: '🚀', value: 'rocket' },
        { name: 'Brain', icon: '🧠', value: 'brain' },
        { name: 'Heart', icon: '❤️', value: 'heart' },
        { name: 'Muscle', icon: '💪', value: 'muscle' },
        { name: 'Book', icon: '📚', value: 'book' },
        { name: 'Graduation', icon: '🎓', value: 'graduation' },
        { name: 'Checkmark', icon: '✅', value: 'checkmark' }
    ];
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
            fetchBadges(currentPage, locale);
        }
    }, [user, isLoading, router, currentPage, locale]);

    const handleLocaleChange = (newLocale) => {
        // Navigate to the new locale route
        router.push(`/${newLocale}/admin/badges`);
    };

    const fetchBadges = async (page, localeParam = locale) => {
        try {
            setLoading(true);
            const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
            // Fetch badges filtered by current locale for proper pagination
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/badges?page=${page}&locale=${localeParam}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : ''
                },
                credentials: 'include',
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Error details:', errorData);
                setBadges([]);
                return;
            }

            const data = await res.json();
            if (Array.isArray(data)) {
                setBadges(data);
                setTotalPages(1);
            } else if (data.data) {
                setBadges(data.data);
                setTotalPages(Math.ceil(data.total / data.per_page));
            } else {
                setBadges([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('Error loading badges:', err);
            setBadges([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBadge = async (e) => {
        e.preventDefault();
        try {
            // Format requirements based on badge type
            let formattedRequirements;
            const nonEmptyRequirements = Array.isArray(selectedBadge.requirements)
                ? selectedBadge.requirements.filter(req => req.trim() !== '')
                : [selectedBadge.requirements || 'Complete specific tasks'];

            switch (selectedBadge.type) {
                case 'points':
                    formattedRequirements = { points_required: parseInt(nonEmptyRequirements[0] || 0, 10) };
                    break;
                case 'level':
                    formattedRequirements = { level_required: parseInt(nonEmptyRequirements[0] || 0, 10) };
                    break;
                case 'challenge':
                    formattedRequirements = { challenge_count: parseInt(nonEmptyRequirements[0] || 0, 10) };
                    break;
                case 'quiz':
                    // For quiz type, we need to format requirements as an object with quiz-specific properties
                    formattedRequirements = { min_score: parseInt(nonEmptyRequirements[0] || 70, 10) };
                    break;
                default:
                    formattedRequirements = { custom: nonEmptyRequirements };
            }

            const badgeData = {
                name: selectedBadge.name,
                description: selectedBadge.description,
                icon_path: selectedBadge.icon_path,
                type: selectedBadge.type,
                requirements: formattedRequirements,
                points_reward: parseInt(selectedBadge.points_reward, 10)
            };

            // Only include is_active for updates, not for creation
            if (editingBadge) {
                badgeData.is_active = selectedBadge.is_active;
            }

            const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/badges${editingBadge ? `/${selectedBadge.id}` : ''}`, {
                method: editingBadge ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': csrfToken ? decodeURIComponent(csrfToken) : ''
                },
                credentials: 'include',
                body: JSON.stringify(badgeData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to save badge');
            }

            await fetchBadges(currentPage);
            setShowModal(false);
            setSelectedBadge({
                name: '',
                description: '',
                icon: '',
                icon_path: '',
                type: 'quiz',
                requirements: [],
                points_reward: 0,
                is_active: true
            });
            toast.success(editingBadge ? t('admin.badges.updateSuccess') : t('admin.badges.createSuccess'));
        } catch (error) {
            console.error('Error:', error);
            toast.error(error.message || t('admin.badges.error'));
        }
    };

    const handleEdit = (badge) => {
        setSelectedBadge({
            ...badge,
            requirements: Array.isArray(badge.requirements) && badge.requirements.length > 0
                ? badge.requirements
                : ['']
        });
        setEditingBadge(true);
        setShowModal(true);
    };

    const handleNew = () => {
        setSelectedBadge({
            name: '',
            description: '',
            icon: '',
            icon_path: '',
            type: 'quiz',
            requirements: [''],
            points_reward: 0,
            is_active: true
        });
        setEditingBadge(false);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm(t('admin.badges.confirmDelete'))) return;

        try {
            const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/badges/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(csrfToken)
                },
                credentials: 'include',
            });

            if (!res.ok) throw new Error('Failed to delete badge');

            await fetchBadges(currentPage);
            toast.success(t('admin.badges.deleteSuccess'));
        } catch (err) {
            console.error('Error deleting badge:', err);
            toast.error(t('admin.badges.deleteError'));
        }
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setSelectedBadge(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) : value
        }));
    };

    const handleRequirementChange = (index, value) => {
        const newRequirements = [...selectedBadge.requirements];
        newRequirements[index] = value;
        setSelectedBadge(prev => ({ ...prev, requirements: newRequirements }));
    };

    const addRequirement = () => {
        setSelectedBadge(prev => ({
            ...prev,
            requirements: [...prev.requirements, '']
        }));
    };

    const removeRequirement = (index) => {
        if (selectedBadge.requirements.length > 1) {
            const newRequirements = selectedBadge.requirements.filter((_, i) => i !== index);
            setSelectedBadge(prev => ({ ...prev, requirements: newRequirements }));
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">{t('admin.badges.loading')}</p>
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
                            <button
                                onClick={() => handleLocaleChange('en')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    locale === 'en'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => handleLocaleChange('es')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    locale === 'es'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                Español
                            </button>
                        </div>
                        <div className="text-center flex-1">
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('admin.badges.title')}</h1>
                            <p className="text-gray-600 text-lg">{t('admin.badges.subtitle')}</p>
                        </div>
                        <button
                            onClick={handleNew}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                        >
                            {t('admin.badges.createButton')}
                        </button>
                    </div>
                </div>
            </div>
            
            <AdminNavigation currentPage="badges" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                    </div>
                ) : badges.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No badges found for {locale.toUpperCase()} locale</p>
                    </div>
                ) : (
                    /* Badges Grid */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
                    {/* Pagination */}
                    <div className="col-span-full flex items-center justify-between">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                {t('admin.badges.pagination.previous')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                {t('admin.badges.pagination.next')}
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    {t('admin.badges.pagination.showing', { current: currentPage, total: totalPages })}
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">{t('admin.badges.pagination.previous')}</span>
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
                                        <span className="sr-only">{t('admin.badges.pagination.next')}</span>
                                        &rarr;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                    {badges.map((badge) => (
                        <div key={badge.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-teal-200 to-teal-50 rounded-full flex items-center justify-center text-white font-bold text-lg mr-3">
                                                    { predefinedIcons.find(icon => icon.value === badge.icon_path)?.icon || badge.icon_path }
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800">{badge.name}</h3>
                                                <div className="flex space-x-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.type === 'quiz' ? 'bg-blue-100 text-blue-800' :
                                                            badge.type === 'challenge' ? 'bg-green-100 text-green-800' :
                                                                badge.type === 'points' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-purple-100 text-purple-800'
                                                        }`}>
                                                        {t(`admin.badges.types.${badge.type}`)}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {badge.is_active ? t('admin.badges.status.active') : t('admin.badges.status.inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{badge.description}</p>
                                    </div>
                                    <div className="flex space-x-2 ml-2">
                                        <button
                                            onClick={() => handleEdit(badge)}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(badge.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{t('admin.badges.pointsReward')}:</span>
                                        <span className="font-semibold text-purple-600">🏆 {badge.points_reward}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        <span>{t('admin.badges.requirements')}: {Array.isArray(badge.requirements) ? badge.requirements.length : 1} {t('admin.badges.items')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                )}

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">
                                        {editingBadge ? t('admin.badges.modal.editTitle') : t('admin.badges.modal.createTitle')}
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

                                <form onSubmit={handleCreateBadge} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.badges.modal.name')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={selectedBadge.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.badges.modal.description')}</label>
                                            <textarea
                                                name="description"
                                                value={selectedBadge.description}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.badges.modal.selectIcon')}</label>
                                            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto border border-gray-300 rounded-xl p-3">
                                                {predefinedIcons.map((iconOption) => (
                                                    <button
                                                        key={iconOption.value}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedBadge(prev => ({
                                                                ...prev,
                                                                icon_path: iconOption.value,
                                                                icon: iconOption.value
                                                            }));
                                                        }}
                                                        className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${selectedBadge.icon_path === iconOption.value
                                                                ? 'border-purple-500 bg-purple-50'
                                                                : 'border-gray-200 hover:border-purple-300'
                                                            }`}
                                                        title={iconOption.name}
                                                    >
                                                        <div className="text-2xl">{iconOption.icon}</div>
                                                        <div className="text-xs text-gray-600 mt-1">{iconOption.name}</div>
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedBadge.icon_path && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                    <span className="text-sm text-gray-600">{t('admin.badges.modal.selected')}: </span>
                                                    <span className="text-lg">{predefinedIcons.find(icon => icon.value === selectedBadge.icon_path)?.icon || selectedBadge.icon_path}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.badges.modal.type')}</label>
                                            <select
                                                name="type"
                                                value={selectedBadge.type}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            >
                                                <option value="quiz">{t('admin.badges.types.quiz')}</option>
                                                <option value="challenge">{t('admin.badges.types.challenge')}</option>
                                                <option value="points">{t('admin.badges.types.points')}</option>
                                                <option value="level">{t('admin.badges.types.level')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.badges.modal.pointsReward')}</label>
                                            <input
                                                type="number"
                                                name="points_reward"
                                                value={selectedBadge.points_reward}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.badges.modal.locale')}</label>
                                            <select
                                                name="locale"
                                                value={selectedBadge.locale || locale}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                required
                                            >
                                                <option value="en">{t('admin.badges.modal.locales.en')}</option>
                                                <option value="es">{t('admin.badges.modal.locales.es')}</option>
                                            </select>
                                        </div>

                                        {editingBadge && (
                                            <div className="md:col-span-2">
                                                <label className="flex items-center space-x-3">
                                                    <input
                                                        type="checkbox"
                                                        name="is_active"
                                                        checked={selectedBadge.is_active}
                                                        onChange={(e) => setSelectedBadge(prev => ({ ...prev, is_active: e.target.checked }))}
                                                        className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700">{t('admin.badges.modal.isActive')}</span>
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">{t('admin.badges.modal.inactiveNote')}</p>
                                            </div>
                                        )}

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('admin.badges.modal.requirements')}</label>
                                            <div className="space-y-2">
                                                {selectedBadge.requirements.map((requirement, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={requirement}
                                                            onChange={(e) => handleRequirementChange(index, e.target.value)}
                                                            placeholder={t('admin.badges.modal.requirementPlaceholder')}
                                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRequirement(index)}
                                                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                                        >
                                                            {t('admin.badges.modal.remove')}
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addRequirement}
                                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-500"
                                                >
                                                    {t('admin.badges.modal.addRequirement')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 pt-6 border-t">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
                                        >
                                            {t('admin.badges.modal.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
                                        >
                                            {editingBadge ? t('admin.badges.modal.updateButton') : t('admin.badges.modal.createButton')}
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