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
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push(`/${locale}/auth/signin`);
                setLoading(false);
                return;
            }
            
            // Fetch badges filtered by current locale for proper pagination
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/badges?page=${page}&locale=${localeParam}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Language': locale,
                    'Authorization': `Bearer ${token}`,
                },
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
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push(`/${locale}/auth/signin`);
                setLoading(false);
                return;
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/badges${editingBadge ? `/${selectedBadge.id}` : ''}`, {
                method: editingBadge ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Language': locale,
                    'Authorization': `Bearer ${token}`,
                },
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
            const token = localStorage.getItem('auth_token');
            if (!token) {
                router.push(`/${locale}/auth/signin`);
                setLoading(false);
                return;
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/badges/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Accept-Language': locale,
                    'Authorization': `Bearer ${token}`,
           
                },
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
            <div className="min-h-screen bg-admin-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-admin-accent border-t-transparent mx-auto mb-4"></div>
                    <p className="text-admin-text text-lg">{t('admin.badges.loading')}</p>
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
                            <button
                                onClick={() => handleLocaleChange('en')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    locale === 'en'
                                        ? 'bg-admin-accent text-white'
                                        : 'bg-admin-border text-admin-text hover:bg-admin-border/70'
                                }`}
                            >
                                English
                            </button>
                            <button
                                onClick={() => handleLocaleChange('es')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    locale === 'es'
                                        ? 'bg-admin-accent text-white'
                                        : 'bg-admin-border text-admin-text hover:bg-admin-border/70'
                                }`}
                            >
                                Español
                            </button>
                        </div>
                        <div className="text-center flex-1">
                            <h1 className="text-4xl font-bold text-admin-text mb-2">{t('admin.badges.title')}</h1>
                            <p className="text-admin-text/70 text-lg">{t('admin.badges.subtitle')}</p>
                        </div>
                        <button
                            onClick={handleNew}
                            className="bg-admin-accent text-white px-6 py-3 rounded-xl hover:bg-admin-accent/90 transition-colors font-semibold shadow-glow"
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-admin-accent"></div>
                    </div>
                ) : badges.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-admin-text/60 text-lg">{t('common.noBadgesFound', { locale: locale.toUpperCase() })}</p>
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
                                className="relative inline-flex items-center px-4 py-2 border border-admin-border text-sm font-medium rounded-md text-admin-text bg-admin-card hover:bg-admin-accent/10 disabled:opacity-50"
                            >
                                {t('admin.badges.pagination.previous')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-admin-border text-sm font-medium rounded-md text-admin-text bg-admin-card hover:bg-admin-accent/10 disabled:opacity-50"
                            >
                                {t('admin.badges.pagination.next')}
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-admin-text">
                                    {t('admin.badges.pagination.showing', { current: currentPage, total: totalPages })}
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-admin-border bg-admin-card text-sm font-medium text-admin-text hover:bg-admin-accent/10 disabled:opacity-50"
                                    >
                                        <span className="sr-only">{t('admin.badges.pagination.previous')}</span>
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
                                        <span className="sr-only">{t('admin.badges.pagination.next')}</span>
                                        &rarr;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                    {badges.map((badge) => (
                        <div key={badge.id} className="bg-admin-card rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 overflow-hidden border border-admin-border">
                            <div className="p-6">
                                <div className="flex flex-col space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center flex-1 min-w-0">
                                            <div className="w-12 h-12 bg-admin-accent/20 rounded-full flex items-center justify-center text-admin-accent font-bold text-lg mr-3 flex-shrink-0">
                                                { predefinedIcons.find(icon => icon.value === badge.icon_path)?.icon || badge.icon_path }
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-lg font-bold text-admin-text truncate">{badge.name}</h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.type === 'quiz' ? 'bg-admin-info/20 text-admin-info' :
                                                            badge.type === 'challenge' ? 'bg-admin-success/20 text-admin-success' :
                                                                badge.type === 'points' ? 'bg-admin-warning/20 text-admin-warning' :
                                                                    'bg-admin-accent/20 text-admin-accent'
                                                        }`}>
                                                        {t(`admin.badges.types.${badge.type}`)}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.is_active ? 'bg-admin-success/20 text-admin-success' : 'bg-admin-error/20 text-admin-error'
                                                        }`}>
                                                        {badge.is_active ? t('admin.badges.status.active') : t('admin.badges.status.inactive')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2 ml-4 flex-shrink-0">
                                            <button
                                                onClick={() => handleEdit(badge)}
                                                className="p-2 text-admin-accent hover:bg-admin-accent/10 rounded-lg transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                            onClick={() => handleDelete(badge.id)}
                                            className="p-2 text-admin-error hover:bg-admin-error/10 rounded-lg transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-admin-text/70 text-sm line-clamp-2">{badge.description}</p>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-admin-text/60">{t('admin.badges.pointsReward')}:</span>
                                        <span className="font-semibold text-admin-accent">🏆 {badge.points_reward}</span>
                                    </div>
                                    <div className="text-xs text-admin-text/60">
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
                        <div className="bg-admin-card rounded-2xl shadow-glow max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-admin-border">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-admin-text">
                                        {editingBadge ? t('admin.badges.modal.editTitle') : t('admin.badges.modal.createTitle')}
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

                                <form onSubmit={handleCreateBadge} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.badges.modal.name')}</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={selectedBadge.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.badges.modal.description')}</label>
                                            <textarea
                                                name="description"
                                                value={selectedBadge.description}
                                                onChange={handleChange}
                                                rows={3}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.badges.modal.selectIcon')}</label>
                                            <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto border border-admin-border rounded-xl p-3 bg-admin-card">
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
                                                                ? 'border-admin-accent bg-admin-accent/10'
                                                                : 'border-admin-border hover:border-admin-accent/50'
                                                            }`}
                                                        title={iconOption.name}
                                                    >
                                                        <div className="text-2xl">{iconOption.icon}</div>
                                                        <div className="text-xs text-admin-text/70 mt-1">{iconOption.name}</div>
                                                    </button>
                                                ))}
                                            </div>
                                            {selectedBadge.icon_path && (
                                                <div className="mt-2 p-2 bg-admin-accent/10 rounded-lg">
                                                    <span className="text-sm text-admin-text/70">{t('admin.badges.modal.selected')}: </span>
                                                    <span className="text-lg">{predefinedIcons.find(icon => icon.value === selectedBadge.icon_path)?.icon || selectedBadge.icon_path}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.badges.modal.type')}</label>
                                            <select
                                                name="type"
                                                value={selectedBadge.type}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            >
                                                <option value="quiz">{t('admin.badges.types.quiz')}</option>
                                                <option value="challenge">{t('admin.badges.types.challenge')}</option>
                                                <option value="points">{t('admin.badges.types.points')}</option>
                                                <option value="level">{t('admin.badges.types.level')}</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.badges.modal.pointsReward')}</label>
                                            <input
                                                type="number"
                                                name="points_reward"
                                                value={selectedBadge.points_reward}
                                                onChange={handleChange}
                                                min="0"
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.challenges.modal.locale')}</label>
                                            <select
                                                name="locale"
                                                value={selectedBadge.locale || locale}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 border border-admin-border rounded-xl focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent transition-all bg-admin-card text-admin-text"
                                                required
                                            >
                                                                    <option value="en">{t('admin.challenges.modal.locales.en')}</option>
                                                                    <option value="es">{t('admin.challenges.modal.locales.es')}</option>
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
                                                        className="w-5 h-5 text-admin-accent bg-admin-card border-admin-border rounded focus:ring-admin-accent/20 focus:ring-2"
                                                    />
                                                    <span className="text-sm font-semibold text-admin-text">{t('admin.badges.modal.isActive')}</span>
                                                </label>
                                                <p className="text-xs text-admin-text/60 mt-1">{t('admin.badges.modal.inactiveNote')}</p>
                                            </div>
                                        )}

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-semibold text-admin-text mb-2">{t('admin.badges.modal.requirements')}</label>
                                            <div className="space-y-2">
                                                {selectedBadge.requirements.map((requirement, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            value={requirement}
                                                            onChange={(e) => handleRequirementChange(index, e.target.value)}
                                                            placeholder={t('admin.badges.modal.requirementPlaceholder')}
                                                            className="flex-1 px-4 py-2 border border-admin-border rounded-lg focus:ring-2 focus:ring-admin-accent/20 focus:border-admin-accent bg-admin-card text-admin-text"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRequirement(index)}
                                                            className="px-3 py-2 bg-admin-error text-white rounded-lg hover:bg-admin-error/90"
                                                        >
                                                            {t('admin.badges.modal.remove')}
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addRequirement}
                                                    className="w-full px-4 py-2 border-2 border-dashed border-admin-border rounded-lg text-admin-text/60 hover:border-admin-accent hover:text-admin-accent"
                                                >
                                                    {t('admin.badges.modal.addRequirement')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 pt-6 border-t border-admin-border">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-6 py-3 border border-admin-border text-admin-text rounded-xl hover:bg-admin-border/20 font-semibold transition-colors"
                                        >
                                            {t('admin.badges.modal.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-8 py-3 bg-gradient-to-r from-admin-accent to-admin-info hover:from-admin-accent/90 hover:to-admin-info/90 text-white rounded-xl font-semibold shadow-glow transform hover:scale-105 transition-all duration-200"
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