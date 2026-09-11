import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  TrendingUp,
  UsersRound,
  Package,
  CreditCard,
  MessageSquare,
  Send,
  Zap,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Award,
  Layers,
  PhoneCall,
  Activity
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleDemoLaunch = async (email: string) => {
    await switchDemoRole(email);
    navigate('/dashboard');
  };

  const workflows = [
    { step: '1', title: 'Meta Lead Gen', desc: 'Inbound ads from Facebook & Instagram trigger webhooks in real time', icon: Zap },
    { step: '2', title: 'Smart Routing', desc: 'Rules engine auto-assigns leads via Round Robin or Team criteria', icon: Layers },
    { step: '3', title: 'Sales Pipeline', desc: 'Sales reps follow up, log calls & negotiate in Kanban view', icon: PhoneCall },
    { step: '4', title: 'Order & Inventory', desc: 'Deals automatically decrement warehouse stock & trigger low-stock alerts', icon: Package },
    { step: '5', title: 'Payment Collection', desc: 'Track partial and overdue payments with automatic due date warnings', icon: CreditCard },
    { step: '6', title: 'WhatsApp Daily Report', desc: 'End-of-day sales digest automatically dispatched to executive team', icon: Send }
  ];

  const personas = [
    { title: 'Super Admin', name: 'Akash SuperAdmin', email: 'superadmin@nexora.com', desc: 'Full system control, permissions & audit logs', color: 'from-indigo-500 to-purple-600' },
    { title: 'Sales Manager', name: 'Rajesh Verma', email: 'manager@nexora.com', desc: 'Cross-team targets, conversion analytics & announcements', color: 'from-blue-500 to-cyan-600' },
    { title: 'Team Leader', name: 'Rahul Deshmukh', email: 'leader@nexora.com', desc: 'Team Alpha management, lead assignment & daily reporting', color: 'from-emerald-500 to-teal-600' },
    { title: 'Sales Executive', name: 'Akash Neelgund', email: 'sales@nexora.com', desc: 'Private lead pipeline, quotations, deals & follow-ups', color: 'from-amber-500 to-orange-600' },
    { title: 'Inventory Manager', name: 'Suresh Kumar', email: 'inventory@nexora.com', desc: 'Warehouse stock, product catalog & low stock alarms', color: 'from-rose-500 to-pink-600' },
    { title: 'Finance Manager', name: 'Meera Iyer', email: 'finance@nexora.com', desc: 'Overdue balances, invoice reconciliation & payments', color: 'from-violet-500 to-purple-700' }
  ];

  return (
    <div className="min-h-screen bg-[#090B10] text-white selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background glow auras */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-[600px] right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/25 border border-white/20">
            N
          </div>
          <div>
            <span className="font-black text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              NEXORA CRM
            </span>
            <span className="block text-[9px] uppercase tracking-widest text-indigo-400 font-bold -mt-0.5">
              Enterprise Operations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white border border-white/[0.08] transition-all"
          >
            Sign In
          </Link>
          <button
            onClick={() => handleDemoLaunch('superadmin@nexora.com')}
            className="btn-primary text-xs font-bold"
          >
            Launch Live Demo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 shadow-inner">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Unified Enterprise CRM • Meta Ads • Inventory • WhatsApp Reporting</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl mx-auto leading-tight">
          One CRM. Your Entire{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Sales Operation.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Manage leads, multi-tier sales teams, inventory, payments, real-time chat, and automated daily WhatsApp reports from a single powerful platform.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => handleDemoLaunch('superadmin@nexora.com')}
            className="btn-primary px-8 py-3.5 text-sm font-bold flex items-center gap-2"
          >
            <span>Explore Super Admin Demo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/login"
            className="px-8 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] font-semibold text-sm transition-all text-slate-300 hover:text-white"
          >
            Choose Demo Persona
          </Link>
        </div>

        {/* Live Metrics preview bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto p-4 glass-card">
          <div className="p-3">
            <div className="text-2xl font-black text-indigo-400 font-mono">100+</div>
            <div className="text-xs text-slate-400 mt-0.5">Seeded Enterprise Leads</div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">₹8.45 Lakhs</div>
            <div className="text-xs text-slate-400 mt-0.5">Today Sales Revenue</div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-black text-amber-400 font-mono">5 Teams</div>
            <div className="text-xs text-slate-400 mt-0.5">Multi-tier Sales Pods</div>
          </div>
          <div className="p-3">
            <div className="text-2xl font-black text-rose-400 font-mono">10+ Alerts</div>
            <div className="text-xs text-slate-400 mt-0.5">Low Stock Triggers</div>
          </div>
        </div>
      </section>

      {/* 1-Click Role Switcher Demo Cards */}
      <section className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">Experience Every Role in Real Time</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-2">
            Click any persona card below to instantly launch the full CRM experience with strict role-based access control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {personas.map((p, i) => (
            <div
              key={i}
              onClick={() => handleDemoLaunch(p.email)}
              className="glass-card p-6 cursor-pointer group hover:-translate-y-1 transition-all relative overflow-hidden"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${p.color} flex items-center justify-center font-bold text-white mb-4 shadow-md`}>
                {p.title[0]}
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>{p.title}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-indigo-400" />
              </h3>
              <div className="text-xs font-semibold text-slate-300 mt-0.5">{p.name}</div>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.desc}</p>
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-indigo-400 font-semibold">
                <span>Launch Persona</span>
                <span className="font-mono text-[10px] text-slate-500">{p.email}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Architecture Diagram */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-white/[0.08] relative z-10">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Complete Business Flow</span>
          <h2 className="text-2xl sm:text-4xl font-bold mt-1 tracking-tight">From Inbound Ad to WhatsApp Summary</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workflows.map((wf, idx) => {
            const Icon = wf.icon;
            return (
              <div key={idx} className="glass-card p-6 relative group transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-2xl font-black text-slate-700 group-hover:text-slate-500 transition-colors font-mono">0{wf.step}</span>
                </div>
                <h3 className="text-base font-bold text-white">{wf.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{wf.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-10 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>© 2026 NEXORA CRM Platform. Built for Enterprise Sales Operations.</div>
          <div className="flex items-center gap-6 text-slate-400">
            <span>Security & RBAC</span>
            <span>Meta Graph API</span>
            <span>WhatsApp Cloud API</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
