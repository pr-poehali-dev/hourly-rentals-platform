import { useState, useEffect } from 'react';

interface LiveCountdownProps {
  expiresAt: string | null;
}

export default function LiveCountdown({ expiresAt }: LiveCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Истекла');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}д ${hours}ч ${minutes}м`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}ч ${minutes}м ${seconds}с`);
      } else {
        setTimeLeft(`${minutes}м ${seconds}с`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return timeLeft ? <div className="text-xs mt-1">{timeLeft}</div> : null;
}
