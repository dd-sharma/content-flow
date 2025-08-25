import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

const CountdownTimer = ({ targetDate, className }) => {
    const [countdown, setCountdown] = useState('');
    const [colorClass, setColorClass] = useState('text-slate-600');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize(); // Set initial value
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const calculateCountdown = () => {
            if (!targetDate) {
                setCountdown('No deadline');
                setColorClass('text-slate-400');
                return;
            }

            const now = new Date();
            const target = new Date(targetDate);
            const totalSeconds = differenceInSeconds(target, now);

            if (totalSeconds <= 0) {
                setCountdown('OVERDUE');
                setColorClass('text-red-500 font-bold animate-pulse');
                return;
            }

            const days = Math.floor(totalSeconds / (3600 * 24));
            const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);

            let countdownString = '';
            if (isMobile) {
                if (days > 0) countdownString = `${days}d ${hours}h`;
                else if (hours > 0) countdownString = `${hours}h ${minutes}m`;
                else countdownString = `${minutes}m`;
            } else {
                if (days > 0) countdownString = `${days} day${days > 1 ? 's' : ''} ${hours}hr`;
                else if (hours > 0) countdownString = `${hours} hour${hours > 1 ? 's' : ''} ${minutes}min`;
                else countdownString = `${minutes} min`;
            }
            
            setCountdown(countdownString);

            if (days < 1) setColorClass('text-red-600');
            else if (days < 3) setColorClass('text-orange-600');
            else setColorClass('text-slate-600');
        };
        
        calculateCountdown();
        const timer = setInterval(calculateCountdown, 60000); // update every minute

        return () => clearInterval(timer);
    }, [targetDate, isMobile]);

    return (
        <span className={`tabular-nums ${colorClass} ${className}`}>
            {countdown}
        </span>
    );
};

export default CountdownTimer;