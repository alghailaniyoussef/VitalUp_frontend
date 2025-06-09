'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useI18n } from '@/context/I18nContext';
import AdminNavigation from '@/components/AdminNavigation';

export default function AdminUsers() {
    const { user, isLoading } = useUser();
    const { t, locale } = useI18n();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [editingUser, setEditingUser] = useState(null);
    const [editingInterests, setEditingInterests] = useState(null);
    const [availableInterests, setAvailableInterests] = useState([]);
    const [userInterests, setUserInterests] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        is_admin: false,
        level: 1,
        points: 0
    });
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

        if (user && user.is_admin) {
            fetchUsers(currentPage);
            fetchAvailableInterests();
        }
    }, [user, isLoading, router, currentPage]);

    // Update available interests when locale changes
    useEffect(() => {
        if (user && user.is_admin) {
            fetchAvailableInterests();
        }
    }, [locale]);

    // Update user interests when locale changes and modal is open
    useEffect(() => {
        if (editingInterests && user && user.is_admin) {
            fetchUserInterests(editingInterests.id);
        }
    }, [locale, editingInterests?.id]);

    const fetchUsers = async (page) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                setLoading(false);
                return;
            }
            
            // Fetch all users without locale filter to show both EN and ES users
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?page=${page}`;
            console.log('Fetching users with URL:', apiUrl);
            
            const res = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });
            
            console.log('Users API response status:', res.status);

            if (!res.ok) {
                console.error('Failed to fetch users, status:', res.status);
                try {
                    const errorData = await res.json();
                    console.error('Error details:', errorData);
                } catch (jsonError) {
                    console.error('Could not parse error response');
                }
                // Provide fallback data
                setUsers([]);
                setTotalPages(1);
                return;
            }
            
            const data = await res.json();
            console.log('Users data received:', data);
            
            // Handle different response formats
            if (Array.isArray(data)) {
                setUsers(data);
                setTotalPages(1); // No pagination info in this format
            } else if (data.data) {
                setUsers(data.data);
                setTotalPages(Math.ceil(data.total / data.per_page));
            } else {
                console.error('Unexpected data format:', data);
                setUsers([]);
                setTotalPages(1);
            }
        } catch (err) {
            console.error('❌ Error loading users:', err);
            setUsers([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    };
    
    const fetchAvailableInterests = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                setAvailableInterests([]);
                return;
            }
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/interests?locale=${locale}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error('Failed to fetch interests');
            
            const data = await res.json();
            setAvailableInterests(data.interests || []);
        } catch (err) {
            console.error('❌ Error loading interests:', err);
            setAvailableInterests([]);
        }
    };
    
    const fetchUserInterests = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                setUserInterests([]);
                return;
            }
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}/interests?locale=${locale}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error('Failed to fetch user interests');
            
            const data = await res.json();
            setUserInterests(data.interests || []);
        } catch (err) {
            console.error('❌ Error loading user interests:', err);
            setUserInterests([]);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            is_admin: user.is_admin,
            level: user.level,
            points: user.points
        });
    };
    
    const handleEditInterests = (user) => {
        setEditingInterests(user);
        fetchUserInterests(user.id);
    };

    const handleDelete = async (userId) => {
        if (!confirm(t('admin.users.confirmDelete'))) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!res.ok) throw new Error('Failed to delete user');
            
            // Remove the user from the list
            setUsers(users.filter(u => u.id !== userId));
            alert(t('admin.users.deleteSuccess'));
        } catch (err) {
            console.error('❌ Error deleting user:', err);
            alert(t('admin.users.deleteError'));
        }
    };
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to update user');
            
            // Update the user in the list
            const updatedUsers = users.map(u => 
                u.id === editingUser.id ? { ...u, ...formData } : u
            );
            setUsers(updatedUsers);
            setEditingUser(null);
            alert(t('admin.users.updateSuccess'));
        } catch (err) {
            console.error('❌ Error updating user:', err);
            alert(t('admin.users.updateError'));
        }
    };
    
    const handleInterestChange = (interest) => {
        if (userInterests.includes(interest)) {
            setUserInterests(userInterests.filter(i => i !== interest));
        } else {
            setUserInterests([...userInterests, interest]);
        }
    };
    
    const handleInterestsSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No token found');
                return;
            }
            
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${editingInterests.id}/interests`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ interests: userInterests })
            });

            if (!res.ok) throw new Error('Failed to update user interests');
            
            setEditingInterests(null);
            alert(t('admin.users.interestsUpdateSuccess'));
        } catch (err) {
            console.error('❌ Error updating user interests:', err);
            alert(t('admin.users.interestsUpdateError'));
        }
    };

    if (isLoading || loading) {
        return <p className="text-center text-teal-700 mt-20 text-xl">{t('admin.users.loading')}</p>;
    }

    if (!user || !user.is_admin) {
        return null; // Will redirect in useEffect
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-16 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('admin.users.title')}</h1>
                        <p className="text-gray-600 text-lg">{t('admin.users.subtitle')}</p>
                    </div>
                </div>
            </div>

            {/* Admin Navigation */}
            <AdminNavigation />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Users Table */}
                <div className="bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.id')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.name')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.email')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.level')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.points')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.admin')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.badges')}</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.users.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.level}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.points}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.is_admin ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{t('admin.users.table.yes')}</span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{t('admin.users.table.no')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.badges && user.badges.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {user.badges.slice(0, 3).map(badge => {
                                                        // Get the badge name in the current locale
                                                        const badgeName = badge.locale === locale ? badge.name : 
                                                            (user.badges.find(b => b.title === badge.title && b.locale === locale)?.name || badge.name);
                                                        return (
                                                            <span key={badge.id} className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-blue-100 text-blue-800" title={badgeName}>
                                                                {badgeName}
                                                            </span>
                                                        );
                                                    })}
                                                    {user.badges.length > 3 && (
                                                        <span className="px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            {t('admin.users.table.moreBadges', { count: user.badges.length - 3 })}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">{t('admin.users.table.noBadges')}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                                            <button 
                                                onClick={() => handleEdit(user)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                {t('admin.users.table.edit')}
                                            </button>
                                            <button 
                                                onClick={() => handleEditInterests(user)}
                                                className="text-teal-600 hover:text-teal-900"
                                            >
                                                {t('admin.users.table.interests')}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(user.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                {t('admin.users.table.delete')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                {t('admin.users.pagination.previous')}
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                            >
                                {t('admin.users.pagination.next')}
                            </button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700">
                                    {t('admin.users.pagination.showing', { current: currentPage, total: totalPages })}
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <span className="sr-only">Previous</span>
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
                                        <span className="sr-only">Next</span>
                                        &rarr;
                                    </button>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit User Modal */}
                {editingUser && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('admin.users.editModal.title')}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.users.editModal.name')}</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.users.editModal.email')}</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.users.editModal.level')}</label>
                                        <input
                                            type="number"
                                            name="level"
                                            value={formData.level}
                                            onChange={handleChange}
                                            min="1"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">{t('admin.users.editModal.points')}</label>
                                        <input
                                            type="number"
                                            name="points"
                                            value={formData.points}
                                            onChange={handleChange}
                                            min="0"
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="is_admin"
                                            checked={formData.is_admin}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-900">{t('admin.users.editModal.admin')}</label>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6 flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingUser(null)}
                                        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        {t('admin.users.editModal.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                                    >
                                        {t('admin.users.editModal.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                
                {/* Edit User Interests Modal */}
                {editingInterests && (
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('admin.users.interestsModal.title')}</h2>
                            <p className="text-gray-600 mb-4">{t('admin.users.interestsModal.subtitle', { name: editingInterests.name })}</p>
                            <form onSubmit={handleInterestsSubmit}>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        {availableInterests.map((interest) => (
                                            <div key={interest} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`interest-${interest}`}
                                                    checked={userInterests.includes(interest)}
                                                    onChange={() => handleInterestChange(interest)}
                                                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                                                />
                                                <label htmlFor={`interest-${interest}`} className="ml-2 block text-sm text-gray-900">
                                                    {interest.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-6 flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditingInterests(null)}
                                        className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
                                    >
                                        {t('admin.users.interestsModal.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:text-sm"
                                    >
                                        {t('admin.users.interestsModal.save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}