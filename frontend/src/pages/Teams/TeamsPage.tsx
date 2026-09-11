import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Team } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  UsersRound,
  Award,
  TrendingUp,
  Target,
  Send,
  Plus,
  CheckCircle2,
  Calendar,
  X,
  FileText
} from 'lucide-react';

export const TeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('team-alpha');
  const [teamDashboard, setTeamDashboard] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const { showToast } = useNotifications();

  // Daily Report submission state
  const [reportSales, setReportSales] = useState(340000);
  const [reportOrders, setReportOrders] = useState(14);
  const [reportLeads, setReportLeads] = useState(28);
  const [reportConversions, setReportConversions] = useState(8);
  const [reportPending, setReportPending] = useState(45000);
  const [reportNotes, setReportNotes] = useState('Team Alpha achieved 85% of daily target. Akash led with 3 major POS deals.');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getTeams()
      .then(res => {
        if (res.success) {
          setTeams(res.teams || []);
          if (res.teams?.length > 0) {
            setSelectedTeamId(res.teams[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTeamId) return;
    api.getTeamDashboard(selectedTeamId)
      .then(res => {
        if (res.success) setTeamDashboard(res);
      })
      .catch(console.error);
  }, [selectedTeamId]);

  const handleSubmitDailyReport = async () => {
    setSubmittingReport(true);
    try {
      const res = await api.submitDailyReport({
        team_id: selectedTeamId,
        total_sales: reportSales,
        total_orders: reportOrders,
        new_leads: reportLeads,
        conversions: reportConversions,
        pending_payments: reportPending,
        notes: reportNotes
      });

      if (res.success) {
        showToast('Daily Report Submitted!', 'Logged and formatted for end-of-day WhatsApp dispatch.', 'success');
        setShowReportModal(false);
      }
    } catch (e: any) {
      showToast('Report Error', e.message || 'Failed to submit report', 'error');
    } finally {
      setSubmittingReport(false);
    }
  };

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
  const members = teamDashboard?.members || [];
  const reports = teamDashboard?.reports || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <UsersRound className="w-3.5 h-3.5" />
            <span>Sales Hierarchy & Pod Management</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales Pods & Teams</h1>
          <p className="text-xs text-slate-400 mt-0.5">Multi-team hierarchy, pod leaderboards, and daily standup submissions</p>
        </div>

        <button
          onClick={() => setShowReportModal(true)}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          <FileText className="w-4 h-4" />
          <span>Submit Daily Team Report</span>
        </button>
      </div>

      {/* Team Pods Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {teams.map(t => {
          const isSelected = t.id === selectedTeamId;
          return (
            <div
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-indigo-600/15 border-indigo-500/50 shadow-lg shadow-indigo-600/15 scale-[1.02]'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-white">{t.name}</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  {t.code}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">Leader: <span className="text-slate-200 font-semibold">{t.leader_name}</span></div>
              <div className="mt-3 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-slate-500">Target</span>
                <span className="font-bold text-emerald-400 font-mono">₹{(t.target_monthly / 100000).toFixed(1)}L</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Team Pod Deep Dive */}
      {selectedTeam && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Pod Summary & KPI */}
          <div className="glass-card p-5 space-y-4 h-fit">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-lg">
                {selectedTeam.name[5]}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{selectedTeam.name} Pod</h3>
                <p className="text-xs text-slate-400">Leader: {selectedTeam.leader_name} ({selectedTeam.leader_email})</p>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-white/[0.08] text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Monthly Target:</span>
                <span className="font-bold text-white font-mono text-sm">₹{Number(selectedTeam.target_monthly).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pod Members:</span>
                <span className="font-semibold text-indigo-400">{members.length} Sales Executives</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Routing Rule:</span>
                <span className="font-mono text-slate-300">Facebook Leads & Cloud SKU</span>
              </div>
            </div>
          </div>

          {/* Right: Pod Member Performance Roster */}
          <div className="lg:col-span-2 glass-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Pod Member Leaderboard & Targets</span>
            </h3>

            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {members.map((mem: any, i: number) => (
                <div
                  key={mem.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 w-4 font-mono">#{i + 1}</span>
                    <img
                      src={mem.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={mem.name}
                      className="w-8 h-8 rounded-xl object-cover border border-white/[0.1]"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{mem.name}</div>
                      <div className="text-[10px] text-slate-400">{mem.email}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400 font-mono">₹{Number(mem.total_sales || 0).toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-indigo-400 font-mono">Target: ₹{Number(mem.target_monthly || 100000).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit Daily Team Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Submit Daily Team Sales Report</h3>
                <p className="text-xs text-slate-400">Will be consolidated into the daily 8:30 PM WhatsApp digest</p>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Today's Sales Revenue (₹)</label>
                  <input
                    type="number"
                    value={reportSales}
                    onChange={e => setReportSales(Number(e.target.value))}
                    className="glass-input text-xs font-mono font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Orders Closed</label>
                  <input
                    type="number"
                    value={reportOrders}
                    onChange={e => setReportOrders(Number(e.target.value))}
                    className="glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">New Leads Processed</label>
                  <input
                    type="number"
                    value={reportLeads}
                    onChange={e => setReportLeads(Number(e.target.value))}
                    className="glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Conversions Won</label>
                  <input
                    type="number"
                    value={reportConversions}
                    onChange={e => setReportConversions(Number(e.target.value))}
                    className="glass-input text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Team Leader Notes & Highlights</label>
                <textarea
                  rows={3}
                  value={reportNotes}
                  onChange={e => setReportNotes(e.target.value)}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDailyReport}
                disabled={submittingReport}
                className="btn-primary px-5 py-2.5 text-xs font-bold disabled:opacity-50"
              >
                {submittingReport ? 'Submitting...' : 'Submit Daily Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
