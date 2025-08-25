import React, { useState, useEffect } from 'react';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

const ElapsedTime = ({ startDate, className }) => {
  const [elapsedText, setElapsedText] = useState('');
  const [colorClass, setColorClass] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const calculateElapsed = () => {
      if (!startDate) {
        setElapsedText('');
        setColorClass('text-slate-500');
        return;
      }

      const now = new Date();
      const start = new Date(startDate);
      const totalSeconds = differenceInSeconds(now, start);

      if (totalSeconds < 0) {
        setElapsedText('Future date');
        setColorClass('text-slate-400');
        return;
      }

      const days = differenceInDays(now, start);
      const hours = differenceInHours(now, start);
      const minutes = differenceInMinutes(now, start);

      let elapsedString = '';
      let color = 'text-slate-600';

      if (isMobile) {
          if (totalSeconds < 60) elapsedString = 'now';
          else if (minutes < 60) elapsedString = `${minutes}m`;
          else if (hours < 24) elapsedString = `${hours}h`;
          else if (days < 7) elapsedString = `${days}d`;
          else {
              const weeks = Math.floor(days / 7);
              elapsedString = `${weeks}w`;
          }
      } else {
          if (totalSeconds < 60) {
            elapsedString = 'Just now';
            color = 'text-slate-500';
          } else if (minutes < 60) {
            elapsedString = `${minutes}m ago`;
            color = 'text-slate-600';
          } else if (hours < 24) {
            const remainingMinutes = minutes % 60;
            if (remainingMinutes > 0) {
              elapsedString = `${hours}h ${remainingMinutes}m ago`;
            } else {
              elapsedString = `${hours}h ago`;
            }
            color = 'text-slate-700';
          } else if (days < 7) {
            elapsedString = `${days} day${days === 1 ? '' : 's'} ago`;
            color = 'text-orange-600';
          } else if (days < 30) {
            const weeks = Math.floor(days / 7);
            elapsedString = `${weeks} week${weeks === 1 ? '' : 's'} ago`;
            color = 'text-red-500';
          } else {
            const months = Math.floor(days / 30);
            elapsedString = `${months} month${months === 1 ? '' : 's'} ago`;
            color = 'text-red-600 font-medium';
          }
      }
      
      setElapsedText(elapsedString);
      setColorClass(color);
    };

    calculateElapsed();
    const timer = setInterval(calculateElapsed, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [startDate, isMobile]);

  if (!elapsedText) {
    return null;
  }

  return (
    <span className={`tabular-nums text-xs ${colorClass} ${className}`}>
      {elapsedText}
    </span>
  );
};

export default ElapsedTime;