'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from '@/context/I18nContext';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';

interface PointsHistoryEntry {
  id: number;
  points: number;
  source_type: string;
  source_type_translated?: string;
  source_id: number | null;
  description: string;
  balance_after: number;
  created_at: string;
  source?: {
    id: number;
    title?: string;
    name?: string;
  };
}

interface PointsSummary {
  total_points: number;
  points_from_quizzes: number;
  points_from_badges: number;
  points_from_challenges: number;
  total_entries: number;
}

interface PointsHistoryProps {
  onDataUpdate?: () => void;
}

const PointsHistory: React.FC<PointsHistoryProps> = ({ onDataUpdate }) => {
  const { user } = useUser();
  const { t, locale } = useI18n();
  const [history, setHistory] = useState<PointsHistoryEntry[]>([]);
  const [summary, setSummary] = useState<PointsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();
  const fetchPointsHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push(`/${locale}/auth/signin`);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/points/history?page=${currentPage}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': locale,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.data);
        setCurrentPage(data.current_page);
        setTotalPages(data.last_page);
      }
    } catch (error) {
      console.error('Error fetching points history:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, locale]);

  const fetchPointsSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push(`/${locale}/auth/signin`);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/points/summary`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error('Error fetching points summary:', error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPointsHistory();
      fetchPointsSummary();
    }
  }, [user, currentPage, fetchPointsHistory]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPointsHistory(), fetchPointsSummary()]);
    if (onDataUpdate) {
      onDataUpdate();
    }
  }, [fetchPointsHistory, fetchPointsSummary, onDataUpdate]);

  // Expose refresh function globally for other components to use
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { refreshPointsHistory?: () => void }).refreshPointsHistory = refreshData;
    }
  }, [refreshData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'quiz':
        return '📝';
      case 'badge':
        return '🏆';
      case 'challenge':
        return '🎯';
      default:
        return '⭐';
    }
  };

  const getSourceColor = (sourceType: string) => {
    switch (sourceType) {
      case 'quiz':
        return 'bg-blue-100 text-blue-800';
      case 'badge':
        return 'bg-yellow-100 text-yellow-800';
      case 'challenge':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('pointsHistory.title')}</h2>
      
      {/* Points Summary */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{summary.total_points}</div>
            <div className="text-sm text-gray-600">{t('pointsHistory.totalPoints')}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-blue-600">{summary.points_from_quizzes}</div>
            <div className="text-sm text-gray-600">{t('pointsHistory.fromQuizzes')}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-yellow-600">{summary.points_from_badges}</div>
            <div className="text-sm text-gray-600">{t('pointsHistory.fromBadges')}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="text-2xl font-bold text-green-600">{summary.points_from_challenges}</div>
            <div className="text-sm text-gray-600">{t('pointsHistory.fromChallenges')}</div>
          </div>
        </div>
      )}

      {/* Points History */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{t('pointsHistory.recentTransactions')}</h3>
        </div>
        
        {history.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {t('pointsHistory.noHistory')}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {history.map((entry) => (
              <div key={entry.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-2xl">{getSourceIcon(entry.source_type)}</div>
                  <div>
                    <div className="font-medium text-gray-900">{entry.description}</div>
                    <div className="text-sm text-gray-500">{formatDate(entry.created_at)}</div>
                    {entry.source && (
                      <div className="text-sm text-gray-600">
                        {entry.source.title || entry.source.name}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(entry.source_type)}`}>
                    {entry.source_type_translated || entry.source_type}
                  </div>
                  <div className="text-lg font-semibold text-green-600 mt-1">
                    +{entry.points} {t('pointsHistory.points')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('pointsHistory.balance')} {entry.balance_after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pointsHistory.pagination.previous')}
            </button>
            <span className="text-sm text-gray-700">
              {t('pointsHistory.pagination.page')} {currentPage} {t('pointsHistory.pagination.of')} {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('pointsHistory.pagination.next')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsHistory;