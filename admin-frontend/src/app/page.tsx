'use client';

import React, { useMemo, useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Trophy,
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  CreditCard,
  Layers,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import api from '@/lib/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TournamentData {
  id: string;
  name: string;
  game: string;
  teams: number;
  prizePool: string;
  status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED';
}

const columnHelper = createColumnHelper<TournamentData>();

interface DashboardStats {
  totalUsers: number;
  activeTournaments: number;
  liveMatches: number;
  totalRevenue: number;
  totalPrizeGiven: number;
  profit: number;
  tournamentStatusBreakdown: {
    upcoming: number;
    live: number;
    completed: number;
  };
  monthlyGrowth: {
    labels: string[];
    players: number[];
    tournaments: number[];
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/admin/dashboard-stats');
        setStats(response.data.data);
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const chartData = {
    labels: stats?.monthlyGrowth?.labels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Active Players',
        data: stats?.monthlyGrowth?.players || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#DFE104',
        backgroundColor: 'rgba(223, 225, 4, 0.15)',
        fill: true,
        tension: 0.2,
      },
      {
        label: 'Tournaments Hosted',
        data: stats?.monthlyGrowth?.tournaments || [0, 0, 0, 0, 0, 0, 0],
        borderColor: '#FAFAFA',
        backgroundColor: 'rgba(250, 250, 250, 0.1)',
        fill: true,
        tension: 0.2,
      },
    ],
  };

  const doughnutData = {
    labels: ['Upcoming', 'Live Matches', 'Completed'],
    datasets: [
      {
        data: [
          stats?.tournamentStatusBreakdown?.upcoming || 0,
          stats?.tournamentStatusBreakdown?.live || 0,
          stats?.tournamentStatusBreakdown?.completed || 0
        ],
        backgroundColor: ['#DFE104', '#FAFAFA', '#27272A'],
        borderWidth: 2,
        borderColor: '#3F3F46',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#A1A1AA', font: { family: 'var(--font-mono)' } },
      },
    },
    scales: {
      x: { grid: { color: '#3F3F46' }, ticks: { color: '#A1A1AA', font: { family: 'var(--font-mono)' } } },
      y: { grid: { color: '#3F3F46' }, ticks: { color: '#A1A1AA', font: { family: 'var(--font-mono)' } } },
    },
  };

  const data: TournamentData[] = useMemo(
    () => [],
    []
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: (info) => <span className="font-mono text-[#DFE104] font-bold">{info.getValue()}</span>,
      }),
      columnHelper.accessor('name', {
        header: 'Tournament Name',
        cell: (info) => <span className="font-heading font-extrabold uppercase text-white">{info.getValue()}</span>,
      }),
      columnHelper.accessor('game', {
        header: 'Game',
        cell: (info) => <span className="font-mono uppercase text-[#A1A1AA]">{info.getValue()}</span>,
      }),
      columnHelper.accessor('teams', {
        header: 'Slots',
        cell: (info) => <span className="font-mono">{info.getValue()} Squads</span>,
      }),
      columnHelper.accessor('prizePool', {
        header: 'Prize Pool',
        cell: (info) => <span className="font-mono font-bold text-[#DFE104]">{info.getValue()}</span>,
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const val = info.getValue();
          const color =
            val === 'ACTIVE'
              ? 'bg-[#DFE104] text-black font-extrabold'
              : val === 'UPCOMING'
              ? 'bg-[#27272A] text-[#FAFAFA] border border-[#3F3F46]'
              : 'bg-[#27272A]/50 text-[#A1A1AA]';

          return (
            <span className={`px-2.5 py-1 text-[10px] font-heading font-extrabold uppercase ${color}`}>
              {val}
            </span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="min-h-screen flex bg-[#09090B] text-[#FAFAFA]">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 sm:p-8 w-full overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b-2 border-[#3F3F46] pb-6">
          <div>
            <h2 className="text-4xl font-heading font-extrabold uppercase text-white tracking-tighter">PLATFORM ANALYTICS & KINETIC ENGINE</h2>
            <p className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider mt-1">Real-time metrics, active tournaments, and platform prize settlements.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="kt-card p-6">
            <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-mono text-xs uppercase font-bold">
              <span>Total Registered Users</span>
              <Users className="h-5 w-5 text-[#DFE104]" />
            </div>
            <div className="text-4xl font-heading font-extrabold text-white">
              {loading ? '...' : stats?.totalUsers || 0}
            </div>
            <div className="text-xs font-mono text-[#A1A1AA] mt-2">
              {loading ? 'Loading...' : 'Active players'}
            </div>
          </div>

          <div className="kt-card p-6">
            <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-mono text-xs uppercase font-bold">
              <span>Active Tournaments</span>
              <Trophy className="h-5 w-5 text-[#DFE104]" />
            </div>
            <div className="text-4xl font-heading font-extrabold text-white">
              {loading ? '...' : stats?.activeTournaments || 0}
            </div>
            <div className="text-xs font-mono text-[#A1A1AA] mt-2">
              {loading ? 'Loading...' : 'Upcoming & Live'}
            </div>
          </div>

          <div className="kt-card p-6">
            <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-mono text-xs uppercase font-bold">
              <span>Total Revenue Pool</span>
              <DollarSign className="h-5 w-5 text-[#DFE104]" />
            </div>
            <div className="text-4xl font-heading font-extrabold text-white">
              {loading ? '...' : `₹${stats?.profit || 0}`}
            </div>
            <div className="text-xs font-mono text-[#A1A1AA] mt-2">
              {loading ? 'Loading...' : `Participant: ₹${stats?.totalRevenue || 0} | Prize: ₹${stats?.totalPrizeGiven || 0}`}
            </div>
          </div>

          <div className="kt-card p-6">
            <div className="flex items-center justify-between text-[#A1A1AA] mb-2 font-mono text-xs uppercase font-bold">
              <span>Live Matches</span>
              <Activity className="h-5 w-5 text-[#DFE104]" />
            </div>
            <div className="text-4xl font-heading font-extrabold text-white">
              {loading ? '...' : stats?.liveMatches || 0}
            </div>
            <div className="text-xs font-mono text-[#A1A1AA] mt-2">
              {loading ? 'Loading...' : 'Currently live'}
            </div>
          </div>
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 kt-card p-6">
            <h3 className="text-xl font-heading font-extrabold uppercase text-white mb-4">Platform Player & Tournament Growth</h3>
            <div className="h-72">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="kt-card p-6 flex flex-col justify-between">
            <h3 className="text-xl font-heading font-extrabold uppercase text-white mb-4">Tournament Status Breakdown</h3>
            <div className="h-56 flex items-center justify-center">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { color: '#A1A1AA', font: { family: 'var(--font-mono)' } } } },
                }}
              />
            </div>
          </div>
        </div>

        {/* TanStack Table showcase */}
        <div className="kt-card p-6">
          <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-[#3F3F46]">
            <h3 className="text-xl font-heading font-extrabold uppercase text-white">Recent Tournaments Overview</h3>
            <span className="text-xs font-mono text-[#A1A1AA] font-semibold uppercase">POWERED BY TANSTACK TABLE</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono text-slate-300 border-collapse">
              <thead className="bg-[#27272A] uppercase text-[10px] text-[#DFE104] border-b-2 border-[#3F3F46]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="p-4 font-bold tracking-wider">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-white/5">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-white/5 transition-colors">
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
        </div>
      </main>
    </div>
  );
}
