import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Role, Permission } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  ShieldCheck,
  Users,
  KeyRound,
  Zap,
  Send,
  History,
  Check,
  X,
  Search,
  Plus,
  Save,
  Lock,
  Building
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'meta' | 'whatsapp' | 'audit'>('matrix');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>('role-admin');
  const [users, setUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const { showToast } = useNotifications();

  // Meta Integration State
  const [metaConfig, setMetaConfig] = useState<any>({
    page_name: 'Nexora Technologies Official Store',
    page_id: '1092837465928',
    webhook_verify_token: 'nexora_meta_secret_2026',
    is_connected: 1
  });

  // WhatsApp Config State
  const [waConfig, setWaConfig] = useState<any>({
    business_account_id: 'waba_9928374829',
    phone_number_id: 'phone_1092837492',
    daily_report_time: '20:30',
    recipients: '+91 98800 11001, +91 98800 11002'
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getRolesMatrix(),
      api.getUsers(),
      api.getAuditLogs({ limit: 40 })
    ])
      .then(([matrixRes, usersRes, auditRes]) => {
        if (matrixRes.success) {
          setRoles(matrixRes.roles || []);
          setPermissions(matrixRes.permissions || []);
          let permsMap: Record<string, string[]> = {};
          if (matrixRes.rolePermissions && !Array.isArray(matrixRes.rolePermissions)) {
            permsMap = matrixRes.rolePermissions;
          } else if (Array.isArray(matrixRes.rolePermissionsRows || matrixRes.rolePermissions)) {
            const arr = matrixRes.rolePermissionsRows || matrixRes.rolePermissions;
            arr.forEach((rp: any) => {
              if (!permsMap[rp.role_id]) permsMap[rp.role_id] = [];
              permsMap[rp.role_id].push(rp.permission_code);
            });
          }
          setRolePermissions(permsMap);
        }
        if (usersRes.success) setUsers(usersRes.users || []);
        if (auditRes.success) setAuditLogs(auditRes.logs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleTogglePermission = (permCode: string) => {
    if (selectedRoleId === 'role-superadmin') {
      showToast('Protected Role', 'Super Admin possesses full system privileges by default', 'info');
      return;
    }

    const currentList = rolePermissions[selectedRoleId] || [];
    const hasPerm = currentList.includes(permCode);
    const updated = hasPerm
      ? currentList.filter(p => p !== permCode)
      : [...currentList, permCode];

    setRolePermissions({
      ...rolePermissions,
      [selectedRoleId]: updated
    });
  };

  const handleSaveMatrix = async () => {
    setSavingMatrix(true);
    try {
      const permsToSave = rolePermissions[selectedRoleId] || [];
      await api.updateRolePermissions(selectedRoleId, permsToSave);
      showToast('Permissions Saved', `Role permissions updated in database for ${roles.find(r => r.id === selectedRoleId)?.name}`, 'success');
    } catch (e: any) {
      showToast('Save Error', e.message, 'error');
    } finally {
      setSavingMatrix(false);
    }
  };

  const categories = Array.from(new Set(permissions.map(p => p.category)));

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin & Security Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System & Security Configuration</h1>
          <p className="text-xs text-slate-400 mt-0.5">Granular RBAC permission matrix, user directory, Meta & WhatsApp integrations, and audit trails</p>
        </div>
      </div>

      {/* Setting Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 glass-card overflow-x-auto">
        {[
          { id: 'matrix', label: 'Role & Permission Matrix', icon: ShieldCheck },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'meta', label: 'Meta Ads Webhook', icon: Zap },
          { id: 'whatsapp', label: 'WhatsApp Cloud API', icon: Send },
          { id: 'audit', label: 'System Audit Logs', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Role Permission Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Role Selector Tabs */}
          <div className="flex items-center justify-between gap-4 p-4 glass-card">
            <div className="flex items-center gap-2 overflow-x-auto flex-1">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                    selectedRoleId === role.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                      : 'bg-white/[0.03] text-slate-400 border border-white/[0.06] hover:text-white'
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>

            <button
              onClick={handleSaveMatrix}
              disabled={savingMatrix || selectedRoleId === 'role-superadmin'}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{savingMatrix ? 'Saving...' : 'Save Matrix'}</span>
            </button>
          </div>

          {/* Matrix Grid grouped by category */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map(cat => {
              const catPerms = permissions.filter(p => p.category === cat);
              const activePermsForRole = rolePermissions[selectedRoleId] || [];

              return (
                <div key={cat} className="glass-card p-5 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-white/[0.08] pb-2 flex items-center justify-between">
                    <span>{cat} Access</span>
                    <span className="text-[10px] font-mono font-normal text-slate-500">{catPerms.length} rules</span>
                  </h3>

                  <div className="space-y-2">
                    {catPerms.map(p => {
                      const isGranted = selectedRoleId === 'role-superadmin' || activePermsForRole.includes(p.code);

                      return (
                        <div
                          key={p.code}
                          onClick={() => handleTogglePermission(p.code)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] cursor-pointer transition-colors border border-transparent hover:border-white/[0.05]"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono truncate">{p.code}</div>
                          </div>

                          <button
                            type="button"
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                              isGranted
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                                : 'bg-white/[0.04] text-slate-600 border border-white/[0.08]'
                            }`}
                          >
                            {isGranted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Users Directory */}
      {activeTab === 'users' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Assigned Team</th>
                <th className="p-4">Monthly Target</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt={u.name}
                      className="w-8 h-8 rounded-xl object-cover border border-white/[0.1]"
                    />
                    <div>
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email} • {u.phone}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {u.role_name}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{u.team_name || 'Organization Wide'}</td>
                  <td className="p-4 font-bold text-emerald-400 font-mono">
                    {u.target_monthly > 0 ? `₹${Number(u.target_monthly).toLocaleString('en-IN')}` : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Meta Ads Integration */}
      {activeTab === 'meta' && (
        <div className="max-w-xl p-6 glass-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Meta Graph API & Webhook Configuration</h3>
              <p className="text-xs text-slate-400">Receives real-time lead submissions from FB and IG</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Facebook Page Name</label>
              <input
                type="text"
                value={metaConfig.page_name}
                onChange={e => setMetaConfig({ ...metaConfig, page_name: e.target.value })}
                className="glass-input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Webhook Verify Token</label>
              <input
                type="text"
                value={metaConfig.webhook_verify_token}
                onChange={e => setMetaConfig({ ...metaConfig, webhook_verify_token: e.target.value })}
                className="glass-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Inbound Webhook Endpoint URL</label>
              <input
                type="text"
                readOnly
                value="http://localhost:5050/api/meta/webhook"
                className="glass-input text-xs font-mono text-slate-400"
              />
            </div>

            <button
              onClick={() => showToast('Meta Config Saved', 'Graph API parameters updated', 'success')}
              className="btn-primary w-full py-2.5 text-xs font-bold"
            >
              Save Meta Configuration
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: WhatsApp Cloud API */}
      {activeTab === 'whatsapp' && (
        <div className="max-w-xl p-6 glass-card space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-white/[0.08]">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">WhatsApp Cloud API & Daily Scheduler</h3>
              <p className="text-xs text-slate-400">Dispatches daily automated digests to leadership</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">WhatsApp Business Account ID</label>
              <input
                type="text"
                value={waConfig.business_account_id}
                onChange={e => setWaConfig({ ...waConfig, business_account_id: e.target.value })}
                className="glass-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Automated Dispatch Time (24h)</label>
              <input
                type="time"
                value={waConfig.daily_report_time}
                onChange={e => setWaConfig({ ...waConfig, daily_report_time: e.target.value })}
                className="glass-input text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Executive Recipient Phone Numbers</label>
              <input
                type="text"
                value={waConfig.recipients}
                onChange={e => setWaConfig({ ...waConfig, recipients: e.target.value })}
                className="glass-input text-xs"
              />
            </div>

            <button
              onClick={() => showToast('WhatsApp Config Saved', 'Cloud API dispatch scheduler updated', 'success')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-white rounded-xl shadow-lg shadow-emerald-600/25 transition-all text-xs active:scale-95"
            >
              Save WhatsApp Configuration
            </button>
          </div>
        </div>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {auditLogs.map((log: any, i: number) => (
                <tr key={log.id || i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 text-slate-400 font-mono text-[11px]">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4 font-bold text-white">{log.user_name || 'System Auto-Engine'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-mono text-[11px]">{log.entity_type} ({log.entity_id})</td>
                  <td className="p-4 text-slate-400 max-w-xs truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
