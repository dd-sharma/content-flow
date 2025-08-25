import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

const TimeProgressBar = ({ 
  createdDate, 
  targetDate, 
  height = 4, 
  showPercentage = false,
  className = ''
}) => {
  const [percentage, setPercentage] = useState(0);
  const [colorClass, setColorClass] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculateProgress = () => {
      if (!createdDate || !targetDate) {
        setPercentage(0);
        setIsVisible(false);
        return;
      }

      const created = new Date(createdDate);
      const target = new Date(targetDate);
      const now = new Date();

      // If target date is in the past relative to created date, don't show
      if (target <= created) {
        setIsVisible(false);
        return;
      }

      const totalDuration = differenceInSeconds(target, created);
      const elapsedDuration = differenceInSeconds(now, created);
      
      let progressPercentage = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
      
      // If we're past the target date, show as 100%+ (overdue)
      if (now > target) {
        progressPercentage = 100;
      }

      setPercentage(Math.round(progressPercentage));
      setIsVisible(true);

      // Set color class based on percentage
      if (progressPercentage >= 90) {
        setColorClass('bg-gradient-to-r from-red-500 to-red-600');
      } else if (progressPercentage >= 75) {
        setColorClass('bg-gradient-to-r from-orange-500 to-orange-600');
      } else if (progressPercentage >= 50) {
        setColorClass('bg-gradient-to-r from-yellow-500 to-yellow-600');
      } else {
        setColorClass('bg-gradient-to-r from-emerald-500 to-emerald-600');
      }
    };

    calculateProgress();
    const timer = setInterval(calculateProgress, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [createdDate, targetDate]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Progress Bar Container */}
      <div 
        className="w-full bg-slate-200 rounded-full overflow-hidden glass-effect"
        style={{ height: `${height}px` }}
        title={`${percentage}% of time elapsed`}
      >
        {/* Progress Fill */}
        <div
          className={`h-full transition-all duration-500 ease-out ${colorClass} ${
            percentage >= 90 ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        
        {/* Overdue indicator */}
        {percentage >= 100 && (
          <div className="absolute inset-0 bg-red-600 animate-pulse opacity-75 rounded-full" />
        )}
      </div>

      {/* Percentage Label */}
      {showPercentage && (
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
          <span className={`text-xs font-medium px-2 py-1 rounded glass-effect ${
            percentage >= 90 ? 'text-red-600' :
            percentage >= 75 ? 'text-orange-600' :
            percentage >= 50 ? 'text-yellow-600' :
            'text-emerald-600'
          }`}>
            {percentage}%
          </span>
        </div>
      )}

      {/* Hover Tooltip */}
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
          {percentage}% of deadline elapsed
          {percentage >= 100 && (
            <span className="text-red-400 font-medium"> (OVERDUE)</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeProgressBar;