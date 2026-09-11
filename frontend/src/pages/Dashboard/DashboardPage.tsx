import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import confetti from 'canvas-confetti';
import {
  TrendingUp,
  Users,
  CreditCard,
  AlertTriangle,
  Award,
  CheckCircle2,
  Calendar,
  ArrowUpRight,
  Sparkles,
  PhoneCall,
  Send,
  Zap,
  Package,
  Plus,
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

export const DashboardPage: React.FC<{
  onOpenNewLead?: () => void;
  onOpenNewSale?: () => void;
  onOpenNewPayment?: () => void;
}> = ({ onOpenNewLead, onOpenNewSale, onOpenNewPayment }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { showToast, setLowStockAlertProduct } = useNotifications();

  useEffect(() => {
    api.getDashboardAnalytics()
      .then(res => {
        if (res.success) {
          setData(res);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const triggerCelebration = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    showToast('Top Performer Celebrated!', 'Akash Neelgund holds 1st place with 125% target achievement!', 'success');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading NEXORA Sales Intelligence...</span>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const leaderboard = data?.leaderboard || [];
  const salesByDay = data?.salesByDay || [];
  const salesByTeam = data?.salesByTeam || [];
  const leadsBySource = data?.leadsBySource || [];
  const lowStockItems = data?.lowStockItems || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Sales Intelligence Command</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Executive Overview</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time revenue metrics, conversion pipeline & team leaderboards</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenNewLead && (
            <button
              onClick={onOpenNewLead}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>
          )}
          {onOpenNewSale && (
            <button
              onClick={onOpenNewSale}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
          )}
          <button
            onClick={triggerCelebration}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Celebrate Leader</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Bar if any */}
      {lowStockItems.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-200">
                Inventory Stock Alarm: {lowStockItems.length} Products Below Minimum Stock Threshold
              </h4>
              <p className="text-[11px] text-amber-400/80 mt-0.5">
                Includes {lowStockItems[0]?.name} ({lowStockItems[0]?.stock} units remaining, minimum {lowStockItems[0]?.min_stock}).
              </p>
            </div>
          </div>
          <button
            onClick={() => setLowStockAlertProduct(lowStockItems[0])}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors shadow-md active:scale-95"
          >
            Review Stock Alarms
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">₹{Number(kpis.todaySales || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <span>+18.4% vs yesterday</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Month Closed</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">₹{Number(kpis.monthlySales || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-indigo-400 font-medium mt-1">
            Target: ₹1.5 Cr ({kpis.targetAchievement || 0}%)
          </div>
        </div>

        {/* Active Leads & Conversions */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Pipeline</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono tracking-tight">{kpis.totalLeads || 0} Leads</div>
          <div className="text-[11px] text-blue-400 font-medium mt-1">
            {kpis.wonLeads || 0} Deals Won ({kpis.conversionRate || 0}% Conv.)
          </div>
        </div>

        {/* Pending Balance */}
        <div className="glass-card p-5 relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Balances</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono tracking-tight">₹{Number(kpis.pendingPayments || 0).toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-amber-400/80 font-medium mt-1">
            Active in Collections Desk
          </div>
        </div>
      </div>

      {/* Main Charts & Live Leaderboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Revenue Trend Area Chart */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Sales Revenue Velocity (Last 7 Days)</h3>
              <p className="text-xs text-slate-400">Daily net closed revenue in ₹ INR</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByDay}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0C101A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(10px)' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Top Performers Celebration Leaderboard */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Top Performers</h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Live Standings
            </span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-72 flex-1 pr-1">
            {leaderboard.slice(0, 5).map((rep: any, idx: number) => {
              const rankPill = idx === 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : idx === 1 ? 'bg-slate-300/20 text-slate-200 border-slate-300/30' : idx === 2 ? 'bg-amber-700/20 text-amber-500 border-amber-700/30' : 'bg-white/[0.04] text-slate-400 border-white/[0.08]';
              const rankLabel = idx === 0 ? '1st' : idx === 1 ? '2nd' : idx === 2 ? '3rd' : `${idx + 1}th`;

              return (
                <div
                  key={rep.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border font-mono ${rankPill}`}>
                      {rankLabel}
                    </span>
                    <img
                      src={rep.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={rep.name}
                      className="w-8 h-8 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{rep.name}</div>
                      <div className="text-[10px] text-indigo-400">{rep.team_name || 'Sales Rep'}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400 font-mono">₹{Number(rep.sales || 0).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-slate-400">{rep.achievement_pct || 100}% target</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Row: Sales by Team & Lead Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Team Sales Comparison */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-bold text-white tracking-tight mb-0.5">Sales by Pod Team</h3>
          <p className="text-xs text-slate-400 mb-4">Total revenue generated per team</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByTeam}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0C101A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(10px)' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                />
                <Bar dataKey="sales" fill="#818cf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Breakdown */}
        <div className="glass-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight mb-0.5">Inbound Lead Attribution</h3>
            <p className="text-xs text-slate-400 mb-2">Meta Ads, Website, WhatsApp & Outbound</p>
          </div>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadsBySource}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {leadsBySource.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0C101A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', backdropFilter: 'blur(10px)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

