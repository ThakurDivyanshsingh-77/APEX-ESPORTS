'use client';

import React, { useEffect } from 'react';
import {
  Trophy,
  Swords,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  Flame,
  Users,
  Zap,
  UserCheck,
  Star,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Marquee from 'react-fast-marquee';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push('/tournaments');
    }
  }, [user, router]);

  const featuredTournaments = [
    {
      id: '1',
      title: 'VALORANT CHAMPIONS SHOWDOWN',
      game: 'VALORANT',
      prize: '₹50,000',
      teams: '32 / 64 SQUADS',
      status: 'REGISTRATION OPEN',
      tag: '5V5 TACTICAL',
      bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: '2',
      title: 'BGMI CYBER SERIES SEASON 4',
      game: 'BATTLEGROUNDS MOBILE INDIA',
      prize: '₹2,50,000',
      teams: '96 / 100 SQUADS',
      status: 'STARTING SOON',
      tag: 'BATTLE ROYALE',
      bannerUrl: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&auto=format&fit=crop&q=80',
    },
    {
      id: '3',
      title: 'CS2 APEX MASTERS',
      game: 'COUNTER-STRIKE 2',
      prize: '₹1,00,000',
      teams: '16 / 16 TEAMS',
      status: 'LIVE BRACKET',
      tag: '5V5 COMPETITIVE',
      bannerUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const topEarners = [
    {
      rank: 1,
      name: 'PXS_VIPER',
      game: 'BGMI SQUAD',
      earnings: '₹1,85,000',
      wins: 42,
      avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
      badge: '★ CHAMPION',
    },
    {
      rank: 2,
      name: 'CYBER_SHADOW',
      game: 'VALORANT PRO',
      earnings: '₹1,20,000',
      wins: 34,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badge: '#2 SILVER',
    },
    {
      rank: 3,
      name: 'NEON_BLADE',
      game: 'CS2 MASTERS',
      earnings: '₹95,000',
      wins: 28,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      badge: '#3 BRONZE',
    },
  ];

  const testimonials = [
    {
      quote: 'Automated 15-min room reveal and instant UPI settlements make this the absolute best esports circuit in India.',
      name: 'Aman "SOUL_GOD" Verma',
      team: 'TEAM SOUL BGMI',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    },
    {
      quote: '12-digit UTR payment verification is super smooth. No delays, no fake players. Pure competitive integrity!',
      name: 'Rohan "MORTAL_X" Singh',
      team: 'GODLIKE ESPORTS',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    },
    {
      quote: 'Won ₹25,000 in Valorant 5v5 showmatch. Got result approved and payout in my account within minutes.',
      name: 'Karan "DEVIL" Malhotra',
      team: 'RECKONING ESPORTS',
      avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <main className="min-h-screen bg-[#09090B] text-[#FAFAFA] overflow-hidden selection:bg-[#DFE104] selection:text-black">
      {/* Dynamic Navbar */}
      <Navbar />

      {/* Kinetic Hero Section */}
      <section className="relative px-4 sm:px-8 md:px-12 py-12 w-full border-b-2 border-[#3F3F46]">
        <div className="w-full relative">
          {/* Subheader Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#DFE104] text-black text-xs font-heading font-extrabold uppercase tracking-tighter mb-8">
            <span className="h-2 w-2 bg-black animate-pulse"></span>
            <span>KINETIC CIRCUIT • HIGH-STAKES ARENA</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-6">
              {/* Massive Viewport Kinetic Headline */}
              <h1 className="text-[clamp(3.5rem,11vw,13rem)] leading-[0.85] font-heading font-extrabold uppercase tracking-tighter text-[#FAFAFA]">
                DOMINATE THE <br />
                <span className="text-[#DFE104] underline decoration-[#3F3F46] underline-offset-8">
                  ARENA.
                </span>
              </h1>

              <p className="text-lg md:text-2xl text-[#A1A1AA] leading-relaxed font-body font-medium max-w-3xl pt-4">
                Host, compete, and settle high-stakes esports showdowns. Powered by automated tournament brackets, real-time match lobbies, 12-digit UTR verification, and instant room credentials.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <Link href={user ? '/tournaments' : '/login'} className="kt-btn-primary text-base">
                  <span>ENTER ARENA</span>
                  <ArrowRight className="h-5 w-5 stroke-[3]" />
                </Link>
                <Link href="/signup" className="kt-btn-outline text-base">
                  REGISTER PROFILE
                </Link>
              </div>
            </div>

            {/* Massive Graphic Number & Trophy */}
            <div className="lg:col-span-4 relative flex flex-col items-end justify-end">
              <span className="text-[12rem] md:text-[15rem] leading-none font-heading font-extrabold text-[#27272A] select-none pointer-events-none -mb-8">
                01
              </span>
              <div className="p-8 bg-[#09090B] border-2 border-[#3F3F46] w-full flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#DFE104] uppercase block">LIVE PRIZE POOL</span>
                  <span className="text-3xl font-heading font-extrabold text-white">₹5,00,000+</span>
                </div>
                <Trophy className="h-10 w-10 text-[#DFE104] stroke-[2]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Fast Marquee Section (No Gradients) */}
      <section className="w-full bg-[#DFE104] text-black py-4 border-b-2 border-[#3F3F46]">
        <Marquee speed={80} gradient={false} autoFill>
          <div className="flex items-center space-x-12 pr-12 text-2xl md:text-4xl font-heading font-extrabold uppercase tracking-tighter">
            <span>₹5,00,000+ DISTRIBUTED</span>
            <span>★</span>
            <span>12,500+ PRO PLAYERS</span>
            <span>★</span>
            <span>100% AUTOMATED SETTLEMENT</span>
            <span>★</span>
          </div>
        </Marquee>
      </section>

      {/* Live Payout Activity Feed */}
      <section className="w-full bg-[#09090B] py-3 px-6 border-b-2 border-[#3F3F46] flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#27272A] px-3 py-1 text-[#DFE104] font-heading text-xs font-extrabold uppercase shrink-0 border border-[#3F3F46]">
          <Flame className="h-4 w-4 animate-pulse text-[#DFE104]" />
          <span>LIVE PAYOUT FEED</span>
        </div>

        <Marquee speed={50} gradient={false} autoFill>
          <div className="flex items-center space-x-10 text-xs font-heading font-bold uppercase pr-10">
            <span className="text-white flex items-center gap-2">
              <span className="h-2 w-2 bg-[#DFE104] animate-pulse" />
              <strong className="text-[#DFE104]">PXS_VIPER</strong> WON <strong className="text-white">₹15,000</strong> IN BGMI SQUADS
            </span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-white flex items-center gap-2">
              <span className="h-2 w-2 bg-[#DFE104] animate-pulse" />
              <strong className="text-[#DFE104]">CYBER_SHADOW</strong> WON <strong className="text-white">₹10,000</strong> IN VALORANT SHOWMATCH
            </span>
            <span className="text-[#3F3F46]">|</span>
            <span className="text-white flex items-center gap-2">
              <span className="h-2 w-2 bg-[#DFE104] animate-pulse" />
              <strong className="text-[#DFE104]">NEON_BLADE</strong> VERIFIED <strong className="text-white">₹5,000 UTR SETTLEMENT</strong>
            </span>
            <span className="text-[#3F3F46]">|</span>
          </div>
        </Marquee>
      </section>

      {/* Featured Matches Section with Hard Color Inversion */}
      <section id="tournaments" className="px-4 sm:px-8 md:px-12 py-20 w-full border-b-2 border-[#3F3F46]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b-2 border-[#3F3F46] gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#DFE104] block mb-1">01 // ARENA SHOWDOWNS</span>
            <h2 className="text-4xl md:text-7xl font-heading font-extrabold uppercase tracking-tighter text-white">
              FEATURED MATCHES
            </h2>
          </div>
          <Link
            href="/tournaments"
            className="kt-btn-outline text-xs"
          >
            <span>VIEW ALL MATCHES</span>
            <ArrowUpRight className="h-4 w-4 stroke-[3]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredTournaments.map((t, idx) => (
            <div
              key={t.id}
              className="kt-card kt-card-hover p-8 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-[#3F3F46] group-hover:border-black">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#A1A1AA] group-hover:text-black">{t.tag}</span>
                  <span className="text-[10px] font-heading font-extrabold uppercase bg-[#27272A] text-[#DFE104] group-hover:bg-black group-hover:text-[#DFE104] px-3 py-1 border border-[#3F3F46] group-hover:border-black">
                    {t.status}
                  </span>
                </div>

                <span className="text-xs font-mono font-bold block mb-2 text-[#DFE104] group-hover:text-black">0{idx + 1} — {t.game}</span>
                <h3 className="text-3xl font-heading font-extrabold uppercase tracking-tighter mb-6 leading-tight text-white group-hover:text-black">
                  {t.title}
                </h3>
              </div>

              <div className="pt-6 border-t-2 border-[#3F3F46] group-hover:border-black flex items-center justify-between text-xs font-bold">
                <div>
                  <span className="text-[#A1A1AA] group-hover:text-black block text-[10px] font-mono uppercase">PRIZE POOL</span>
                  <span className="text-2xl font-heading font-extrabold text-[#DFE104] group-hover:text-black">{t.prize}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#A1A1AA] group-hover:text-black block text-[10px] font-mono uppercase">SLOTS</span>
                  <span className="text-white group-hover:text-black font-mono font-bold">{t.teams}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4-Step How It Works (Hairline Gap Grid) */}
      <section className="py-20 w-full border-b-2 border-[#3F3F46] bg-[#09090B]">
        <div className="px-4 sm:px-8 md:px-12 mb-12">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#DFE104] block mb-1">02 // KINETIC PROCESS</span>
          <h2 className="text-4xl md:text-7xl font-heading font-extrabold uppercase tracking-tighter text-white">
            HOW IT WORKS
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#3F3F46] border-y-2 border-[#3F3F46]">
          {/* Step 1 */}
          <div className="bg-[#09090B] p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden group hover:bg-[#27272A] transition-colors">
            <span className="text-[7rem] font-heading font-extrabold text-[#27272A] group-hover:text-[#DFE104]/30 absolute top-2 right-4 pointer-events-none">01</span>
            <div className="h-12 w-12 bg-[#DFE104] text-black flex items-center justify-center font-bold mb-8 relative z-10">
              <UserCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-heading font-extrabold uppercase text-white mb-2">1. REGISTER & LINK</h3>
              <p className="text-sm text-[#A1A1AA] font-body">Create your player profile, link your In-Game Name & Character UID.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-[#09090B] p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden group hover:bg-[#27272A] transition-colors">
            <span className="text-[7rem] font-heading font-extrabold text-[#27272A] group-hover:text-[#DFE104]/30 absolute top-2 right-4 pointer-events-none">02</span>
            <div className="h-12 w-12 bg-[#DFE104] text-black flex items-center justify-center font-bold mb-8 relative z-10">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-heading font-extrabold uppercase text-white mb-2">2. JOIN & VERIFY UTR</h3>
              <p className="text-sm text-[#A1A1AA] font-body">Select match, submit entry fee with 12-digit UTR verification screenshot.</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-[#09090B] p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden group hover:bg-[#27272A] transition-colors">
            <span className="text-[7rem] font-heading font-extrabold text-[#27272A] group-hover:text-[#DFE104]/30 absolute top-2 right-4 pointer-events-none">03</span>
            <div className="h-12 w-12 bg-[#DFE104] text-black flex items-center justify-center font-bold mb-8 relative z-10">
              <Swords className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-heading font-extrabold uppercase text-white mb-2">3. DOMINATE MATCH</h3>
              <p className="text-sm text-[#A1A1AA] font-body">Receive automated Room ID & Password 15 minutes before lobby drop.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-[#09090B] p-8 flex flex-col justify-between min-h-[300px] relative overflow-hidden group hover:bg-[#27272A] transition-colors">
            <span className="text-[7rem] font-heading font-extrabold text-[#27272A] group-hover:text-[#DFE104]/30 absolute top-2 right-4 pointer-events-none">04</span>
            <div className="h-12 w-12 bg-[#DFE104] text-black flex items-center justify-center font-bold mb-8 relative z-10">
              <Zap className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl font-heading font-extrabold uppercase text-white mb-2">4. INSTANT DEFI PAYOUT</h3>
              <p className="text-sm text-[#A1A1AA] font-body">Match result verified & prize pool transferred instantly to winner account.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top Circuit Earners */}
      <section className="px-4 sm:px-8 md:px-12 py-20 w-full border-b-2 border-[#3F3F46]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 pb-6 border-b-2 border-[#3F3F46] gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#DFE104] block mb-1">03 // HALL OF FAME</span>
            <h2 className="text-4xl md:text-7xl font-heading font-extrabold uppercase tracking-tighter text-white">
              TOP EARNERS
            </h2>
          </div>
          <Link
            href="/leaderboard"
            className="kt-btn-outline text-xs"
          >
            <span>FULL LEADERBOARD</span>
            <ArrowUpRight className="h-4 w-4 stroke-[3]" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {topEarners.map((player) => (
            <div
              key={player.name}
              className={`kt-card p-8 text-center relative overflow-hidden ${
                player.rank === 1 ? 'border-4 border-[#DFE104] bg-[#27272A]/40' : ''
              }`}
            >
              <span className="text-[8rem] font-heading font-extrabold text-[#27272A] absolute -top-8 -right-4 pointer-events-none">
                0{player.rank}
              </span>

              <img
                src={player.avatar}
                alt={player.name}
                className="h-24 w-24 object-cover mx-auto my-4 border-2 border-[#DFE104] relative z-10"
              />

              <h3 className="text-2xl font-heading font-extrabold uppercase text-white mb-1 relative z-10">{player.name}</h3>
              <span className="text-xs font-mono text-[#DFE104] font-bold block mb-6 relative z-10">{player.game}</span>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold uppercase bg-[#27272A] p-4 border border-[#3F3F46] relative z-10">
                <div>
                  <span className="text-[#A1A1AA] block text-[10px]">TOTAL WINS</span>
                  <span className="text-white text-base font-heading font-bold">{player.wins} TITLES</span>
                </div>
                <div>
                  <span className="text-[#A1A1AA] block text-[10px]">EARNINGS</span>
                  <span className="text-[#DFE104] text-base font-heading font-bold">{player.earnings}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights / Architecture Cards */}
      <section id="features" className="px-4 sm:px-8 md:px-12 py-20 w-full border-b-2 border-[#3F3F46]">
        <div className="mb-12 pb-6 border-b-2 border-[#3F3F46]">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#DFE104] block mb-1">04 // ARCHITECTURE</span>
          <h2 className="text-4xl md:text-7xl font-heading font-extrabold uppercase tracking-tighter text-white">
            ENGINEERED FOR PROS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="kt-card kt-card-hover p-8 group cursor-pointer">
            <div className="h-12 w-12 bg-[#DFE104] text-black flex items-center justify-center mb-8 font-bold">
              <Swords className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="text-3xl font-heading font-extrabold uppercase tracking-tighter mb-4 text-white group-hover:text-black">AUTOMATED BRACKETS</h3>
            <p className="text-base text-[#A1A1AA] group-hover:text-black font-body">
              Real-time match bracket calculation, single and double elimination flows, and live status updates.
            </p>
          </div>

          <div className="kt-card kt-card-hover p-8 group cursor-pointer">
            <div className="h-12 w-12 bg-[#DFE104] text-black flex items-center justify-center mb-8 font-bold">
              <ShieldCheck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="text-3xl font-heading font-extrabold uppercase tracking-tighter mb-4 text-white group-hover:text-black">VERIFIED PAYMENTS</h3>
            <p className="text-base text-[#A1A1AA] group-hover:text-black font-body">
              12-digit UTR verification and payment screenshot proof moderation to guarantee spot reservations.
            </p>
          </div>

          <div className="kt-card kt-card-hover p-8 group cursor-pointer">
            <div className="h-12 w-12 bg-[#DFE104] text-black flex items-center justify-center mb-8 font-bold">
              <Users className="h-6 w-6 stroke-[2.5]" />
            </div>
            <h3 className="text-3xl font-heading font-extrabold uppercase tracking-tighter mb-4 text-white group-hover:text-black">ROOM REVEAL SYSTEM</h3>
            <p className="text-base text-[#A1A1AA] group-hover:text-black font-body">
              Automated countdown threshold for room ID & password release strictly for paid players.
            </p>
          </div>
        </div>
      </section>

      {/* Pro Gamer Reviews Marquee */}
      <section className="py-20 w-full bg-[#09090B]">
        <div className="px-4 sm:px-8 md:px-12 mb-12 text-center">
          <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#DFE104] block mb-1">05 // COMMUNITY REVIEWS</span>
          <h2 className="text-4xl md:text-7xl font-heading font-extrabold uppercase tracking-tighter text-white">
            PRO GAMER REVIEWS
          </h2>
        </div>

        <Marquee speed={40} gradient={false} autoFill>
          <div className="flex space-x-8 pr-8">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="kt-card p-8 w-[400px] shrink-0 flex flex-col justify-between"
              >
                <div>
                  <div className="flex space-x-1 mb-4 text-[#DFE104]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#DFE104] stroke-[0]" />
                    ))}
                  </div>
                  <p className="text-sm text-[#A1A1AA] font-body italic mb-6">"{t.quote}"</p>
                </div>

                <div className="flex items-center space-x-4 pt-4 border-t-2 border-[#3F3F46]">
                  <img src={t.avatar} alt={t.name} className="h-10 w-10 object-cover border border-[#DFE104]" />
                  <div>
                    <h4 className="text-sm font-heading font-bold text-white uppercase">{t.name}</h4>
                    <span className="text-[10px] font-mono text-[#DFE104] font-bold uppercase">{t.team}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Marquee>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-[#3F3F46] py-12 px-4 sm:px-8 md:px-12 bg-[#09090B] w-full">
        <div className="w-full flex flex-col md:flex-row items-center justify-between text-xs font-mono font-bold uppercase tracking-wider gap-6">
          <div>
            <span className="text-2xl font-heading font-extrabold tracking-tighter block mb-1 text-white">APEX ESPORTS PLATFORM</span>
            <span className="text-[#A1A1AA]">© 2026 APEX ESPORTS. KINETIC DEFI ENGINE.</span>
          </div>
          <div className="flex space-x-6 text-[#A1A1AA]">
            <Link href="/tournaments" className="hover:text-[#DFE104] transition-colors">TOURNAMENTS</Link>
            <Link href="/leaderboard" className="hover:text-[#DFE104] transition-colors">LEADERBOARD</Link>
            <Link href="/login" className="hover:text-[#DFE104] transition-colors">SIGN IN</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
