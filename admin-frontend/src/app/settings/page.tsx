'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Settings, Shield, QrCode, ToggleLeft, ToggleRight, Save, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    platformFeePercentage: 10,
    defaultUPI: 'esports@upi',
    socketStreamEnabled: true,
    autoApproveFreeTournaments: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.data);
    } catch (err) {
      console.error('Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await api.patch('/admin/settings', settings);
      setSettings(res.data.data);
      setFeedback({ type: 'success', text: 'Platform settings updated successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update platform settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto max-w-5xl">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Settings className="h-7 w-7 text-blue-500" />
              <span>Platform Settings & Controls</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">Configure platform commission fees, maintenance mode, and system parameters.</p>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center gap-3 ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <span className="text-xs">Loading system configurations...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* System Control Cards */}
            <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <span>System Operational Modes</span>
              </h3>

              {/* Maintenance Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">System Maintenance Mode</h4>
                  <p className="text-xs text-slate-400">Temporarily restrict player registrations for system maintenance.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  className="text-blue-400 focus:outline-none"
                >
                  {settings.maintenanceMode ? (
                    <ToggleRight className="h-9 w-9 text-red-400" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Auto Approve Free Tournaments */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">Auto-Approve Free Tournaments</h4>
                  <p className="text-xs text-slate-400">Automatically confirm player slots for 0 entry fee matches.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, autoApproveFreeTournaments: !settings.autoApproveFreeTournaments })}
                  className="text-blue-400 focus:outline-none"
                >
                  {settings.autoApproveFreeTournaments ? (
                    <ToggleRight className="h-9 w-9 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Socket Streaming */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white">Real-Time Socket.io Broadcast</h4>
                  <p className="text-xs text-slate-400">Enable real-time chat & push notifications across all user clients.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, socketStreamEnabled: !settings.socketStreamEnabled })}
                  className="text-blue-400 focus:outline-none"
                >
                  {settings.socketStreamEnabled ? (
                    <ToggleRight className="h-9 w-9 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Financial Config Card */}
            <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-slate-700 pb-3 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-emerald-400" />
                <span>Financial & Payment Gateway Configs</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Platform Commission Fee (%)
                  </label>
                  <input
                    type="number"
                    value={settings.platformFeePercentage}
                    onChange={(e) => setSettings({ ...settings, platformFeePercentage: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Default UPI ID for QR Collection
                  </label>
                  <input
                    type="text"
                    value={settings.defaultUPI}
                    onChange={(e) => setSettings({ ...settings, defaultUPI: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-sm font-extrabold bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-500/25"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                <span>Save Platform Configurations</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
