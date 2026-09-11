import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Check, Eye, EyeOff } from 'lucide-react';

const ROLE_BADGE_COLORS: Record<string, string> = {
  'Super Admin': 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  'Admin': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'Sales Manager': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'Team Leader': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'Sales Executive': 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  'Inventory Manager': 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  'Finance Manager': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  'Support Staff': 'bg-teal-500/15 text-teal-300 border-teal-500/30',
};

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('superadmin@nexora.com');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, switchDemoRole, demoAccounts } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSelect = async (accountEmail: string, accountPw: string) => {
    setEmail(accountEmail);
    setPassword(accountPw);
    setLoading(true);
    try {
      await switchDemoRole(accountEmail, accountPw);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-center py-12 px-6 lg:px-8 relative overflow-hidden selection:bg-indigo-500/30">
      {/* Ambient background glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[300px] bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8 relative z-10">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-indigo-600/30 border border-white/20 group-hover:scale-105 transition-transform">
            N
          </div>
          <div className="text-left">
            <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
              NEXORA CRM
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-indigo-400 font-bold -mt-0.5">
              Enterprise Suite
            </span>
          </div>
        </Link>
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-white">Sign in to your CRM workspace</h2>
        <p className="mt-1 text-xs text-slate-400">Select any persona below for instant 1-click access</p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 space-y-6">
        {/* Main Login Form */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/[0.08] backdrop-blur-2xl">
          {error && (
            <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.75rem', paddingRight: '1rem' }}
                  className="glass-input py-3 text-xs text-white"
                  placeholder="name@nexora.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  className="glass-input py-3 text-xs text-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 1-Click Demo Persona Switcher */}
        <div className="glass-card p-6 rounded-3xl shadow-xl border border-white/[0.08]">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              1-Click Demo Persona Switcher
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {demoAccounts.map((acc, i) => {
              const badgeStyle = ROLE_BADGE_COLORS[acc.role] || 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDemoSelect(acc.email, acc.password)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-500/40 text-left transition-all group active:scale-[0.98]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-white group-hover:text-indigo-200 transition-colors">
                      {acc.role}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{acc.name}</div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${badgeStyle}`}>
                    Login
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
