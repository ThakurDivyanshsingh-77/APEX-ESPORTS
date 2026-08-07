'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { Trophy, Search, Filter, Calendar, MapPin, Users, DollarSign, Loader2 } from 'lucide-react';
import api from '@/lib/api';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import PacmanLoader from '@/components/PacmanLoader';

export interface Tournament {
  _id: string;
  title: string;
  game: string;
  mode: string;
  entryFee: number;
  prizePool: string;
  winnerCount?: '1' | '2' | '3' | string;
  prizeBreakdown?: {
    first?: number;
    second?: number;
    third?: number;
  };
  slots: number;
  filledSlots: number;
  date: string;
  time: string;
  map: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  registrationOpen: boolean;
  bannerImage: string;
  description: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function TournamentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedGame, setSelectedGame] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments');
      setTournaments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch tournaments', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.game.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGame = selectedGame === 'ALL' || t.game.toUpperCase() === selectedGame.toUpperCase();
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchesSearch && matchesGame && matchesStatus;
  });

  const gamesList = ['ALL', 'VALORANT', 'BGMI', 'CS2', 'FREE FIRE', 'APEX LEGENDS'];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] pb-20 selection:bg-[#DFE104] selection:text-black">
      <Navbar />

      <main className="w-full px-4 sm:px-8 md:px-12 py-8">
        {/* Header Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#3F3F46] pb-6 mb-8 gap-4"
        >
          <div>
            <span className="text-xs font-mono uppercase tracking-widest font-bold text-[#DFE104] block mb-1">PRO ARENA DIRECTORY</span>
            <h1 className="text-4xl md:text-7xl font-heading font-extrabold uppercase tracking-tighter text-white">
              ACTIVE MATCHES & TOURNAMENTS
            </h1>
          </div>
          <div className="text-xs font-mono text-[#A1A1AA] font-bold uppercase">
            SHOWING {filteredTournaments.length} MATCHES
          </div>
        </motion.div>

        {/* Filter Controls Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-[#09090B] border-2 border-[#3F3F46] p-6 mb-10 space-y-4 shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="h-5 w-5 absolute left-4 top-3.5 text-[#A1A1AA] stroke-[2]" />
              <input
                type="text"
                placeholder="SEARCH TOURNAMENTS OR GAMES..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#27272A]/40 border-2 border-[#3F3F46] py-3 pl-12 pr-4 text-xs font-heading font-bold text-white placeholder-[#A1A1AA] focus:outline-none focus:border-[#DFE104] uppercase transition-all"
              />
            </div>

            {/* Status Selector Dropdown */}
            <div className="w-full md:w-56 relative">
              <Filter className="h-4 w-4 absolute left-3.5 top-4 text-[#A1A1AA] stroke-[2]" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-[#27272A]/40 border-2 border-[#3F3F46] py-3 pl-10 pr-4 text-xs font-heading font-bold text-white focus:outline-none focus:border-[#DFE104] uppercase transition-all cursor-pointer appearance-none"
              >
                <option value="ALL" className="bg-[#09090B] text-white">ALL STATUSES</option>
                <option value="UPCOMING" className="bg-[#09090B] text-white">UPCOMING</option>
                <option value="LIVE" className="bg-[#09090B] text-white">LIVE MATCHES</option>
                <option value="COMPLETED" className="bg-[#09090B] text-white">COMPLETED</option>
              </select>
            </div>
          </div>

          {/* Game Category Pill Badges */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-2 scrollbar-none">
            {gamesList.map((game) => (
              <motion.button
                key={game}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedGame(game)}
                className={`px-4 py-2 text-xs font-heading font-extrabold uppercase border-2 transition-all whitespace-nowrap ${
                  selectedGame === game
                    ? 'bg-[#DFE104] text-black border-[#DFE104]'
                    : 'bg-[#27272A]/40 text-[#A1A1AA] border-[#3F3F46] hover:border-[#DFE104] hover:text-[#FAFAFA]'
                }`}
              >
                {game}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="py-16">
            <PacmanLoader text="LOADING ARENA MATCHES..." />
          </div>
        ) : filteredTournaments.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F1115] border border-white/10 rounded-3xl p-16 text-center text-[#94A3B8] font-mono font-bold uppercase"
          >
            <Trophy className="h-12 w-12 text-[#94A3B8]/40 mx-auto mb-4 stroke-[1.5]" />
            <p className="text-lg text-white mb-2 font-heading">NO MATCHES FOUND</p>
            <p className="text-xs text-[#94A3B8]">Try adjusting your search keywords or game filters.</p>
          </motion.div>
        ) : (
          /* Tournaments Grid */
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {filteredTournaments.map((t) => (
              <motion.div
                key={t._id}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-[#0F1115] border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-[#DFE104]/80 shadow-xl hover:shadow-[0_0_30px_-10px_rgba(223,225,4,0.25)] corner-border-accent group"
              >
                {/* Card Banner Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={t.bannerImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80'}
                    alt={t.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-transparent to-transparent" />

                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                    <span className="px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-black/70 backdrop-blur-md text-white border border-white/20">
                      {t.game}
                    </span>
                    <span
                      className={`px-3.5 py-1 text-[10px] font-mono font-extrabold uppercase rounded-full border-2 backdrop-blur-md shadow-xl ${
                        t.status === 'LIVE'
                          ? 'bg-[#030304]/95 text-red-400 border-red-500/80 shadow-red-500/30 animate-pulse'
                          : t.status === 'UPCOMING'
                          ? 'bg-[#030304]/95 text-[#DFE104] border-[#DFE104]/80 shadow-[#DFE104]/30'
                          : 'bg-[#030304]/95 text-emerald-400 border-emerald-500/80 shadow-emerald-500/30'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-heading font-bold uppercase tracking-tight text-white mb-4 leading-snug group-hover:text-[#DFE104] transition-colors">
                      {t.title}
                    </h3>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6 text-xs font-mono font-bold uppercase text-[#94A3B8]">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-[#DFE104] stroke-[2]" />
                        <span>PRIZE: <strong className="text-[#DFE104]">{t.prizePool}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-white stroke-[2]" />
                        <span>SLOTS: <strong className="text-white font-mono text-xs">{t.filledSlots || 0}/{t.slots}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-[#94A3B8] stroke-[2]" />
                        <span>{t.date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-[#94A3B8] stroke-[2]" />
                        <span>{t.map}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer CTA */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase font-bold text-[#94A3B8] block">ENTRY FEE</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {t.entryFee === 0 ? 'FREE ENTRY' : `₹${t.entryFee}`}
                      </span>
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Link
                        href={`/tournaments/${t._id}`}
                        className="kt-btn-primary !py-2.5 !px-5 text-xs inline-block"
                      >
                        VIEW MATCH
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
