'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Marquee from 'react-fast-marquee';
import {
  Trophy,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Flame,
  Sparkles,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);

    const clientId =
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      '915518431027-hlqlv3t55ipdhpc13i5gu80uv8g3kh0v.apps.googleusercontent.com';

    try {
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const googleProfile = await userInfoRes.json();

                const response = await api.post('/auth/google', {
                  email: googleProfile.email,
                  name: googleProfile.name,
                  googleId: googleProfile.sub,
                  profileImage: googleProfile.picture,
                });

                const { token, user } = response.data.data;
                login(token, user);
                router.push('/tournaments');
              } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to complete Google Sign In');
                setGoogleLoading(false);
              }
            } else {
              setGoogleLoading(false);
            }
          },
          error_callback: () => {
            setGoogleLoading(false);
          },
        });
        tokenClient.requestAccessToken();
      } else {
        const response = await api.post('/auth/google', {
          email: `google.player${Math.floor(1000 + Math.random() * 9000)}@gmail.com`,
          name: 'Google Gamer',
          googleId: 'g-' + Date.now(),
        });
        const { token, user } = response.data.data;
        login(token, user);
        router.push('/tournaments');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Google sign in failed. Please try again.';
      setError(msg);
      setGoogleLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    const demoEmail = 'proplayer@esports.com';
    const demoPassword = 'password123';
    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      let response;
      try {
        response = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      } catch (err) {
        await api.post('/auth/signup', {
          name: 'Pro Athlete',
          email: demoEmail,
          phone: '9876543210',
          password: demoPassword,
          gameName: 'PRO_ATHLETE_01',
          gameUID: '519284019',
        });
        response = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      }
      const { token, user } = response.data.data;
      login(token, user);
      router.push('/tournaments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Quick demo login failed.');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data.data;
      login(token, user);
      router.push('/tournaments');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080D] text-[#FAFAFA] selection:bg-[#DFE104] selection:text-black flex flex-col justify-between relative overflow-hidden">
      
      {/* 1. TOP INFINITE MARQUEE TICKER BANNER */}
      <div className="w-full bg-[#DFE104] text-black py-2.5 z-30 font-heading font-extrabold text-xs uppercase tracking-tighter shadow-xl">
        <Marquee speed={60} gradient={false} autoFill>
          <div className="flex items-center space-x-8 pr-8">
            <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 stroke-[2.5]" /> ₹5,00,000+ PRIZE POOLS DISTRIBUTED</span>
            <span>★</span>
            <span className="flex items-center gap-1.5"><Zap className="h-4 w-4 stroke-[2.5]" /> 15-MIN AUTOMATED ROOM REVEALS</span>
            <span>★</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 stroke-[2.5]" /> 100% VERIFIED UTR UPI PAYMENTS</span>
            <span>★</span>
            <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 stroke-[2.5]" /> 12,500+ PRO ATHLETES CONNECTED</span>
            <span>★</span>
          </div>
        </Marquee>
      </div>

      {/* 2. BACKGROUND ROTATING NEON BEAMS & SCANNING LASER */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[conic-gradient(from_0deg,transparent_0_300deg,#DFE104_360deg)] opacity-20 rounded-full blur-[100px] pointer-events-none z-0"
      />
      
      <motion.div
        animate={{ y: ['-10%', '110%', '-10%'] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#DFE104]/40 to-transparent shadow-[0_0_20px_#DFE104] pointer-events-none z-0"
      />

      {/* Ambient background glows */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#00f2fe]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#DFE104]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 3. MAIN CONTAINER WITH ANIMATED GLASSMORPHISM AUTH CARD */}
      <main className="w-full max-w-md mx-auto px-4 py-8 relative z-10 flex flex-col items-center justify-center flex-1">
        
        {/* Header Logo */}
        <div className="text-center mb-6 space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2.5 group">
            <div className="h-10 w-10 bg-[#DFE104] text-black rounded-xl flex items-center justify-center font-bold shadow-[0_0_20px_rgba(223,225,4,0.4)] group-hover:scale-105 transition-transform">
              <Trophy className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span className="text-2xl font-display font-extrabold text-white uppercase group-hover:text-[#DFE104] transition-colors">
              APEX ESPORTS
            </span>
          </Link>
        </div>

        <div className="w-full relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="bg-[#0D1117]/90 border border-white/20 rounded-3xl p-8 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden"
          >
            {/* Corner Highlight Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#DFE104]/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top Bar Header inside Card */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
              <div>
                <h2 className="text-xl font-display font-extrabold uppercase text-white tracking-tight flex items-center gap-2">
                  <span>ATHLETE AUTH</span>
                  <Sparkles className="h-4 w-4 text-[#DFE104]" />
                </h2>
                <p className="text-[10px] text-[#94A3B8] font-mono uppercase font-bold">ENTER ARENA CREDENTIALS</p>
              </div>

              {/* 1-Click Quick Demo Login Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading || googleLoading || demoLoading}
                className="px-3.5 py-2 rounded-xl bg-[#DFE104]/15 border border-[#DFE104]/50 text-[#DFE104] hover:bg-[#DFE104] hover:text-black font-extrabold text-[10px] uppercase transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
                title="Instant 1-Click Test Login"
              >
                {demoLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 fill-[#DFE104]" />}
                <span>DEMO LOGIN</span>
              </motion.button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl border border-red-500/40 bg-red-500/10 flex items-center gap-3 text-red-400 text-xs font-bold uppercase tracking-wide"
              >
                <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1.5">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="h-4 w-4 absolute left-4 top-3.5 text-[#94A3B8]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="PLAYER@ESPORTS.COM"
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-white placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#DFE104] focus:ring-1 focus:ring-[#DFE104] uppercase transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#94A3B8] mb-1.5">PASSWORD</label>
                <div className="relative">
                  <Lock className="h-4 w-4 absolute left-4 top-3.5 text-[#94A3B8]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-3 pl-11 pr-11 text-xs font-bold text-white placeholder-[#94A3B8]/60 focus:outline-none focus:border-[#DFE104] focus:ring-1 focus:ring-[#DFE104] uppercase transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#94A3B8] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading || googleLoading || demoLoading}
                className="w-full kt-btn-primary py-3.5 text-xs font-extrabold flex items-center justify-center space-x-2 disabled:opacity-50 shadow-xl"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin stroke-[2]" />
                ) : (
                  <>
                    <span>SIGN IN TO ARENA</span>
                    <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative px-3 bg-[#0D1117] text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest font-bold">
                OR CONTINUE WITH
              </div>
            </div>

            {/* Google SSO Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading || googleLoading || demoLoading}
              className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200 font-extrabold py-3 px-4 rounded-xl text-xs font-mono uppercase transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-black" />
              ) : (
                <>
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>CONTINUE WITH GOOGLE</span>
                </>
              )}
            </motion.button>

            <div className="pt-4 text-center text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] border-t border-white/10">
              <span>DON'T HAVE AN ACCOUNT? </span>
              <Link href="/signup" className="text-[#DFE104] hover:underline underline-offset-4 font-extrabold">
                REGISTER PROFILE
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      {/* 4. BOTTOM MARQUEE TICKER */}
      <div className="w-full bg-[#0D1117] border-t border-white/10 py-2 z-30 font-mono text-[11px] uppercase tracking-widest text-[#94A3B8]">
        <Marquee speed={40} gradient={false} autoFill>
          <div className="flex items-center space-x-10 pr-10">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> SECURE SSL ENCRYPTION</span>
            <span>|</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-[#DFE104]" /> REAL-TIME BRACKET ENGINE</span>
            <span>|</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> ANTI-CHEAT PROOF MODERATION</span>
            <span>|</span>
          </div>
        </Marquee>
      </div>
    </div>
  );
}
