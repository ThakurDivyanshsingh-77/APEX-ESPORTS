'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Users, Search, Shield, CheckCircle, AlertCircle, Ban, Loader2, RefreshCw } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import api from '@/lib/api';

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gameName?: string;
  gameUID?: string;
  role: 'PLAYER' | 'ORGANIZER' | 'ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  createdAt: string;
}

const columnHelper = createColumnHelper<AdminUser>();

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // Auto-refresh every 5 seconds to show newly registered users live
    const pollInterval = setInterval(fetchUsers, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleRoleChange = async (userId: string, newRole: string, userName: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, role: newRole as any } : u))
      );
      setFeedback({ type: 'success', text: `Role for ${userName} updated to ${newRole}.` });
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update user role.' });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string, userName: string, userEmail: string) => {
    try {
      await api.patch(`/admin/users/${userId}`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus as any } : u))
      );
      if (newStatus === 'BANNED') {
        setFeedback({
          type: 'success',
          text: `User "${userName}" (${userEmail}) has been BANNED. Email is restricted from login and new account registrations!`,
        });
      } else {
        setFeedback({
          type: 'success',
          text: `User "${userName}" has been UNBANNED. Account restored to ACTIVE status.`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: 'Failed to update user account status.' });
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.gameName && u.gameName.toLowerCase().includes(q)) ||
        u.status.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'User Profile',
        cell: (info) => (
          <div>
            <div className="font-bold text-white text-sm">{info.getValue()}</div>
            <div className="text-xs text-slate-400 font-mono">{info.row.original.email}</div>
          </div>
        ),
      }),
      columnHelper.accessor('gameName', {
        header: 'In-Game Identity',
        cell: (info) => (
          <div>
            <div className="font-semibold text-blue-400 text-sm">{info.getValue() || 'Not Set'}</div>
            <div className="text-xs text-slate-400 font-mono">UID: {info.row.original.gameUID || 'N/A'}</div>
          </div>
        ),
      }),
      columnHelper.accessor('phone', {
        header: 'Phone Number',
        cell: (info) => <span className="text-slate-300 font-mono text-xs">{info.getValue()}</span>,
      }),
      columnHelper.accessor('role', {
        header: 'User Role',
        cell: (info) => {
          const role = info.getValue();
          return (
            <select
              value={role}
              onChange={(e) => handleRoleChange(info.row.original._id, e.target.value, info.row.original.name)}
              className="bg-slate-950 border border-slate-700 text-xs font-bold text-blue-400 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              <option value="PLAYER">PLAYER</option>
              <option value="ORGANIZER">ORGANIZER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Moderation Status',
        cell: (info) => {
          const status = info.getValue();
          const isBanned = status === 'BANNED';
          const colorMap = {
            ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            BANNED: 'bg-red-500/10 text-red-400 border-red-500/30',
            SUSPENDED: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          };
          return (
            <div className="flex items-center space-x-2">
              <span className={`px-2.5 py-1 text-xs font-extrabold rounded-md border ${colorMap[status]}`}>
                {status}
              </span>
              <button
                onClick={() =>
                  handleStatusChange(
                    info.row.original._id,
                    isBanned ? 'ACTIVE' : 'BANNED',
                    info.row.original.name,
                    info.row.original.email
                  )
                }
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  isBanned
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30'
                    : 'bg-red-600/20 text-red-400 border border-red-500/40 hover:bg-red-600/30'
                }`}
                title={isBanned ? 'Unban User Account' : 'Ban User Account (Block Login & Signup)'}
              >
                {isBanned ? 'UNBAN' : 'BAN USER'}
              </button>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100">
      <AdminSidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Users className="h-7 w-7 text-blue-500" />
              <span>Users & Teams Moderation Hub</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">Manage registered players, assign admin roles, and enforce permanent email bans.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              title="Refresh Users"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <div className="relative w-64">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search user, email or status..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full"
              />
            </div>
          </div>
        </div>

        {/* Status Feedback Banner */}
        {feedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-semibold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
              <span>{feedback.text}</span>
            </div>
            <button onClick={() => setFeedback(null)} className="text-xs hover:underline text-slate-400">Dismiss</button>
          </div>
        )}

        {/* User Statistics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl">
            <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Total Registered Users</span>
            <span className="text-2xl font-bold text-white">{users.length}</span>
            <span className="text-xs text-blue-400 block mt-1">Live Database Users</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl">
            <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Active Gamers</span>
            <span className="text-2xl font-bold text-emerald-400">
              {users.filter((u) => u.status === 'ACTIVE').length}
            </span>
            <span className="text-xs text-emerald-400/80 block mt-1">Unrestricted Access</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl">
            <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Banned Accounts</span>
            <span className="text-2xl font-bold text-red-400">
              {users.filter((u) => u.status === 'BANNED').length}
            </span>
            <span className="text-xs text-red-400/80 block mt-1">Restricted Email IDs</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-xl">
            <span className="text-xs font-semibold uppercase text-slate-400 block mb-1">Organizers & Admins</span>
            <span className="text-2xl font-bold text-purple-400">
              {users.filter((u) => u.role === 'ADMIN' || u.role === 'ORGANIZER').length}
            </span>
            <span className="text-xs text-purple-400/80 block mt-1">Elevated Permissions</span>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
              <span className="text-xs">Loading registered users...</span>
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
    </div>
  );
}
