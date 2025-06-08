'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useI18n  } from '@/context/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CircularProgress } from '@/components/ProgressTracker';

interface Question {
  id: number;
  text: string;
  options: string[];
  correct_answer: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  category?: string;
  category_translated?: string;
  questions: Question[];
  points_per_question: number;
  is_active: boolean;
  available_from: string;
  available_until: string;
  current_question?: number;
  points_earned?: number;
}

export default function QuizPage() {
  const { user, setUser } = useUser();
  const { t, locale } = useI18n();
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<Quiz[]>([]);
  const [incompleteQuizzes, setIncompleteQuizzes] = useState<Quiz[]>([]);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<string | null>(null); // 'success', 'error', or null
  const [showConfetti, setShowConfetti] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes?locale=${locale}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Accept-Language': locale,
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAvailableQuizzes(data.available_quizzes || []);
          setCompletedQuizzes(data.completed_quizzes || []);
          setIncompleteQuizzes(data.incomplete_quizzes || []);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
        setError(t('quiz.error'));
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchQuizzes();
    } else {
      setIsLoading(false);
    }
  }, [user, locale, t]);

  const startQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setError(null);
    setFeedbackMessage('');
    setFeedbackType(null);
    setQuizCompleted(false);
    setShowConfetti(false);
  };

  const resumeQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentQuestionIndex(quiz.current_question || 0);
    setScore(0); // Score will be recalculated from saved answers
    setSelectedAnswer(null);
    setError(null);
    setFeedbackMessage('');
    setFeedbackType(null);
    setQuizCompleted(false);
    setShowConfetti(false);
  };

  const handleAnswerSelect = (index: number) => {
    if (feedbackMessage !== '') return;
    setSelectedAnswer(index);
    // Just select the answer, don't submit yet
  };
  
  

  const handleNextQuestion = async () => {
    if (!currentQuiz) return;
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setFeedbackMessage('');
      setFeedbackType('');
    } else {
      // Quiz completed - call complete endpoint
      await completeQuiz();
    }
  };

  const completeQuiz = async () => {
    if (!currentQuiz) return;

    try {
      setIsSubmitting(true); // Add loading state
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${currentQuiz.id}/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': locale,
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
        },
      });

      const responseData = await response.json();
      
      if (response.ok) {
        const { score, total_questions, points_earned, user_points, user_level } = responseData;
        
        // Update the quiz with the final score
        const completedQuiz = {
          ...currentQuiz,
          score: score,
          points_earned: points_earned,
          pivot: { score: score, points_earned: points_earned }
        };
        
        setQuizCompleted(true);
        setAvailableQuizzes(prev => prev.filter(q => q.id !== currentQuiz.id));
        setCompletedQuizzes(prev => [...prev, completedQuiz]);
        
        // Update user context if available
        if (user && setUser) {
          setUser({ ...user, points: user_points, level: user_level });
        }
        
        setFeedbackType('success');
        setFeedbackMessage(`Quiz completed! You scored ${score}/${total_questions} and earned ${points_earned} points!`);
        
        // Show confetti and completion message
        setShowConfetti(true);
        
        // Refresh points history if available
        if (typeof window !== 'undefined' && (window as unknown as { refreshPointsHistory?: () => void }).refreshPointsHistory) {
          (window as unknown as { refreshPointsHistory: () => void }).refreshPointsHistory();
        }
        
        // Dispatch custom event to update navigation
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('userDataUpdated'));
        }
        
        // Hide confetti after 3 seconds
        setTimeout(() => {
          setShowConfetti(false);
        }, 3000);
      } else {
        setError(responseData.message || 'Failed to complete quiz');
      }
    } catch (error) {
      console.error('Error completing quiz:', error);
      setError('An error occurred while completing the quiz');
    } finally {
      setIsSubmitting(false); // Reset loading state
    }
  };

  const submitAnswer = async () => {
    if (!currentQuiz || selectedAnswer === null) return;

    setIsSubmitting(true);
    try {
      const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes/${currentQuiz.id}/submit`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': locale,
          'X-Requested-With': 'XMLHttpRequest',
          'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
        },
        body: JSON.stringify({
          question_index: currentQuestionIndex,
          selected_answer: selectedAnswer
        }),
      });

      const responseData = await response.json();
      
      if (response.ok) {
        const { correct, points_earned } = responseData;
        
        // Show feedback based on whether answer was correct
        if (correct) {
          setFeedbackType('success');
          setFeedbackMessage(t('quiz.feedback.correct', { points: points_earned }));
          setScore(prev => prev + points_earned);
          // Show confetti for correct answers
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        } else {
          setFeedbackType('error');
          setFeedbackMessage(t('quiz.feedback.incorrect'));
          // Reset after showing feedback to allow retry
          setTimeout(() => {
            setSelectedAnswer(null);
            setFeedbackMessage('');
            setFeedbackType(null);
          }, 3000);
        }
      } else {
        // Handle error response
        if (responseData.errors) {
          // Improved error handling for validation errors
          const errorMessages: string[] = [];
          
          // Process each error type
          Object.entries(responseData.errors).forEach(([field, messages]) => {
            // Handle validation.required specifically
            if (Array.isArray(messages) && messages.includes('validation.required')) {
              errorMessages.push(`The ${field} field is required`);
            } else if (Array.isArray(messages)) {
              // Handle other validation errors
              errorMessages.push(`${field}: ${messages.join(', ')}`);
            }
          });
          
          if (errorMessages.length > 0) {
            setError(errorMessages.join('. '));
          } else {
            // Fallback for unprocessed errors
            setError('Error: ' + Object.values(responseData.errors).flat().join(', '));
          }
        } else if (responseData.message) {
          setError(responseData.message);
        } else {
          setError(t('quiz.feedback.submitError'));
        }
        console.error('Error response:', responseData);
      }
    } catch (error) {
      setError(t('quiz.feedback.submitFailed'));
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="p-4">{t('quiz.feedback.loginRequired')}</div>;
  }

  // Confetti component for celebrations
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 50 }).map((_, i) => {
          const size = Math.random() * 10 + 5;
          const left = Math.random() * 100;
          const animationDuration = Math.random() * 3 + 2;
          const delay = Math.random() * 0.5;
          
          return (
            <div 
              key={i}
              className="absolute top-0 rounded-full"
              style={{
                left: `${left}%`,
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: `hsl(${Math.random() * 360}, 100%, 50%)`,
                animation: `fall ${animationDuration}s ease-in ${delay}s forwards`,
              }}
            />
          );
        })}
      </div>
    );
  };

  // Quiz Modal Component
  const QuizModal = () => {
    // If no quiz is selected or quiz is completed but user hasn't closed the completion screen yet, don't render the quiz
    if (!currentQuiz) return null;
    
    const currentQuestion = currentQuiz.questions[currentQuestionIndex];
    if (!currentQuestion) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        {showConfetti && <Confetti />}
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-teal-800">{currentQuiz.title}</h2>
            <button
              onClick={async () => {
                setCurrentQuiz(null);
                setCurrentQuestionIndex(0);
                setSelectedAnswer(null);
                setScore(0);
                setFeedbackMessage('');
                setQuizCompleted(false);
                
                // Refresh the quiz list to show updated status
                try {
                  const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes?locale=${locale}`, {
                    credentials: 'include',
                    headers: {
                      'Accept': 'application/json',
                      'Accept-Language': locale,
                      'X-Requested-With': 'XMLHttpRequest',
                      'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
                    },
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setAvailableQuizzes(data.available_quizzes || []);
                    setCompletedQuizzes(data.completed_quizzes || []);
                    setIncompleteQuizzes(data.incomplete_quizzes || []);
                  }
                } catch (error) {
                  console.error('Error refreshing quizzes:', error);
                }
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
            <div
              className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${((currentQuestionIndex) / currentQuiz.questions.length) * 100}%` }}
            ></div>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <p className="text-lg font-medium text-teal-700 mb-4">Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</p>
              <h3 className="text-xl font-semibold text-gray-800 mb-6">{currentQuestion.text}</h3>
              <div className="space-y-4">
                {currentQuestion.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={feedbackMessage !== ''}
                    whileHover={{ scale: feedbackMessage === '' ? 1.02 : 1 }}
                    whileTap={{ scale: feedbackMessage === '' ? 0.98 : 1 }}
                    className={`w-full p-4 text-left rounded-lg transition-all border ${
                      feedbackMessage !== '' 
                        ? (index === currentQuestion.correct_answer 
                            ? 'bg-green-100 border-green-500 text-green-800' 
                            : selectedAnswer === index 
                              ? 'bg-red-100 border-red-500 text-red-800'
                              : 'bg-gray-100 border-gray-300 text-gray-600')
                        : selectedAnswer === index 
                          ? 'bg-teal-100 border-teal-500' 
                          : 'bg-white hover:bg-teal-50 border-gray-200'
                    } ${feedbackMessage !== '' ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {option}
                  </motion.button>
                ))}
                
                {selectedAnswer !== null && feedbackMessage === '' && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={submitAnswer}
                    disabled={isSubmitting}
                    className="mt-4 w-full p-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all font-medium"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Feedback message */}
          <AnimatePresence>
            {feedbackMessage && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 mb-4 rounded-lg ${feedbackType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {feedbackMessage}
                {feedbackType === 'success' && (
                  <button
                    onClick={handleNextQuestion}
                    className="ml-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    {currentQuestionIndex < currentQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Quiz completion message */}
          <AnimatePresence>
            {quizCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 mb-4 rounded-lg bg-teal-100 text-teal-800 text-center"
              >
                <h3 className="text-xl font-bold mb-2">Quiz Completed! 🎉</h3>
                <p className="mb-4">Your final score: {score} points</p>
                <button
                  onClick={() => {
                    // Reset all quiz state
                    setCurrentQuiz(null);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswer(null);
                    setScore(0);
                    setFeedbackMessage('');
                    setQuizCompleted(false);
                    setError(null);
                    
                    // Refresh the quiz list
                    const fetchQuizzes = async () => {
                      try {
                        setIsLoading(true); // Show loading state while fetching
                        const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '';
                        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quizzes?locale=${locale}`, {
                          credentials: 'include',
                          headers: {
                            'Accept': 'application/json',
                            'Accept-Language': locale,
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': decodeURIComponent(csrfToken),
                          },
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setAvailableQuizzes(data.available_quizzes || []);
                          setCompletedQuizzes(data.completed_quizzes || []);
                          setIncompleteQuizzes(data.incomplete_quizzes || []);
                        }
                      } catch (error) {
                        console.error('Error fetching quizzes:', error);
                        setError(t('quiz.error'));
                      } finally {
                        setIsLoading(false);
                      }
                    };
                    fetchQuizzes();
                  }}
                  className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  {t('quiz.close') || 'Close'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-teal-700 mb-4">Please log in to access quizzes</h1>
          <p className="text-gray-600">You need to be logged in to view and take quizzes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-teal-100 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-teal-800 mb-2">{t('quiz.header')}</h1>
            <p className="text-teal-600 text-lg">{t('quiz.subtitle')}</p>
            
            {/* Stats Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex justify-center items-center space-x-8"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{completedQuizzes.length}</div>
                  <div className="text-sm text-gray-600">{t('quiz.stats.completed')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{availableQuizzes.length}</div>
                  <div className="text-sm text-gray-600">{t('quiz.stats.available')}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{incompleteQuizzes.length}</div>
                   <div className="text-sm text-gray-600">{t('quiz.stats.inProgress')}</div>
              </div>
              <div className="text-center">
                <CircularProgress
                  percentage={completedQuizzes.length > 0 ? (completedQuizzes.length / (completedQuizzes.length + availableQuizzes.length + incompleteQuizzes.length)) * 100 : 0}
                  size={60}
                  strokeWidth={4}
                  showPercentage={false}
                >
                  <span className="text-xs font-bold text-teal-600">
                    {Math.round(completedQuizzes.length > 0 ? (completedQuizzes.length / (completedQuizzes.length + availableQuizzes.length + incompleteQuizzes.length)) * 100 : 0)}%
                  </span>
                </CircularProgress>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Available Quizzes */}
        {availableQuizzes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center">
              <span className="mr-3">📚</span>
              {t('quiz.availableQuizzes')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {availableQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100"
                >
                  <h3 className="text-xl font-semibold text-teal-700 mb-3">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4">{quiz.description}</p>
                  {(quiz.category_translated || quiz.category) && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full">
                        {quiz.category_translated || quiz.category}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-teal-600 font-medium">
                      {quiz.questions?.length || 0} {t('quiz.questions')}
                    </span>
                    <span className="text-sm text-green-600 font-bold">
                      +{quiz.points_per_question || 10} {t('quiz.pointsEach')}
                    </span>
                  </div>
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-4 rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    {t('quiz.startQuiz')}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Incomplete Quizzes */}
        {incompleteQuizzes.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-orange-600 mb-6 flex items-center">
              <span className="mr-3">⏳</span>
              {t('quiz.inProgressQuizzes')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {incompleteQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                  className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-orange-200"
                >
                  <h3 className="text-xl font-semibold text-orange-700 mb-3">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4">{quiz.description}</p>
                  {(quiz.category_translated || quiz.category) && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
                        {quiz.category_translated || quiz.category}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-orange-600 font-medium">
                      {t('quiz.question')} {(quiz.current_question || 0) + 1} {t('quiz.of')} {quiz.questions?.length || 0}
                    </span>
                    <span className="text-sm text-green-600 font-bold">
                      +{quiz.points_per_question || 10} {t('quiz.pointsEach')}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((quiz.current_question || 0) / (quiz.questions?.length || 1)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {Math.round(((quiz.current_question || 0) / (quiz.questions?.length || 1)) * 100)}% {t('quiz.completed')}
                    </p>
                  </div>
                  <button
                    onClick={() => resumeQuiz(quiz)}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    {t('quiz.resumeQuiz')}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Quizzes */}
        {completedQuizzes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-teal-700 mb-6 flex items-center mt-12">
                <span className="mr-3">✅</span>
                {t('quiz.completedQuizzes')}
              </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedQuizzes.map((quiz, index) => (
                <motion.div
                  key={quiz.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-green-200 opacity-75"
                >
                  <h3 className="text-xl font-semibold text-green-700 mb-3">{quiz.title}</h3>
                  <p className="text-gray-600 mb-4">{quiz.description}</p>
                  {(quiz.category_translated || quiz.category) && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                        {quiz.category_translated || quiz.category}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600 font-medium">{t('quiz.completedStatus')}</span>
                    <span className="text-sm text-green-600 font-bold">
                      {t('quiz.points')}: {quiz.points_earned || 0} {t('quiz.pts')}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-700">{t('quiz.loading.title')}</h3>
            <p className="text-gray-500 mt-2">{t('quiz.loading.message')}</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-700">{error}</h3>
            <p className="text-gray-500 mt-2">Please try again later.</p>
          </div>
        ) : availableQuizzes.length === 0 && completedQuizzes.length === 0 && incompleteQuizzes.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 text-5xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-gray-700">{t('quiz.noQuizzes.title')}</h3>
            <p className="text-gray-500 mt-2">{t('quiz.noQuizzes.message')}</p>
          </div>
        ) : null}
      </div>

      {/* Quiz Modal */}
      <AnimatePresence>
        {currentQuiz && <QuizModal />}
      </AnimatePresence>

      {/* Confetti */}
      {showConfetti && <Confetti />}
      
      {/* Quiz lists are now conditionally rendered above */}
    </div>
  );
}