'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Trophy, Users, ShieldAlert, CreditCard, Settings, Award, Menu, X } from 'lucide-react';

interface AdminSidebarProps {
  activePath?: string;
}

export default function AdminSidebar({ activePath }: AdminSidebarProps = {}) {
  const pathname = usePathname();
  const currentPath = activePath || pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tournaments', href: '/tournaments', icon: Trophy },
    { name: 'Match Results', href: '/results', icon: Award },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Users Hub', href: '/users', icon: Users },
    { name: 'Community Teams', href: '/community/teams', icon: Trophy },
    { name: 'Support & Helpdesk', href: '/disputes', icon: ShieldAlert },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Navigation Header (visible on < md screens) */}
      <header className="md:hidden w-full bg-[#09090B] border-b-2 border-[#3F3F46] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-[#DFE104] text-black flex items-center justify-center font-bold">
            <LayoutDashboard className="h-4 w-4 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-heading font-extrabold tracking-tighter text-[#FAFAFA] text-sm uppercase">APEX ADMIN</h1>
            <span className="text-[9px] font-mono text-[#DFE104] font-bold uppercase tracking-widest block -mt-1">KINETIC PORTAL</span>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-[#27272A] border border-[#3F3F46] text-white hover:border-[#DFE104] transition-all rounded-lg"
          title="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="h-5 w-5 stroke-[2.5]" /> : <Menu className="h-5 w-5 stroke-[2.5]" />}
        </button>
      </header>

      {/* Mobile Nav Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-[59px] bg-[#09090B]/95 backdrop-blur-xl border-b-2 border-[#3F3F46] p-4 z-40 space-y-2 shadow-2xl animate-in slide-in-from-top duration-200">
          <nav className="space-y-1 text-xs font-heading uppercase font-bold tracking-tighter">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-2.5 border-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-[#DFE104] text-black border-[#DFE104] font-extrabold'
                      : 'bg-[#27272A]/40 text-[#A1A1AA] border-transparent hover:border-[#3F3F46] hover:bg-[#27272A] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-[#DFE104]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Desktop Sidebar (visible on >= md screens) */}
      <aside className="w-64 bg-[#09090B] border-r-2 border-[#3F3F46] p-6 flex-col justify-between hidden md:flex shrink-0 min-h-screen">
        <div>
          {/* App Logo Header */}
          <div className="flex items-center space-x-3 mb-8 pb-6 border-b-2 border-[#3F3F46]">
            <div className="h-10 w-10 bg-[#DFE104] text-black flex items-center justify-center font-bold">
              <LayoutDashboard className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold tracking-tighter text-[#FAFAFA] text-base uppercase">APEX ADMIN</h1>
              <span className="text-[10px] font-mono text-[#DFE104] font-bold uppercase tracking-widest block -mt-0.5">KINETIC PORTAL</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2 text-xs font-heading uppercase font-bold tracking-tighter">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 border-2 transition-all ${
                    isActive
                      ? 'bg-[#DFE104] text-black border-[#DFE104] font-extrabold'
                      : 'bg-[#27272A]/40 text-[#A1A1AA] border-transparent hover:border-[#3F3F46] hover:bg-[#27272A] hover:text-[#FAFAFA]'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-black' : 'text-[#A1A1AA]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System Connection Badge */}
        <div className="p-4 bg-[#27272A]/40 border-2 border-[#3F3F46] text-xs text-[#A1A1AA] mt-8">
          <p className="font-mono font-bold text-[#FAFAFA] uppercase text-[10px]">NETWORK STATUS</p>
          <div className="flex items-center space-x-2 mt-1.5">
            <span className="h-2 w-2 bg-[#DFE104] animate-pulse" />
            <span className="text-[#DFE104] font-heading font-bold text-[11px] uppercase tracking-tighter">KINETIC ENGINE ONLINE</span>
          </div>
        </div>
      </aside>
    </>
  );
}
