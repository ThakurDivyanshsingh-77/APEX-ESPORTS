'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex flex-col items-center justify-center px-6 py-12 selection:bg-[#DFE104] selection:text-black">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
          <div className="h-20 w-20 rounded-3xl bg-[#0D1117] border-2 border-red-500 text-red-500 flex items-center justify-center shadow-2xl relative">
            <AlertCircle className="h-10 w-10 stroke-[2]" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase block">
            UNEXPECTED SYSTEM ERROR
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-[#FAFAFA]">
            SOMETHING WENT WRONG
          </h1>
          <p className="text-xs md:text-sm text-[#94A3B8] font-medium leading-relaxed max-w-sm mx-auto">
            {error.message || 'An unexpected error occurred while rendering this page.'}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#DFE104] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#FAFAFA] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#DFE104]/20"
          >
            <RefreshCw className="h-4 w-4 stroke-[2]" />
            <span>TRY AGAIN</span>
          </button>
          <Link
            href="/tournaments"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 border border-white/15 text-[#FAFAFA] hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4 stroke-[2]" />
            <span>BACK TO TOURNAMENTS</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
