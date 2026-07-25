'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Gamepad2, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#090D16] text-[#FAFAFA] flex flex-col items-center justify-center px-6 py-12 selection:bg-[#DFE104] selection:text-black">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Glow Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div className="absolute inset-0 bg-[#DFE104]/20 rounded-full blur-xl animate-pulse" />
          <div className="h-20 w-20 rounded-3xl bg-[#0D1117] border-2 border-[#DFE104] text-[#DFE104] flex items-center justify-center shadow-2xl relative">
            <ShieldAlert className="h-10 w-10 stroke-[2]" />
          </div>
        </div>

        {/* 404 Error Text */}
        <div className="space-y-2">
          <span className="text-xs font-mono font-bold tracking-widest text-[#DFE104] uppercase block">
            ERROR 404 • ROUTE MISSING
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-tight text-[#FAFAFA]">
            LOBBY NOT FOUND
          </h1>
          <p className="text-xs md:text-sm text-[#94A3B8] font-medium leading-relaxed max-w-sm mx-auto">
            The page or arena match route you requested does not exist, has been relocated, or is currently restricted.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/tournaments"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#DFE104] text-black font-extrabold text-xs uppercase tracking-wider hover:bg-[#FAFAFA] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#DFE104]/20"
          >
            <Gamepad2 className="h-4 w-4 stroke-[2]" />
            <span>VIEW TOURNAMENTS</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/5 border border-white/15 text-[#FAFAFA] hover:bg-white/10 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
          >
            <Home className="h-4 w-4 stroke-[2]" />
            <span>RETURN HOME</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
