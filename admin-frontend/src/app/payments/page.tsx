'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { CreditCard, Search, Eye, CheckCircle, XCircle, Loader2, X, AlertCircle, RefreshCw } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import api from '@/lib/api';

export interface AdminPayment {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    gameName?: string;
    gameUID?: string;
  };
  tournament: {
    _id: string;
    title: string;
    entryFee: number;
    prizePool: string;
  };
  amount: number;
  utr: string;
  image: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  remarks?: string;
  createdAt: string;
}

const columnHelper = createColumnHelper<AdminPayment>();

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState('Invalid UTR or screenshot proof');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/pending');
      setPayments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch pending payments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
    // Bug Fix #8: Auto-refresh every 30 seconds so new submissions appear without page reload
    const pollInterval = setInterval(fetchPendingPayments, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.patch(`/payments/${id}/approve`);
      setFeedback({ type: 'success', text: 'Payment approved! Player slot confirmed.' });
      fetchPendingPayments();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to approve payment.' });
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingPaymentId) return;

    try {
      await api.patch(`/payments/${rejectingPaymentId}/reject`, {
        remarks: rejectRemarks,
      });
      setFeedback({ type: 'success', text: 'Payment submission rejected.' });
      setRejectingPaymentId(null);
      fetchPendingPayments();
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to reject payment.' });
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.user?.name || 'Player', {
        id: 'player',
        header: 'Player & Contact',
        cell: (info) => (
          <div>
            <div className="font-bold text-white text-sm">{info.getValue()}</div>
            <div className="text-xs text-blue-400 font-semibold">{info.row.original.user?.email}</div>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.tournament?.title || 'Tournament', {
        id: 'tournament',
        header: 'Tournament',
        cell: (info) => <span className="font-semibold text-slate-200 text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('utr', {
        header: 'UTR Number',
        cell: (info) => <span className="font-mono text-blue-400 font-bold text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => <span className="font-bold text-emerald-400 text-sm">${info.getValue()}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          return (
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
              {status}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Verification Actions',
        cell: (info) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedProofUrl(info.row.original.image)}
              className="p-1.5 rounded bg-slate-800 text-blue-400 hover:bg-slate-700 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="View Payment Screenshot"
            >
              <Eye className="h-4 w-4" />
              <span>Proof</span>
            </button>
            <button
              onClick={() => handleApprove(info.row.original._id)}
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => {
                setRejectingPaymentId(info.row.original._id);
                setRejectRemarks('Invalid UTR or screenshot proof');
              }}
              className="px-3 py-1 rounded bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 font-bold text-xs transition-colors flex items-center gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span>Reject</span>
            </button>
          </div>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <CreditCard className="h-7 w-7 text-emerald-500" />
              <span>Pending Payment Verifications</span>
              {payments.length > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                  {payments.length} Pending
                </span>
              )}
            </h2>
            <p className="text-sm text-slate-400 mt-1">Verify 12-digit UTR numbers and transaction screenshot receipts. Auto-refreshes every 30s.</p>
          </div>
          <button
            onClick={fetchPendingPayments}
            className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors self-start"
            title="Refresh Payments"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
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

        {/* Pending Payments Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
              <span className="text-xs">Loading pending payment submissions...</span>
            </div>
          ) : payments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm border border-slate-800 rounded-xl">
              <span>No pending payment submissions awaiting verification.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="bg-slate-900/60 uppercase text-xs text-slate-400 border-b border-slate-700">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="p-4 font-semibold">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-700/30 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Proof Lightbox Modal */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 relative">
            <button
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Payment Screenshot Proof Receipt</h3>
            <img src={selectedProofUrl} alt="Payment Proof" className="w-full h-80 object-cover rounded-xl border border-slate-700" />
          </div>
        </div>
      )}

      {/* Reject Remarks Modal */}
      {rejectingPaymentId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setRejectingPaymentId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2">Reject Payment Submission</h3>
            <p className="text-xs text-slate-400 mb-4">Specify the reason for rejection to notify the player.</p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Rejection Reason</label>
                <textarea
                  rows={3}
                  required
                  value={rejectRemarks}
                  onChange={(e) => setRejectRemarks(e.target.value)}
                  placeholder="e.g. UTR number not found in bank records"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectingPaymentId(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-lg bg-red-600 hover:bg-red-500 text-white"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
