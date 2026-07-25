'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
          <div className="h-20 w-20 rounded-3xl bg-slate-900 border-2 border-blue-500 text-blue-400 flex items-center justify-center shadow-2xl relative">
            <ShieldAlert className="h-10 w-10 stroke-[2]" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase block">
            ADMIN MODULE 404 • NOT FOUND
          </span>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold uppercase tracking-tight text-white">
            PAGE NOT LOCATED
          </h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
            The admin governance route or panel resource you requested does not exist or has been moved.
          </p>
        </div>

        <div className="pt-4 flex items-center justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
          >
            <LayoutDashboard className="h-4 w-4 stroke-[2]" />
            <span>RETURN TO DASHBOARD</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
