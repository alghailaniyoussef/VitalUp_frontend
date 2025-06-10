'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminQuizzes() {
    const { user, isLoading } = useUser();
    const { t ,locale } = useI18n();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // Remove separate locale state, use context locale directly
    const router = useRouter();

    useEffect(() => {
        // Redirect if user is not admin
        if (!isLoading && user && !user.is_admin) {
            router.push('/dashboard');
            return;
        }

        if (!isLoading && !user) {
            router.push('/auth/signin');
            return;
        }

        const fetchQuizzes = async (page = 1, localeParam = locale) => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    router.push(`/${locale}/auth/signin`);
                    setLoading(false);
                    return;
                }
                
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/quizzes?page=${page}&locale=${localeParam}`;
                console.log('Fetching quizzes with URL:', apiUrl);
                
                const res = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                });
                
                console.log('Quizzes API response status:', res.status);

                if (!res.ok) {
                    console.error('Failed to fetch quizzes data, status:', res.status);
                    try {
                        const errorData = await res.json();
                        console.error('Error details:', errorData);
                    } catch (jsonError) {
                        console.error('Could not parse error response');
                    }
                    // Provide fallback data
                    setQuizzes([]);
                    setError(t('admin.quizzes.errors.loadFailed'));
                    return;
                }
                
                try {
                    const data = await res.json();
                    console.log('Quizzes data received:', data);
                    
                    // Handle different response formats
                    if (Array.isArray(data)) {
                        setQuizzes(data);
                        setTotalPages(1);
                    } else if (data.data) {
                        setQuizzes(data.data);
                        setTotalPages(Math.ceil(data.total / data.per_page));
                    } else {
                        console.error('Unexpected data format:', data);
                        setQuizzes([]);
                        setTotalPages(1);
                        setError(t('admin.quizzes.errors.unexpectedFormat'));
                    }
                } catch (jsonError) {
                    console.error('Error parsing quiz data:', jsonError);
                    setQuizzes([]);
                    setError(t('admin.quizzes.errors.processingError'));
                }
            } catch (err) {
                console.error('❌ Error loading quizzes:', err);
                setQuizzes([]);
                setError(t('admin.quizzes.errors.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        if (user && user.is_admin) {
            fetchQuizzes(currentPage, locale);
        }
    }, [user, isLoading, router, currentPage, locale]);

    const handleLocaleChange = (newLocale) => {
        // Navigate to the new locale route
        router.push(`/${newLocale}/admin/quizzes`);
    };

    const handleCreateQuiz = async (newQuiz) => {
        try {
            // Ensure all required fields are included and properly formatted
            const quizData = {
                    ...newQuiz,
                    title: newQuiz.title?.trim(),
                    description: newQuiz.description?.trim(),
                    points_per_question: parseInt(newQuiz.points_per_question, 10) || 10,
                    is_active: newQuiz.is_active === undefined ? true : newQuiz.is_active,
                    available_from: newQuiz.available_from || null,
                    available_until: newQuiz.available_until || null,
                    questions: Array.isArray(newQuiz.questions) ? newQuiz.questions : []
                };
            
            console.log('Submitting quiz data:', quizData);
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/quizzes`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quizData),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Error details:', errorData);
                throw new Error(errorData.message || (selectedQuiz.id ? t('admin.quizzes.errors.updateFailed') : t('admin.quizzes.errors.createFailed')));
            }
            const createdQuiz = await res.json();
            setQuizzes([...quizzes, createdQuiz]);
            setIsEditing(false);
            setSelectedQuiz(null);
        } catch (err) {
            console.error('❌ Error creating quiz:', err);
            setError(t('admin.quizzes.errors.createFailed'));
        }
    };

    const handleUpdateQuiz = async (quizId, updates) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/quizzes/${quizId}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!res.ok) throw new Error(t('admin.quizzes.errors.updateFailed'));
            const updatedQuiz = await res.json();
            setQuizzes(quizzes.map(q => q.id === quizId ? updatedQuiz : q));
            setIsEditing(false);
            setSelectedQuiz(null);
        } catch (err) {
            console.error('❌ Error updating quiz:', err);
            setError(t('admin.quizzes.errors.updateFailed'));
        }
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm(t('admin.quizzes.confirmDelete'))) return;

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/quizzes/${quizId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!res.ok) throw new Error(t('admin.quizzes.errors.deleteFailed'));
            setQuizzes(quizzes.filter(q => q.id !== quizId));
        } catch (err) {
            console.error('❌ Error deleting quiz:', err);
            setError(t('admin.quizzes.errors.deleteFailed'));
        }
    };

    if (isLoading || loading) {
        return <p className="text-center text-teal-700 mt-20 text-xl">{t('admin.quizzes.loading')}</p>;
    }

    if (!user || !user.is_admin) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('admin.quizzes.title')}</h1>
                            <p className="text-gray-600 text-lg">{t('admin.quizzes.subtitle')}</p>
                            
                            {/* Language Switch */}
                            <div className="flex justify-center mt-4 space-x-2">
                                <button
                                    onClick={() => handleLocaleChange('en')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        locale === 'en'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    English
                                </button>
                                <button
                                    onClick={() => handleLocaleChange('es')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        locale === 'es'
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                >
                                    Español
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const now = new Date();
                                const nextMonth = new Date(now);
                                nextMonth.setDate(now.getDate() + 30);
                                
                                setSelectedQuiz({
                                    title: '',
                                    description: '',
                                    points_per_question: 10,
                                    is_active: true,
                                    available_from: now.toISOString().split('T')[0],
                                    available_until: nextMonth.toISOString().split('T')[0],
                                    questions: [],
                                    difficulty: 'medium',
                                    category: 'general',
                                    locale: locale
                                });
                                setIsEditing(true);
                            }}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold shadow-lg"
                        >
                            {t('admin.quizzes.createButton')}
                        </button>
                    </div>
                </div>
            </div>
            
            <AdminNavigation currentPage="quizzes" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Quiz Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">{t('admin.quizzes.stats.total')}</h3>
                        <p className="text-4xl font-bold text-gray-900 mt-2">{quizzes.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">{t('admin.quizzes.stats.active')}</h3>
                        <p className="text-4xl font-bold text-gray-900 mt-2">
                            {quizzes.filter(q => q.is_active).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-700">{t('admin.quizzes.stats.totalQuestions')}</h3>
                        <p className="text-4xl font-bold text-gray-900 mt-2">
                            {quizzes.reduce((sum, q) => sum + (q.questions?.length || 0), 0)}
                        </p>
                    </div>
                </div>

                {/* Quiz Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
                                    <p className="text-sm text-gray-500">{quiz.questions?.length || 0} {t('admin.quizzes.questions')}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${quiz.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {quiz.is_active ? t('admin.quizzes.status.active') : t('admin.quizzes.status.inactive')}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm mb-4">{quiz.description}</p>
                            <div className="space-y-2 text-sm text-gray-500 mb-4">
                                <div className="flex justify-between">
                                    <span>{t('admin.quizzes.pointsPerQuestion')}:</span>
                                    <span>{quiz.points_per_question}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('admin.quizzes.availableFrom')}:</span>
                                    <span>{new Date(quiz.available_from).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>{t('admin.quizzes.availableUntil')}:</span>
                                    <span>{new Date(quiz.available_until).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => {
                                        console.log('Editing quiz:', quiz);
                                        console.log('Quiz questions:', quiz.questions);
                                        
                                        // Parse questions if they're stored as JSON string
                                        let parsedQuestions = [];
                                        if (typeof quiz.questions === 'string') {
                                            try {
                                                parsedQuestions = JSON.parse(quiz.questions);
                                            } catch (e) {
                                                console.error('Error parsing questions:', e);
                                                parsedQuestions = [];
                                            }
                                        } else if (Array.isArray(quiz.questions)) {
                                            parsedQuestions = quiz.questions;
                                        }
                                        
                                        console.log('Parsed questions:', parsedQuestions);
                                        
                                        setSelectedQuiz({
                                            ...quiz,
                                            questions: parsedQuestions
                                        });
                                        setIsEditing(true);
                                    }}
                                    className="text-teal-600 hover:text-teal-900"
                                >
                                    {t('common.edit')}
                                </button>
                                <button
                                    onClick={() => handleDeleteQuiz(quiz.id)}
                                    className="text-red-600 hover:text-red-900"
                                >
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    ))}                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-8">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {t('common.previous')}
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                {t('admin.quizzes.pagination.showing', { current: currentPage, total: totalPages })}
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">{t('common.previous')}</span>
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
                                    <span className="sr-only">{t('common.next')}</span>
                                    &rarr;
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Edit/Create Quiz Modal */}
                {isEditing && selectedQuiz && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
                        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                            <div className="mt-3">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {selectedQuiz.id ? t('admin.quizzes.modal.editTitle') : t('admin.quizzes.modal.createTitle')}
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.title')}</label>
                                        <input
                                            type="text"
                                            value={selectedQuiz.title}
                                            onChange={(e) => setSelectedQuiz({ ...selectedQuiz, title: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.description')}</label>
                                        <textarea
                                            value={selectedQuiz.description}
                                            onChange={(e) => setSelectedQuiz({ ...selectedQuiz, description: e.target.value })}
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.pointsPerQuestion')}</label>
                                        <input
                                            type="number"
                                            value={selectedQuiz.points_per_question}
                                            onChange={(e) => setSelectedQuiz({ ...selectedQuiz, points_per_question: parseInt(e.target.value) })}
                                            min="1"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                            <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.availableFrom')}</label>
                                            <input
                                                type="date"
                                                value={selectedQuiz.available_from ? selectedQuiz.available_from.split('T')[0] : ''}
                                                onChange={(e) => setSelectedQuiz({ ...selectedQuiz, available_from: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.availableUntil')}</label>
                                            <input
                                                type="date"
                                                value={selectedQuiz.available_until ? selectedQuiz.available_until.split('T')[0] : ''}
                                                onChange={(e) => setSelectedQuiz({ ...selectedQuiz, available_until: e.target.value })}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                            />
                                        </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.status')}</label>
                                        <select
                                            value={selectedQuiz.is_active ? 'active' : 'inactive'}
                                            onChange={(e) => setSelectedQuiz({ ...selectedQuiz, is_active: e.target.value === 'active' })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        >
                                            <option value="active">{t('admin.quizzes.status.active')}</option>
                                            <option value="inactive">{t('admin.quizzes.status.inactive')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.difficulty')}</label>
                                        <select
                                            value={selectedQuiz.difficulty || 'medium'}
                                            onChange={(e) => setSelectedQuiz({ ...selectedQuiz, difficulty: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        >
                                            <option value="easy">{t('admin.quizzes.difficulties.easy')}</option>
                                            <option value="medium">{t('admin.quizzes.difficulties.medium')}</option>
                                            <option value="hard">{t('admin.quizzes.difficulties.hard')}</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.category')}</label>
                                        <input
                                            type="text"
                                            value={selectedQuiz.category || ''}
                                            onChange={(e) => setSelectedQuiz({ ...selectedQuiz, category: e.target.value })}
                                            placeholder={t('admin.quizzes.modal.categoryPlaceholder')}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.quizzes.modal.locale')}</label>
                                        <select
                                            value={selectedQuiz.locale || 'en'}
                                            onChange={(e) => setSelectedQuiz({ ...selectedQuiz, locale: e.target.value })}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500"
                                        >
                                            <option value="en">{t('admin.quizzes.locales.en')}</option>
                                            <option value="es">{t('admin.quizzes.locales.es')}</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.quizzes.modal.questions')}</label>
                                        <div className="space-y-4">
                                            {selectedQuiz.questions?.map((question, index) => (
                                                <div key={question.id || index} className="border rounded-md p-4 bg-gray-50">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <input
                                                            type="text"
                                                            value={question.text}
                                                            onChange={(e) => {
                                                                const updatedQuestions = [...(selectedQuiz.questions || [])];
                                                                updatedQuestions[index] = { ...question, text: e.target.value };
                                                                setSelectedQuiz({ ...selectedQuiz, questions: updatedQuestions });
                                                            }}
                                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                                                            placeholder={t('admin.quizzes.modal.questionPlaceholder')}
                                                        />
                                                        <button
                                                            onClick={() => {
                                                                const updatedQuestions = selectedQuiz.questions?.filter((_, i) => i !== index) || [];
                                                                setSelectedQuiz({ ...selectedQuiz, questions: updatedQuestions });
                                                            }}
                                                            className="ml-2 text-red-600 hover:text-red-800"
                                                        >
                                                            {t('admin.quizzes.modal.remove')}
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {question.options?.map((option, optionIndex) => (
                                                            <div key={optionIndex} className="flex items-center space-x-2">
                                                                <input
                                                                    type="radio"
                                                                    checked={question.correct_answer === optionIndex}
                                                                    onChange={() => {
                                                                        const updatedQuestions = [...(selectedQuiz.questions || [])];
                                                                        updatedQuestions[index] = { ...question, correct_answer: optionIndex };
                                                                        setSelectedQuiz({ ...selectedQuiz, questions: updatedQuestions });
                                                                    }}
                                                                    className="text-teal-600 focus:ring-teal-500"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={option}
                                                                    onChange={(e) => {
                                                                        const updatedQuestions = [...(selectedQuiz.questions || [])];
                                                                        const updatedOptions = [...question.options];
                                                                        updatedOptions[optionIndex] = e.target.value;
                                                                        updatedQuestions[index] = { ...question, options: updatedOptions };
                                                                        setSelectedQuiz({ ...selectedQuiz, questions: updatedQuestions });
                                                                    }}
                                                                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 text-sm"
                                                                    placeholder={t('admin.quizzes.modal.optionPlaceholder', { number: optionIndex + 1 })}
                                                                />
                                                                {question.options.length > 2 && (
                                                                    <button
                                                                        onClick={() => {
                                                                            const updatedQuestions = [...(selectedQuiz.questions || [])];
                                                                            const updatedOptions = question.options.filter((_, i) => i !== optionIndex);
                                                                            updatedQuestions[index] = {
                                                                                ...question,
                                                                                options: updatedOptions,
                                                                                correct_answer: question.correct_answer > optionIndex
                                                                                    ? question.correct_answer - 1
                                                                                    : question.correct_answer
                                                                            };
                                                                            setSelectedQuiz({ ...selectedQuiz, questions: updatedQuestions });
                                                                        }}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        {t('admin.quizzes.modal.remove')}
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {question.options?.length < 4 && (
                                                            <button
                                                                onClick={() => {
                                                                    const updatedQuestions = [...(selectedQuiz.questions || [])];
                                                                    const updatedOptions = [...question.options, ''];
                                                                    updatedQuestions[index] = { ...question, options: updatedOptions };
                                                                    setSelectedQuiz({ ...selectedQuiz, questions: updatedQuestions });
                                                                }}
                                                                className="text-teal-600 hover:text-teal-800 text-sm"
                                                            >
                                                                {t('admin.quizzes.modal.addOption')}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const newQuestion = {
                                                        text: '',
                                                        options: ['', ''],
                                                        correct_answer: 0
                                                    };
                                                    setSelectedQuiz({
                                                        ...selectedQuiz,
                                                        questions: [...(selectedQuiz.questions || []), newQuestion]
                                                    });
                                                }}
                                                className="w-full py-2 px-4 border border-teal-600 text-teal-600 hover:bg-teal-50 rounded-md text-sm font-medium"
                                            >
                                                {t('admin.quizzes.modal.addQuestion')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 flex justify-end space-x-3">
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setSelectedQuiz(null);
                                        }}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium rounded-md"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (selectedQuiz.id) {
                                                handleUpdateQuiz(selectedQuiz.id, selectedQuiz);
                                            } else {
                                                handleCreateQuiz(selectedQuiz);
                                            }
                                        }}
                                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-md"
                                    >
                                        {selectedQuiz.id ? t('admin.quizzes.modal.saveChanges') : t('admin.quizzes.modal.createQuiz')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}