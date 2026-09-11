import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Lead } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  Kanban,
  List,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Phone,
  Mail,
  Building,
  UserCheck,
  AlertCircle,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { id: 'New', title: 'New Leads', dot: 'bg-blue-400', badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  { id: 'Contacted', title: 'Contacted', dot: 'bg-cyan-400', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  { id: 'Interested', title: 'Interested', dot: 'bg-amber-400', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  { id: 'Qualified', title: 'Qualified', dot: 'bg-emerald-400', badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  { id: 'Quotation', title: 'Quotation', dot: 'bg-indigo-400', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  { id: 'Negotiation', title: 'Negotiation', dot: 'bg-purple-400', badge: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  { id: 'Won', title: 'Won Deals', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' },
  { id: 'Lost', title: 'Lost', dot: 'bg-rose-400', badge: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
];

export const LeadsPage: React.FC<{
  isNewLeadModalOpen?: boolean;
  setIsNewLeadModalOpen?: (v: boolean) => void;
}> = ({ isNewLeadModalOpen, setIsNewLeadModalOpen }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [metaDrawerOpen, setMetaDrawerOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  // Add Lead Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('+91 98');
  const [newEmail, setNewEmail] = useState('');
  const [newSource, setNewSource] = useState('Facebook');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [newExpectedValue, setNewExpectedValue] = useState(50000);
  const [newNotes, setNewNotes] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);
  const [creatingLead, setCreatingLead] = useState(false);

  // Meta Simulator State
  const [metaSource, setMetaSource] = useState('Facebook');
  const [metaCampaign, setMetaCampaign] = useState('Summer_B2B_LeadGen_2026');
  const [metaName, setMetaName] = useState('Girish Kulkarni');
  const [metaPhone, setMetaPhone] = useState('+91 98860 12345');
  const [metaEmail, setMetaEmail] = useState('girish.k@enterprisestore.in');
  const [metaSimulating, setMetaSimulating] = useState(false);

  const fetchLeads = () => {
    setLoading(true);
    api.getLeads({ search, status: statusFilter, source: sourceFilter })
      .then(res => {
        if (res.success) setLeads(res.leads || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, sourceFilter]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await api.updateLeadStatus(leadId, newStatus, `Moved on Kanban board to ${newStatus}`);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus as any } : l));
      showToast('Lead Updated', `Status changed to ${newStatus}`, 'success');
    } catch (e: any) {
      showToast('Error', e.message, 'error');
    }
  };

  const handleCreateLead = async (allowDuplicate = false) => {
    if (!newName || !newPhone) {
      showToast('Missing Info', 'Lead name and phone are required', 'error');
      return;
    }
    setCreatingLead(true);
    setDuplicateWarning(null);
    try {
      const res = await api.createLead({
        name: newName,
        phone: newPhone,
        email: newEmail,
        source: newSource,
        priority: newPriority,
        expected_value: newExpectedValue,
        notes: newNotes,
        allow_duplicate: allowDuplicate
      });

      if (res.success) {
        showToast('Lead Created', `Lead ${res.leadCode} added and automatically assigned!`, 'success');
        setShowAddModal(false);
        if (setIsNewLeadModalOpen) setIsNewLeadModalOpen(false);
        setNewName('');
        setNewPhone('+91 98');
        setNewEmail('');
        fetchLeads();
      }
    } catch (err: any) {
      if (err.message && err.message.includes('duplicate')) {
        setDuplicateWarning('Duplicate lead detected with this phone or email. Click "Force Create" to proceed anyway.');
      } else {
        showToast('Error', err.message || 'Failed to create lead', 'error');
      }
    } finally {
      setCreatingLead(false);
    }
  };

  const handleSimulateMetaLead = async () => {
    setMetaSimulating(true);
    try {
      const res = await api.simulateMetaLead({
        source: metaSource,
        campaign: metaCampaign,
        name: metaName,
        phone: metaPhone,
        email: metaEmail
      });

      if (res.success) {
        showToast(
          `⚡ ${metaSource} Lead Ingested!`,
          `Rule applied: ${res.lead.rule_applied}. Assigned to ${res.lead.assigned_user_id || 'Alpha Rep'}`,
          'success'
        );
        fetchLeads();
        setMetaDrawerOpen(false);
      }
    } catch (err: any) {
      showToast('Meta Ingestion', err.message || 'Duplicate detected / Ingestion failed', 'warning');
    } finally {
      setMetaSimulating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-20">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Lead Pipeline</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono font-medium border border-indigo-500/20">
              {leads.length} Active Leads
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time omnichannel sales funnel & lead progression desk</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Meta Simulator Drawer Button */}
          <button
            onClick={() => setMetaDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] select-none"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Meta Webhook Simulator</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 p-3.5 glass-card rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads by name, phone, code or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            className="glass-input w-full pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="glass-input px-3 py-2 text-xs text-slate-300"
          >
            <option value="all">All Stages</option>
            {KANBAN_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="glass-input px-3 py-2 text-xs text-slate-300"
          >
            <option value="all">All Channels</option>
            <option value="Facebook">Facebook Ads</option>
            <option value="Instagram">Instagram Ads</option>
            <option value="Website">Website Form</option>
            <option value="WhatsApp">WhatsApp Inbound</option>
            <option value="Google">Google Search</option>
            <option value="Referral">Referral</option>
            <option value="Manual">Manual Outbound</option>
          </select>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-6 pt-1">
          {KANBAN_COLUMNS.map(col => {
            const colLeads = leads.filter(l => l.status === col.id);
            return (
              <div
                key={col.id}
                className="w-72 shrink-0 bg-[#0B0E17]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl flex flex-col max-h-[75vh]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between font-bold text-xs rounded-t-2xl">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className="text-white">{col.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.06] text-slate-300 text-[10px] font-mono">
                    {colLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1">
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-500/40 cursor-pointer transition-all duration-200 shadow-sm group hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-indigo-200 transition-colors">
                          {lead.name}
                        </span>
                        <span className={`text-[9px] font-semibold px-2 py-0.2 rounded-full ${
                          lead.priority === 'Urgent' ? 'badge-urgent' :
                          lead.priority === 'High' ? 'badge-overdue' : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
                        }`}>
                          {lead.priority}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span className="font-mono">{lead.phone}</span>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-white/[0.04] flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400 font-mono">
                          ₹{Number(lead.expected_value || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.06]">
                          {lead.source}
                        </span>
                      </div>

                      {/* Quick Move Status buttons */}
                      <div className="mt-2 pt-2 border-t border-white/[0.04] flex items-center justify-between gap-1 text-[10px]" onClick={e => e.stopPropagation()}>
                        <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Stage</span>
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="bg-[#07090E] border border-white/[0.08] rounded-md px-1.5 py-0.5 text-slate-300 text-[10px] focus:outline-none focus:border-indigo-500"
                        >
                          {KANBAN_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}

                  {colLeads.length === 0 && (
                    <div className="p-6 text-center text-[11px] text-slate-500 border border-dashed border-white/[0.06] rounded-xl">
                      No leads in {col.title}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table List View */}
      {viewMode === 'list' && (
        <div className="glass-card rounded-2xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4">Lead Code</th>
                <th className="p-4">Name & Contact</th>
                <th className="p-4">Channel</th>
                <th className="p-4">Assigned Rep</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Deal Value</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {leads.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="hover:bg-white/[0.04] cursor-pointer transition-colors"
                >
                  <td className="p-4 font-mono text-indigo-400 font-semibold">{lead.lead_code}</td>
                  <td className="p-4">
                    <div className="font-bold text-white text-xs">{lead.name}</div>
                    <div className="text-slate-400 text-[11px] font-mono">{lead.phone} • {lead.email || 'No email'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-slate-300 font-medium text-[10px]">
                      {lead.source}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{lead.assigned_user_name || 'Unassigned'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400 font-mono">
                    ₹{Number(lead.expected_value || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/leads/${lead.id}`)}
                      className="btn-secondary text-[11px] py-1 px-3"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead Modal */}
      {(showAddModal || isNewLeadModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Create New Inbound Lead</h3>
                <p className="text-xs text-slate-400">Auto-routes to sales pods using round-robin & source criteria</p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); if (setIsNewLeadModalOpen) setIsNewLeadModalOpen(false); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{duplicateWarning}</div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Lead Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="glass-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+91 98800..."
                    className="glass-input text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="contact@business.in"
                    className="glass-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Source Channel</label>
                  <select
                    value={newSource}
                    onChange={e => setNewSource(e.target.value)}
                    className="glass-input text-xs"
                  >
                    <option value="Facebook" className="bg-slate-900 text-white">Facebook Ads</option>
                    <option value="Instagram" className="bg-slate-900 text-white">Instagram Ads</option>
                    <option value="Website" className="bg-slate-900 text-white">Website Form</option>
                    <option value="WhatsApp" className="bg-slate-900 text-white">WhatsApp Inbound</option>
                    <option value="Google" className="bg-slate-900 text-white">Google Search</option>
                    <option value="Referral" className="bg-slate-900 text-white">Referral</option>
                    <option value="Manual" className="bg-slate-900 text-white">Manual Call</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Deal Value (₹)</label>
                  <input
                    type="number"
                    value={newExpectedValue}
                    onChange={e => setNewExpectedValue(Number(e.target.value))}
                    className="glass-input text-xs font-mono font-bold text-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notes & Requirements</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="Client requirements, store count, etc."
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => { setShowAddModal(false); if (setIsNewLeadModalOpen) setIsNewLeadModalOpen(false); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>

              {duplicateWarning ? (
                <button
                  type="button"
                  onClick={() => handleCreateLead(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg active:scale-95"
                >
                  Force Create Duplicate
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCreateLead(false)}
                  disabled={creatingLead}
                  className="btn-primary px-5 py-2.5 text-xs font-bold disabled:opacity-50 active:scale-95"
                >
                  {creatingLead ? 'Saving...' : 'Save & Route Lead'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meta Webhook Simulator Drawer */}
      {metaDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border-l border-white/[0.1] w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Meta Webhook Simulator</h3>
                </div>
                <button onClick={() => setMetaDrawerOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Simulate real-time inbound Facebook and Instagram Lead Ads webhook events. Verifies duplicate detection, campaign attribution, and round-robin routing.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ad Platform</label>
                  <select
                    value={metaSource}
                    onChange={e => setMetaSource(e.target.value)}
                    className="glass-input text-xs"
                  >
                    <option value="Facebook" className="bg-slate-900 text-white">Facebook Lead Ads</option>
                    <option value="Instagram" className="bg-slate-900 text-white">Instagram Stories / Reels Ad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Tag</label>
                  <input
                    type="text"
                    value={metaCampaign}
                    onChange={e => setMetaCampaign(e.target.value)}
                    className="glass-input text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Name</label>
                  <input
                    type="text"
                    value={metaName}
                    onChange={e => setMetaName(e.target.value)}
                    className="glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone (Triggers deduplication)</label>
                  <input
                    type="text"
                    value={metaPhone}
                    onChange={e => setMetaPhone(e.target.value)}
                    className="glass-input text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/[0.08] space-y-2">
              <button
                onClick={handleSimulateMetaLead}
                disabled={metaSimulating}
                className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>{metaSimulating ? 'Triggering Webhook...' : 'Fire Inbound Webhook Event'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
