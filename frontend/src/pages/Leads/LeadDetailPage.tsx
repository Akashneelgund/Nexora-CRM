import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Lead } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  Building,
  Plus,
  MessageSquare,
  FileText,
  UserPlus,
  Zap,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

const STATUS_STEPS = ['New', 'Contacted', 'Interested', 'Qualified', 'Quotation', 'Negotiation', 'Won'];

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'calls' | 'followups'>('timeline');
  const [newNote, setNewNote] = useState('');
  const [newFollowupType, setNewFollowupType] = useState('Call');
  const [newFollowupDate, setNewFollowupDate] = useState('');
  const [newFollowupNotes, setNewFollowupNotes] = useState('');
  const [converting, setConverting] = useState(false);
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const fetchLeadDetails = () => {
    if (!id) return;
    setLoading(true);
    api.getLeadById(id)
      .then(res => {
        if (res.success && res.lead) setLead(res.lead);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await api.updateLeadStatus(id, newStatus, `Updated status to ${newStatus}`);
      showToast('Status Updated', `Lead status progressed to ${newStatus}`, 'success');
      fetchLeadDetails();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleAddNote = async () => {
    if (!id || !newNote.trim()) return;
    try {
      await api.addLeadNote(id, newNote);
      showToast('Note Added', 'Note attached to lead history', 'success');
      setNewNote('');
      fetchLeadDetails();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleScheduleFollowup = async () => {
    if (!id || !newFollowupDate) return;
    try {
      await api.scheduleFollowup(id, {
        followup_type: newFollowupType,
        scheduled_at: newFollowupDate,
        notes: newFollowupNotes,
        reminder_minutes: 30
      });
      showToast('Follow-up Scheduled', 'Reminder registered successfully', 'success');
      setNewFollowupNotes('');
      fetchLeadDetails();
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleConvertToCustomer = async () => {
    if (!lead) return;
    setConverting(true);
    try {
      const res = await api.convertLeadToCustomer({
        lead_id: lead.id,
        company: `${lead.name} Retail Outlet`,
        address: 'Bangalore Central, Karnataka'
      });
      if (res.success) {
        const code = res.customerCode || res.customer?.customer_code || '';
        showToast('Converted to Customer!', `Customer account ${code} created successfully.`, 'success');
        navigate('/customers');
      }
    } catch (e: any) {
      showToast('Conversion Error', e.message, 'error');
    } finally {
      setConverting(false);
    }
  };

  if (loading || !lead) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(lead.status);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Back Button & Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/leads')}
          className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-indigo-400 font-semibold">{lead.lead_code}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 font-semibold">
              {lead.source}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{lead.name}</h1>
        </div>

        <div className="ml-auto flex items-center gap-2.5">
          <button
            onClick={handleConvertToCustomer}
            disabled={converting}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{converting ? 'Converting...' : 'Convert to Customer'}</span>
          </button>
        </div>
      </div>

      {/* Visual Pipeline Progression Bar */}
      <div className="glass-card p-5 overflow-x-auto">
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pipeline Progression Stage
        </div>
        <div className="flex items-center justify-between min-w-[600px] gap-2">
          {STATUS_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx > idx;
            const isCurrent = lead.status === step;

            return (
              <button
                key={step}
                onClick={() => handleStatusChange(step)}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30 scale-105'
                    : isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:text-slate-200'
                }`}
              >
                <span>{step}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid: Left Lead Profile Info & Right Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Profile Panel */}
        <div className="glass-card p-5 space-y-4 h-fit">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Lead Profile Details</h3>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-slate-400">Phone Contact</span>
              <div className="text-white font-mono font-medium flex items-center gap-1.5 mt-1">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lead.phone}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400">Email Address</span>
              <div className="text-white font-medium flex items-center gap-1.5 mt-1">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lead.email || 'None provided'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400">Expected Value</span>
              <div className="text-emerald-400 font-bold font-mono text-base mt-1">
                ₹{Number(lead.expected_value || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div>
              <span className="text-slate-400">Assigned Sales Rep</span>
              <div className="text-white font-semibold flex items-center gap-1.5 mt-1">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>{lead.assigned_user_name || 'Unassigned'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400">Interested Product</span>
              <div className="text-white font-medium mt-1">
                {lead.product_name || 'Bagalamukhi Yantra'}
              </div>
            </div>

            <div>
              <span className="text-slate-400">Campaign Attribution</span>
              <div className="text-slate-300 font-mono text-[11px] mt-1">
                {lead.campaign || 'Organic Direct'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Tabbed History & Logs */}
        <div className="lg:col-span-2 glass-card p-5 flex flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 mb-4">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'timeline' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Activity Timeline ({lead.activities?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'notes' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Notes ({lead.notesList?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('calls')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'calls' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Calls ({lead.calls?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('followups')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'followups' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Follow-ups ({lead.followups?.length || 0})
            </button>
          </div>

          {/* Tab 1: Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 overflow-y-auto max-h-96 pr-2">
              {lead.activities?.map(act => (
                <div key={act.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{act.action_type}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(act.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 2: Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a client interaction note..."
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className="glass-input flex-1 text-xs"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-md active:scale-95"
                >
                  Post Note
                </button>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto">
                {lead.notesList?.map(n => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-400">{n.user_name || 'Sales Rep'}</span>
                      <span className="text-[10px] font-mono">{new Date(n.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-200">{n.note}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Calls */}
          {activeTab === 'calls' && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {lead.calls?.map(c => (
                <div key={c.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{c.call_outcome}</span>
                    <span className="text-slate-400 font-mono text-[10px]">{Math.floor(c.duration_seconds / 60)}m {c.duration_seconds % 60}s</span>
                  </div>
                  <p className="text-slate-400 mt-1">{c.notes}</p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: Follow-ups */}
          {activeTab === 'followups' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                <div className="text-xs font-bold text-white">Schedule Next Touchpoint</div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newFollowupType}
                    onChange={e => setNewFollowupType(e.target.value)}
                    className="glass-input text-xs"
                  >
                    <option value="Call" className="bg-slate-900 text-white">Phone Call</option>
                    <option value="Meeting" className="bg-slate-900 text-white">In-Person Meeting</option>
                    <option value="WhatsApp" className="bg-slate-900 text-white">WhatsApp Message</option>
                    <option value="Email" className="bg-slate-900 text-white">Email Proposal</option>
                    <option value="Demo" className="bg-slate-900 text-white">Online Demo</option>
                  </select>
                  <input
                    type="datetime-local"
                    value={newFollowupDate}
                    onChange={e => setNewFollowupDate(e.target.value)}
                    className="glass-input text-xs text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Notes for follow-up agenda..."
                  value={newFollowupNotes}
                  onChange={e => setNewFollowupNotes(e.target.value)}
                  className="glass-input text-xs"
                />
                <button
                  onClick={handleScheduleFollowup}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-semibold text-white shadow-md active:scale-95"
                >
                  Register Follow-up Schedule
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {lead.followups?.map(f => (
                  <div key={f.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{f.followup_type}</div>
                      <div className="text-slate-400 text-[11px]">{f.notes}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      f.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {f.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

