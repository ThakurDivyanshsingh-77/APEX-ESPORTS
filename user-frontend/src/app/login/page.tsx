'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '915518431027-hlqlv3t55ipdhpc13i5gu80uv8g3kh0v.apps.googleusercontent.com';

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
          }
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
    <div className="min-h-screen bg-[#030304] text-white flex flex-col justify-center items-center px-6 py-16 selection:bg-[#F7931A] selection:text-black bg-grid-pattern relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#F7931A]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="flex items-center space-x-3 mb-4 group">
            <div className="h-12 w-12 bg-gradient-to-r from-[#EA580C] to-[#F7931A] rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-[0_0_25px_-5px_rgba(247,147,26,0.6)]">
              <Trophy className="h-6 w-6 text-white stroke-[2.2]" />
            </div>
            <span className="text-2xl font-heading font-extrabold tracking-tight text-white uppercase group-hover:text-[#F7931A] transition-colors">
              APEX ESPORTS
            </span>
          </Link>
          <h1 className="text-3xl font-heading font-extrabold uppercase tracking-tight text-white">SIGN IN TO ARENA</h1>
          <p className="text-xs font-mono text-[#94A3B8] mt-2 uppercase tracking-wider">Access your competitive profile, tournament brackets, and live lobbies.</p>
        </div>

        {/* Card Form */}
        <div className="bg-[#0F1115] border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-[0_0_40px_-10px_rgba(247,147,26,0.2)] corner-border-accent">
          {error && (
            <div className="mb-6 p-4 rounded-2xl border border-[#F7931A]/40 bg-[#F7931A]/10 flex items-center gap-3 text-[#F7931A] text-xs font-mono font-bold uppercase tracking-wide">
              <AlertCircle className="h-5 w-5 shrink-0 stroke-[2]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] mb-2">EMAIL ADDRESS</label>
              <div className="relative">
                <Mail className="h-5 w-5 absolute left-3.5 top-3.5 text-[#94A3B8] stroke-[2]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="PLAYER@ESPORTS.COM"
                  className="w-full bg-black/50 border border-white/15 rounded-full py-3 pl-11 pr-4 text-xs font-mono text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#F7931A] uppercase transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 text-xs font-mono font-bold uppercase">
                <label className="text-[#94A3B8]">PASSWORD</label>
              </div>
              <div className="relative">
                <Lock className="h-5 w-5 absolute left-3.5 top-3.5 text-[#94A3B8] stroke-[2]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/15 rounded-full py-3 pl-11 pr-4 text-xs font-mono text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#F7931A] uppercase transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full kt-btn-primary py-4 text-xs flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin stroke-[2]" />
              ) : (
                <>
                  <span>SIGN IN TO ARENA</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative px-3 bg-[#0F1115] text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest">
              OR CONTINUE WITH
            </div>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading || googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-neutral-200 font-extrabold py-3.5 px-4 rounded-full text-xs font-mono uppercase transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-black" />
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>CONTINUE WITH GOOGLE</span>
              </>
            )}
          </button>

          <div className="mt-8 text-center text-xs font-mono font-bold uppercase tracking-wider text-[#94A3B8] border-t border-white/10 pt-6">
            <span>DON'T HAVE AN ACCOUNT? </span>
            <Link href="/signup" className="text-[#FFD600] hover:underline underline-offset-4">
              REGISTER PROFILE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



