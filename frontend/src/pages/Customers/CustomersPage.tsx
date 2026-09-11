import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Customer } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  Users,
  Search,
  Building,
  Phone,
  Mail,
  CreditCard,
  ShoppingBag,
  ExternalLink,
  Plus,
  ShieldCheck
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getCustomers({ search })
      .then(res => {
        if (res.success) setCustomers(res.customers || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Verified Customer Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Customer Accounts & Ledger</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified accounts converted from qualified leads with lifetime sales, pending balances, and direct contacts
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 p-4 glass-card">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search customers by company, contact or customer code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            className="glass-input"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Customer Code</th>
              <th className="p-4">Company & Name</th>
              <th className="p-4">Contact Details</th>
              <th className="p-4">Assigned Sales Rep</th>
              <th className="p-4">Lifetime Purchases</th>
              <th className="p-4">Outstanding Balance</th>
              <th className="p-4">Created Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {customers.map(c => (
              <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-mono font-semibold text-indigo-400">{c.customer_code}</td>
                <td className="p-4">
                  <div className="font-bold text-white">{c.name}</div>
                  <div className="text-slate-400 text-[11px]">{c.company || 'Retail Organization'}</div>
                </td>
                <td className="p-4 text-slate-300">
                  <div className="font-mono text-slate-200">{c.phone}</div>
                  <div className="text-slate-500 text-[11px]">{c.email || 'No email provided'}</div>
                </td>
                <td className="p-4 text-slate-300">{c.assigned_user_name || 'Organization Rep'}</td>
                <td className="p-4 font-bold text-emerald-400 font-mono">
                  ₹{Number(c.total_sales || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-4 font-bold text-amber-300 font-mono">
                  ₹{Number(c.pending_balance || 0).toLocaleString('en-IN')}
                </td>
                <td className="p-4 text-slate-400 font-mono text-[11px]">{new Date(c.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

