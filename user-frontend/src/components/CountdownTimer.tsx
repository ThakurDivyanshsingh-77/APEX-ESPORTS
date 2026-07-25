'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Key } from 'lucide-react';

interface CountdownTimerProps {
  initialRemainingMs: number;
  onExpire?: () => void;
}

export default function CountdownTimer({ initialRemainingMs, onExpire }: CountdownTimerProps) {
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);

  useEffect(() => {
    setRemainingMs(initialRemainingMs);
  }, [initialRemainingMs]);

  useEffect(() => {
    if (remainingMs <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= 1000) {
          clearInterval(interval);
          if (onExpire) onExpire();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingMs, onExpire]);

  if (remainingMs <= 0) {
    return (
      <span className="text-sm font-extrabold text-[#DFE104] uppercase tracking-tighter flex items-center gap-1.5 animate-pulse">
        <Key className="h-4 w-4 stroke-[2]" />
        <span>ROOM CREDENTIALS UNLOCKED</span>
      </span>
    );
  }

  const seconds = Math.floor((remainingMs / 1000) % 60);
  const minutes = Math.floor((remainingMs / (1000 * 60)) % 60);
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));

  const format2 = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="flex items-center space-x-3 text-sm font-bold uppercase tracking-tight text-[#DFE104]">
      <Clock className="h-4 w-4 animate-spin text-[#DFE104] stroke-[2]" />
      <span>
        AUTO-UNLOCK IN {format2(hours)}H {format2(minutes)}M {format2(seconds)}S
      </span>
    </div>
  );
}

