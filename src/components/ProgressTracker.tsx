'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProgressTrackerProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  showNumbers?: boolean;
  color?: 'teal' | 'blue' | 'green' | 'purple' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const colorClasses = {
  teal: 'bg-teal-600',
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  purple: 'bg-purple-600',
  orange: 'bg-orange-600'
};

const sizeClasses = {
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4'
};

export default function ProgressTracker({
  current,
  total,
  label,
  showPercentage = true,
  showNumbers = false,
  color = 'teal',
  size = 'md',
  animated = true
}: ProgressTrackerProps) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const percentage = Math.min((current / total) * 100, 100);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(percentage);
    }
  }, [percentage, animated]);

  return (
    <div className="w-full">
      {(label || showPercentage || showNumbers) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span className="text-sm font-medium text-gray-700">{label}</span>
          )}
          <div className="flex items-center space-x-2">
            {showNumbers && (
              <span className="text-sm text-gray-600">
                {current}/{total}
              </span>
            )}
            {showPercentage && (
              <span className="text-sm font-medium text-gray-900">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <motion.div
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-500 ease-out`}
          initial={{ width: 0 }}
          animate={{ width: `${displayProgress}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// Circular Progress Component
interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
}

export function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#0d9488',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  children
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showPercentage && (
          <span className="text-lg font-semibold text-gray-900">
            {Math.round(percentage)}%
          </span>
        ))}
      </div>
    </div>
  );
}