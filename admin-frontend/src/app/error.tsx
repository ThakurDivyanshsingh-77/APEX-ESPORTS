'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Admin Panel Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          <div className="h-20 w-20 rounded-3xl bg-slate-900 border-2 border-red-500 text-red-400 flex items-center justify-center shadow-2xl relative">
            <AlertTriangle className="h-10 w-10 stroke-[2]" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase block">
            ADMIN SYSTEM EXCEPTION
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-white">
            MODULE ERROR OCCURRED
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            {error.message || 'An unexpected error occurred while rendering the admin control panel.'}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className="h-4 w-4 stroke-[2]" />
            <span>RETRY COMPONENT</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-slate-700"
          >
            <LayoutDashboard className="h-4 w-4 stroke-[2]" />
            <span>ADMIN HOME</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
