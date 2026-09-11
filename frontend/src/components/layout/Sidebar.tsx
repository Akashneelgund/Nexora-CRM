import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UserCheck,
  Users,
  ShoppingBag,
  CreditCard,
  Package,
  UsersRound,
  BarChart3,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sparkles,
  PhoneCall
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, logout, switchDemoRole, demoAccounts, hasPermission } = useAuth();
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/calling', label: 'Daily Call Desk', icon: PhoneCall, permission: ['leads.view_own', 'leads.view_team', 'leads.view_all', 'leads.request'] },
    { to: '/leads', label: 'Lead Management', icon: UserCheck, permission: ['leads.view_own', 'leads.view_team', 'leads.view_all'] },
    { to: '/customers', label: 'Customers', icon: Users, permission: ['customers.view', 'customers.create'] },
    { to: '/sales', label: 'Sales & Orders', icon: ShoppingBag, permission: ['sales.view_own', 'sales.view_team', 'sales.view_all', 'sales.create'] },
    { to: '/payments', label: 'Payments & Overdue', icon: CreditCard, permission: ['payments.verify', 'payments.view_all'] },
    { to: '/inventory', label: 'Inventory & Stock', icon: Package, permission: ['inventory.manage', 'inventory.transfer'] },
    { to: '/teams', label: 'Sales Teams', icon: UsersRound, permission: ['teams.manage', 'teams.view_all'] },
    { to: '/reports', label: 'WhatsApp Reports', icon: BarChart3, permission: ['reports.whatsapp', 'reports.view_all'] },
    { to: '/chat', label: 'Internal Chat', icon: MessageSquare, permission: ['chat.view'] },
    { to: '/settings', label: 'Admin Settings', icon: Settings, permission: ['roles.view', 'roles.manage', 'users.view', 'settings.manage'] },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col bg-[#0A0D14]/95 backdrop-blur-2xl border-r border-white/[0.06] transition-all duration-300 relative z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.06]">
        <NavLink to="/dashboard" className="flex items-center gap-3 overflow-hidden group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] border border-white/20 shrink-0 group-hover:scale-105 transition-transform">
            N
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1">
                NEXORA
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              </span>
              <span className="text-[9px] uppercase tracking-wider text-indigo-400/90 font-semibold -mt-0.5">
                Sales & Operations
              </span>
            </div>
          )}
        </NavLink>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role Indicator Banner */}
      <div className="p-3 border-b border-white/[0.06] relative">
        <div
          onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
          className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] cursor-pointer transition-all group"
          title="Click to switch persona"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/25">
            <ShieldCheck className="w-4 h-4" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
                <span>Active Role</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">Switch</span>
              </div>
              <div className="text-xs font-semibold text-white truncate group-hover:text-indigo-200 transition-colors">
                {user?.role_name || 'Super Admin'}
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Popover */}
        {roleSwitcherOpen && (
          <div className="absolute top-full left-2 right-2 mt-1.5 z-50 glass-dropdown rounded-2xl p-2 animate-slide-up">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
              Switch User Persona
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {demoAccounts.map((acc, i) => (
                <button
                  key={i}
                  onClick={() => {
                    switchDemoRole(acc.email);
                    setRoleSwitcherOpen(false);
                  }}
                  className={`w-full flex flex-col text-left px-3 py-1.5 rounded-xl text-xs transition-all ${
                    user?.email === acc.email
                      ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                      : 'hover:bg-white/[0.06] text-slate-300 hover:text-white'
                  }`}
                >
                  <span className="font-medium">{acc.role}</span>
                  <span className="text-[10px] opacity-75">{acc.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all group select-none ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-200 font-semibold border border-indigo-500/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 opacity-80 group-hover:opacity-100" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
          <div className="relative shrink-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user?.name}
              className="w-8 h-8 rounded-lg object-cover border border-white/[0.1]"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0A0D14]" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
            </div>
          )}
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
