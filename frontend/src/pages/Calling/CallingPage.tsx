import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  PhoneCall,
  Phone,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Zap,
  Users,
  Search,
  ArrowRight,
  MessageCircle,
  Award,
  Filter,
  UserCheck,
  TrendingUp,
  X,
  Play,
  Square,
  RefreshCw,
  Plus,
  Send,
  Inbox,
  AlertCircle,
  Layers,
  ChevronRight,
  ArrowUpRight,
  SlidersHorizontal,
  Volume2
} from 'lucide-react';

export const CallingPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const isAdminOrManager = ['role-superadmin', 'role-admin', 'role-manager', 'role-leader'].includes(user?.role_id || '');

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'focus' | 'table' | 'team' | 'requests'>('focus');
  const [queue, setQueue] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalAssigned: 100,
    completedToday: 0,
    pendingToday: 100,
    totalCallsMadeToday: 0,
    connectedCalls: 0,
    interestedCalls: 0,
    callbackCalls: 0,
    notAnsweredCalls: 0,
    notInterestedCalls: 0,
    progressPct: 0
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [teamSummary, setTeamSummary] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Employee Lead Request Modal
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestCount, setRequestCount] = useState<number>(100);
  const [requestNotes, setRequestNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Admin Lead Requests List & Approval Modal
  const [leadRequests, setLeadRequests] = useState<any[]>([]);
  const [poolStats, setPoolStats] = useState<any>({ availableUnassignedLeads: 480, pendingRequestsCount: 0 });
  const [selectedReqForApproval, setSelectedReqForApproval] = useState<any>(null);
  const [approvalCount, setApprovalCount] = useState<number>(100);
  const [approvalSource, setApprovalSource] = useState<string>('');
  const [processingApproval, setProcessingApproval] = useState(false);

  // Call Logging state
  const [callOutcome, setCallOutcome] = useState('Interested - Demo Scheduled');
  const [callNotes, setCallNotes] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [expectedValue, setExpectedValue] = useState<number>(1500);
  const [savingCall, setSavingCall] = useState(false);

  // Live Call Timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);
  const timerRef = useRef<any>(null);

  // Manager Direct Batch Assigner Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchUser, setBatchUser] = useState(user?.id || 'user-sales-akash');
  const [batchCount, setBatchCount] = useState(100);
  const [batchSource, setBatchSource] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);

  const fetchQueue = () => {
    setLoading(true);
    api.getTodayCallingQueue({ search, status: statusFilter })
      .then(res => {
        if (res.success) {
          setQueue(res.queue || []);
          setStats(res.stats || {});
          if (res.queue?.length > 0 && currentIndex >= res.queue.length) {
            setCurrentIndex(0);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchRequests = () => {
    api.getLeadRequests()
      .then(res => {
        if (res.success) {
          setLeadRequests(res.requests || []);
          if (res.poolStats) setPoolStats(res.poolStats);
        }
      })
      .catch(console.error);
  };

  const fetchTeamData = () => {
    api.getTeamCallingSummary()
      .then(res => {
        if (res.success) setTeamSummary(res);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchQueue();
    fetchRequests();
    fetchTeamData();
    api.getUsers().then(r => setUsersList(r.users || [])).catch(console.error);
  }, [search, statusFilter]);

  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning]);

  const currentLead = queue[currentIndex] || queue[0];

  useEffect(() => {
    if (currentLead) {
      setExpectedValue(currentLead.expected_value || currentLead.product_price || 1500);
      setCallNotes(currentLead.notes || '');
      setCallSeconds(0);
      setIsTimerRunning(false);
    }
  }, [currentIndex, currentLead?.id]);

  const handleStartTimer = () => setIsTimerRunning(true);
  const handleStopTimer = () => setIsTimerRunning(false);

  const handleSaveAndNext = async (outcomeOverride?: string) => {
    if (!currentLead) return;
    const finalOutcome = outcomeOverride || callOutcome;
    setSavingCall(true);

    try {
      const res = await api.logCallAndUpdateStatus({
        lead_id: currentLead.id,
        call_outcome: finalOutcome,
        duration_seconds: callSeconds > 0 ? callSeconds : 90,
        notes: callNotes,
        followup_date: followupDate || undefined,
        expected_value: expectedValue
      });

      if (res.success) {
        showToast('Call Logged!', `Updated ${currentLead.name} (${finalOutcome}). Ready for next lead.`, 'success');
        setIsTimerRunning(false);
        setCallSeconds(0);
        setFollowupDate('');

        if (currentIndex < queue.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          showToast('Batch Complete!', 'All allocated leads in this queue have been reviewed.', 'success');
        }
        fetchQueue();
        fetchTeamData();
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to log call', 'error');
    } finally {
      setSavingCall(false);
    }
  };

  const handleCreateLeadRequest = async () => {
    setSubmittingRequest(true);
    try {
      const res = await api.createLeadRequest({
        requested_count: requestCount,
        notes: requestNotes
      });
      if (res.success) {
        showToast('Request Sent to Admin', res.message, 'success');
        setRequestModalOpen(false);
        setRequestNotes('');
        fetchRequests();
      }
    } catch (err: any) {
      showToast('Request Failed', err.message, 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleApproveRequest = async (reqId: string) => {
    setProcessingApproval(true);
    try {
      const res = await api.approveLeadRequest(reqId, {
        count: approvalCount,
        source_filter: approvalSource || undefined
      });
      if (res.success) {
        showToast('Leads Allocated!', res.message, 'success');
        setSelectedReqForApproval(null);
        fetchRequests();
        fetchQueue();
        fetchTeamData();
      }
    } catch (err: any) {
      showToast('Approval Error', err.message, 'error');
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleRejectRequest = async (reqId: string) => {
    try {
      const res = await api.rejectLeadRequest(reqId, 'Sufficient leads already active in queue.');
      if (res.success) {
        showToast('Request Rejected', 'Employee notified.', 'info');
        fetchRequests();
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleBatchAssign = async () => {
    setAllocating(true);
    try {
      const res = await api.batchAssignLeads({
        user_id: batchUser,
        count: batchCount,
        source: batchSource || undefined
      });

      if (res.success) {
        showToast('Leads Allocated!', res.message, 'success');
        setBatchModalOpen(false);
        fetchQueue();
        fetchTeamData();
      }
    } catch (e: any) {
      showToast('Allocation Error', e.message, 'error');
    } finally {
      setAllocating(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0');
  };

  const cleanPhoneNumber = (phone: string = '') => phone.replace(/[^0-9+]/g, '');
  const pendingRequestsCount = leadRequests.filter(r => r.status === 'Pending').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <PhoneCall className="w-3.5 h-3.5" />
            <span>High-Velocity Calling Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Daily Call Desk</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Request batches of 100–500 leads, dial prospects, and log 1-click outcome dispositions with instant stage progression.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setRequestModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Request Leads (100–500)</span>
          </button>

          {isAdminOrManager && (
            <button
              onClick={() => setBatchModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Direct Assign</span>
            </button>
          )}

          {/* View Mode Segmented Controls */}
          <div className="flex items-center p-1 bg-black/40 border border-white/[0.08] rounded-xl backdrop-blur-md">
            <button
              onClick={() => setViewMode('focus')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode === 'focus' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white')}
            >
              Rapid Dial
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode === 'table' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white')}
            >
              Queue ({queue.length})
            </button>
            <button
              onClick={() => setViewMode('requests')}
              className={'relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode === 'requests' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white')}
            >
              <span>Lead Requests</span>
              {pendingRequestsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setViewMode('team')}
              className={'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ' + (viewMode === 'team' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white')}
            >
              Team Standup
            </button>
          </div>
        </div>
      </div>

      {/* Target & Metric Progress Banner */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Today's Calling Target</div>
            <div className="text-lg font-bold text-white tracking-tight mt-0.5">
              {stats.completedToday} / {stats.totalAssigned || 100} Leads Contacted Today ({stats.progressPct}%)
            </div>
          </div>
          <div className="sm:text-right">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <Zap className="w-3 h-3 fill-current" />
              <span>Available in Pool: {poolStats.availableUnassignedLeads || 480} Unassigned Leads</span>
            </span>
            <div className="text-[11px] text-slate-400 mt-1">{stats.pendingToday} Pending Calls In Your Active Batch</div>
          </div>
        </div>

        {/* Smooth Progress Bar */}
        <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${Math.min(stats.progressPct || 0, 100)}%` }}
          />
        </div>

        {/* Micro KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Assigned Quota</div>
            <div className="text-base font-bold text-white font-mono mt-0.5">{stats.totalAssigned || 100}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Calls Made</div>
            <div className="text-base font-bold text-indigo-400 font-mono mt-0.5">{stats.totalCallsMadeToday || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Connected</div>
            <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">{stats.connectedCalls || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Interested</div>
            <div className="text-base font-bold text-amber-300 font-mono mt-0.5">{stats.interestedCalls || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Callbacks</div>
            <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">{stats.callbackCalls || 0}</div>
          </div>
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Not Answered</div>
            <div className="text-base font-bold text-rose-400 font-mono mt-0.5">{stats.notAnsweredCalls || 0}</div>
          </div>
        </div>
      </div>

      {/* VIEW: Lead Requests Center */}
      {viewMode === 'requests' && (
        <div className="glass-card p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Inbox className="w-4 h-4 text-indigo-400" />
                <span>Employee Lead Allocation Requests</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Sales representatives submit requests for 100 to 500 leads. Administrators approve and allocate instantly.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                Pool Ready: <b className="text-emerald-400 font-mono">{poolStats.availableUnassignedLeads} Leads</b>
              </div>
              <button
                onClick={fetchRequests}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-colors"
                title="Refresh Requests"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {leadRequests.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              No lead requests submitted yet. Sales executives can click "Request Leads" to request 100–500 leads.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {leadRequests.map(req => (
                <div
                  key={req.id}
                  className={'p-5 rounded-2xl border transition-all space-y-4 ' + (
                    req.status === 'Pending'
                      ? 'bg-[#0E1322] border-indigo-500/30 shadow-lg shadow-indigo-950/20'
                      : req.status === 'Approved'
                      ? 'bg-white/[0.02] border-emerald-500/20 opacity-90'
                      : 'bg-white/[0.01] border-white/[0.05] opacity-60'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={req.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={req.user_name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                      <div>
                        <div className="font-bold text-white text-sm">{req.user_name}</div>
                        <div className="text-[11px] text-indigo-400">{req.team_name || 'Sales Representative'}</div>
                      </div>
                    </div>

                    <span
                      className={'px-2.5 py-1 rounded-full text-xs font-semibold ' + (
                        req.status === 'Pending'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 animate-pulse'
                          : req.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      )}
                    >
                      {req.status === 'Pending' ? 'Pending Approval' : req.status}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Requested Batch:</span>
                      <span className="font-bold text-white font-mono">{req.requested_count} Leads</span>
                    </div>
                    {req.allocated_count > 0 && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Allocated by Admin:</span>
                        <span className="font-bold text-emerald-400 font-mono">{req.allocated_count} Leads</span>
                      </div>
                    )}
                    {req.notes && (
                      <div className="text-slate-400 pt-1.5 border-t border-white/[0.06]">
                        Note: <span className="text-slate-300 italic">"{req.notes}"</span>
                      </div>
                    )}
                  </div>

                  {req.status === 'Pending' && isAdminOrManager && (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedReqForApproval(req);
                          setApprovalCount(req.requested_count || 100);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Allocate {req.requested_count} Leads</span>
                      </button>

                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-white/[0.08] text-xs font-semibold transition-all"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: Rapid Dialing Mode */}
      {viewMode === 'focus' && currentLead && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Lead Focus Profile Card */}
          <div className="lg:col-span-5 glass-card p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-indigo-400 font-semibold">{currentLead.lead_code}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
                    Lead {currentIndex + 1} of {queue.length}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {currentLead.status}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{currentLead.name}</h2>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <span>Source: <b className="text-indigo-300">{currentLead.source}</b></span>
                  <span>•</span>
                  <span>Campaign: <span className="font-mono text-slate-300">{currentLead.campaign || 'Direct Ad'}</span></span>
                </div>
              </div>

              {/* Phone Dial Panel */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Prospect Phone</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {currentLead.priority} Priority
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono tracking-wider">
                  {currentLead.phone}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <a
                    href={'tel:' + cleanPhoneNumber(currentLead.phone)}
                    onClick={handleStartTimer}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Dial Phone</span>
                  </a>

                  <a
                    href={'https://api.whatsapp.com/send?phone=' + cleanPhoneNumber(currentLead.phone).replace('+', '') + '&text=' + encodeURIComponent('Namaste ' + currentLead.name + ', this is regarding your inquiry on ' + (currentLead.product_name || 'Sacred Yantra & Astrological Products') + '.')}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold text-xs transition-all active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Product Info & Notes */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 text-xs">
                <div className="text-slate-400">
                  Interested Product: <b className="text-white">{currentLead.product_name || 'Bagalamukhi Yantra'}</b>
                </div>
                <div className="text-slate-400">
                  Unit Price: <b className="text-emerald-400 font-mono">₹{Number(currentLead.product_price || currentLead.expected_value || 1500).toLocaleString('en-IN')}</b>
                </div>
                {currentLead.notes && (
                  <div className="text-slate-400 pt-1.5 border-t border-white/[0.06]">
                    History Note: <span className="text-slate-300 italic">{currentLead.notes}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stepper Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] disabled:opacity-30 transition-colors"
              >
                ← Previous
              </button>

              <span className="text-slate-400 font-mono text-xs">
                {currentIndex + 1} / {queue.length}
              </span>

              <button
                disabled={currentIndex >= queue.length - 1}
                onClick={() => setCurrentIndex(prev => Math.min(prev + 1, queue.length - 1))}
                className="px-3.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] disabled:opacity-30 transition-colors"
              >
                Skip Lead →
              </button>
            </div>
          </div>

          {/* Right: Live Call Logging & Disposition Deck */}
          <div className="lg:col-span-7 glass-card p-6 space-y-5">
            {/* Live Call Duration Equalizer Panel */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/[0.08]">
              <div className="flex items-center gap-3.5">
                <div className={'p-3 rounded-xl transition-all ' + (isTimerRunning ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-lg shadow-rose-950/30' : 'bg-white/[0.04] text-slate-400 border border-white/[0.08]')}>
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Call Duration</span>
                    {isTimerRunning && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live In-Call
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-white font-mono tracking-wider mt-0.5">
                    {formatTimer(callSeconds)}
                  </div>
                </div>
              </div>

              {/* Animated Equalizer Waveform while in call */}
              {isTimerRunning && (
                <div className="hidden sm:flex items-center gap-1 h-6 px-3">
                  <div className="w-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s] h-5" />
                  <div className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s] h-3" />
                  <div className="w-1 bg-purple-400 rounded-full animate-bounce h-6" />
                  <div className="w-1 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.2s] h-4" />
                  <div className="w-1 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.35s] h-5" />
                </div>
              )}

              <div className="flex items-center gap-2">
                {!isTimerRunning ? (
                  <button
                    onClick={handleStartTimer}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Timer</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopTimer}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>End Timer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Outcome Selection Grid */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Call Outcome (1-Click Status Update)
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { id: 'Interested - Demo Scheduled', label: '🌟 Interested — Demo / Order' },
                  { id: 'Quotation Requested', label: '📄 Quotation / Pricing Requested' },
                  { id: 'Busy - Callback Scheduled', label: '⏰ Busy — Callback Scheduled' },
                  { id: 'Not Answered / Switched Off', label: '📵 Not Answered / Ringing / Off' },
                  { id: 'Not Interested / Junk Number', label: '🚫 Not Interested / Lost' },
                  { id: 'Connected - Followup Required', label: '💬 In Discussion — Reviewing' },
                ].map(opt => {
                  const isSelected = callOutcome === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCallOutcome(opt.id)}
                      className={'p-3 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between ' + (
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-white/[0.02] text-slate-300 border-white/[0.06] hover:bg-white/[0.05]'
                      )}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Followup Date Picker (Conditional) */}
            {(callOutcome.includes('Callback') || callOutcome.includes('Demo') || callOutcome.includes('Followup')) && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2 animate-fade-in">
                <label className="block text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Callback Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={followupDate}
                  onChange={e => setFollowupDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#07090E]/90 border border-amber-500/40 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 shadow-inner"
                />
              </div>
            )}

            {/* Notes Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Call Notes & Discussion Summary
              </label>
              <textarea
                rows={4}
                placeholder="Log customer specifics, preferred delivery address, delivery date..."
                value={callNotes}
                onChange={e => setCallNotes(e.target.value)}
                className="w-full p-3.5 bg-[#07090E]/90 border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed resize-none shadow-inner"
              />
            </div>

            {/* Submit & Next Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSaveAndNext()}
                disabled={savingCall}
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
              >
                <span>{savingCall ? 'Saving Call Record...' : 'Save Disposition & Next Lead'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Full Queue Table View */}
      {viewMode === 'table' && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search leads in active batch..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                className="glass-input"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-black/40 border border-white/[0.08] rounded-xl text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Lead Statuses</option>
              <option value="New">New Uncalled Leads</option>
              <option value="Interested">Interested</option>
              <option value="Follow-up">Follow-up / Callbacks</option>
              <option value="Contacted">Contacted</option>
              <option value="Lost">Not Interested / Lost</option>
            </select>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">Lead ID & Name</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Product Interest</th>
                <th className="p-4">Calls Logged</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {queue.map((lead, idx) => (
                <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{lead.name}</div>
                    <div className="font-mono text-[10px] text-slate-400">{lead.lead_code}</div>
                  </td>
                  <td className="p-4 font-mono text-indigo-300 font-semibold">{lead.phone}</td>
                  <td className="p-4 text-slate-300">{lead.source}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{lead.product_name || 'Bagalamukhi Yantra'}</td>
                  <td className="p-4 font-mono font-bold text-white">{lead.call_count || 0} calls</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => {
                        setCurrentIndex(idx);
                        setViewMode('focus');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
                    >
                      Dial & Log
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 3: Team Standup View */}
      {viewMode === 'team' && teamSummary && (
        <div className="glass-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div>
              <h3 className="text-base font-bold text-white">Daily Team Telecalling Roster</h3>
              <p className="text-xs text-slate-400">Total calls completed today per sales representative</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Team Total Calls Today</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">{teamSummary.totalTeamCallsToday} Calls</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamSummary.executives?.map((exec: any) => (
              <div key={exec.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={exec.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={exec.name}
                    className="w-10 h-10 rounded-xl object-cover border border-white/10"
                  />
                  <div>
                    <div className="font-bold text-white text-sm">{exec.name}</div>
                    <div className="text-[10px] text-indigo-400">{exec.team_name || 'Sales Pod'}</div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs pt-2 border-t border-white/[0.06]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Calls Done Today:</span>
                    <span className="font-bold text-emerald-400 font-mono">{exec.calls_completed_today} Calls</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Allocated Quota:</span>
                    <span className="font-semibold text-white font-mono">{exec.total_assigned} Leads</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Interested Leads:</span>
                    <span className="font-bold text-amber-300 font-mono">{exec.interested_today} Leads</span>
                  </div>
                </div>

                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.min(exec.completion_pct || 0, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Employee Requests Leads from Admin (100 - 500 Leads) */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Request Leads from Admin</h3>
              </div>
              <button onClick={() => setRequestModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Select how many uncontacted leads you need for today's calling queue (100 to 500). Admin will review and allocate them to your desk immediately.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Choose Lead Batch Size</label>
              <div className="grid grid-cols-4 gap-2">
                {[100, 200, 300, 500].map(cnt => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setRequestCount(cnt)}
                    className={'py-2.5 rounded-xl font-bold text-xs border transition-all ' + (
                      requestCount === cnt
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-md shadow-emerald-600/30'
                        : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:border-white/20'
                    )}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Optional Note for Admin</label>
              <textarea
                rows={2}
                placeholder="e.g. Ready for today's Facebook Yantra leads / morning shift..."
                value={requestNotes}
                onChange={e => setRequestNotes(e.target.value)}
                className="glass-input text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setRequestModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateLeadRequest}
                disabled={submittingRequest}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submittingRequest ? 'Sending...' : `Send Request for ${requestCount} Leads`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Admin Approval & Custom Allocation Modal */}
      {selectedReqForApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Approve & Allocate Leads</h3>
              </div>
              <button onClick={() => setSelectedReqForApproval(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-1 text-xs">
              <div className="font-bold text-white text-sm">{selectedReqForApproval.user_name}</div>
              <div className="text-slate-400">Team: {selectedReqForApproval.team_name || 'Sales Rep'}</div>
              <div className="text-indigo-400 font-semibold">Requested: {selectedReqForApproval.requested_count} Leads</div>
              {selectedReqForApproval.notes && (
                <div className="text-slate-300 italic pt-1 border-t border-white/[0.06]">"{selectedReqForApproval.notes}"</div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Leads to Allocate (100 to 500)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 200, 300, 500].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setApprovalCount(cnt)}
                      className={'py-2 rounded-xl font-bold text-xs border ' + (
                        approvalCount === cnt
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-white/[0.03] text-slate-300 border-white/[0.08]'
                      )}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Filter by Inbound Source</label>
                <select
                  value={approvalSource}
                  onChange={e => setApprovalSource(e.target.value)}
                  className="glass-input text-xs"
                >
                  <option value="">All Available Sources</option>
                  <option value="Facebook">Facebook Ads</option>
                  <option value="Instagram">Instagram Ads</option>
                  <option value="Website">Website Inbound</option>
                  <option value="WhatsApp">WhatsApp Inbound</option>
                  <option value="Google">Google Search</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedReqForApproval(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproveRequest(selectedReqForApproval.id)}
                disabled={processingApproval}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{processingApproval ? 'Allocating...' : `Confirm & Allocate ${approvalCount} Leads`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Direct Admin Batch Assigner */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Admin Direct Lead Assigner</h3>
              </div>
              <button onClick={() => setBatchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Sales Employee *</label>
                <select
                  value={batchUser}
                  onChange={e => setBatchUser(e.target.value)}
                  className="glass-input text-xs"
                >
                  {usersList.map(u => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.name} ({u.role_name || u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Count</label>
                  <select
                    value={batchCount}
                    onChange={e => setBatchCount(Number(e.target.value))}
                    className="glass-input text-xs"
                  >
                    <option value={50} className="bg-slate-900 text-white">50 Leads</option>
                    <option value={100} className="bg-slate-900 text-white">100 Leads (Standard)</option>
                    <option value={200} className="bg-slate-900 text-white">200 Leads</option>
                    <option value={500} className="bg-slate-900 text-white">500 Leads (Full Shift)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source Channel</label>
                  <select
                    value={batchSource}
                    onChange={e => setBatchSource(e.target.value)}
                    className="glass-input text-xs"
                  >
                    <option value="" className="bg-slate-900 text-white">All Sources</option>
                    <option value="Facebook" className="bg-slate-900 text-white">Facebook Ads</option>
                    <option value="Instagram" className="bg-slate-900 text-white">Instagram Ads</option>
                    <option value="Website" className="bg-slate-900 text-white">Website Inbound</option>
                    <option value="WhatsApp" className="bg-slate-900 text-white">WhatsApp Inbound</option>
                    <option value="Google" className="bg-slate-900 text-white">Google Search</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setBatchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchAssign}
                disabled={allocating}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/25 disabled:opacity-50 active:scale-95"
              >
                {allocating ? 'Allocating...' : `Assign ${batchCount} Leads Today`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

