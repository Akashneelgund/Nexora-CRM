import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Payment, DealOrder } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  CreditCard,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  ArrowDownLeft,
  Building,
  UserCheck,
  Calendar,
  X
} from 'lucide-react';

export const PaymentsPage: React.FC<{
  isRecordPaymentOpen?: boolean;
  setIsRecordPaymentOpen?: (v: boolean) => void;
}> = ({ isRecordPaymentOpen, setIsRecordPaymentOpen }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingOrders, setPendingOrders] = useState<DealOrder[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const { showToast } = useNotifications();

  // Record Payment form
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(10000);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Bank Transfer' | 'Cash' | 'Card'>('UPI');
  const [refNumber, setRefNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  const fetchPaymentsData = () => {
    setLoading(true);
    Promise.all([
      api.getPayments({ search }),
      api.getPendingPayments()
    ])
      .then(([allRes, pendRes]) => {
        if (allRes.success) setPayments(allRes.payments || []);
        if (pendRes.success) setPendingOrders(pendRes.pendingOrders || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPaymentsData();
  }, [search]);

  const handleRecordPayment = async () => {
    if (!selectedOrderId && pendingOrders.length > 0) {
      setSelectedOrderId(pendingOrders[0].id);
    }
    const orderIdToUse = selectedOrderId || pendingOrders[0]?.id;
    if (!orderIdToUse || paymentAmount <= 0) {
      showToast('Missing Details', 'Select an order and enter valid payment amount', 'error');
      return;
    }

    setSavingPayment(true);
    try {
      const res = await api.recordPayment({
        order_id: orderIdToUse,
        amount: paymentAmount,
        payment_method: paymentMethod,
        reference_number: refNumber || `UPI_${Date.now()}`,
        notes: paymentNotes || 'Balance collection payment'
      });

      if (res.success) {
        showToast('Payment Logged!', `₹${paymentAmount.toLocaleString('en-IN')} recorded. Balance updated.`, 'success');
        setShowRecordModal(false);
        if (setIsRecordPaymentOpen) setIsRecordPaymentOpen(false);
        fetchPaymentsData();
      }
    } catch (e: any) {
      showToast('Payment Error', e.message || 'Failed to record payment', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  const totalPendingAmount = pendingOrders.reduce((sum, o) => sum + (o.pending_amount || 0), 0);
  const overdueOrders = pendingOrders.filter(o => (o.days_overdue || 0) > 0 || o.payment_status === 'Overdue');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Finance & Collections Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Payments & Outstanding Ledger</h1>
          <p className="text-xs text-slate-400 mt-0.5">Reconcile UPI transactions, track collection velocity, and resolve overdue receivables</p>
        </div>

        <button
          onClick={() => setShowRecordModal(true)}
          className="btn-primary flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Record Collection</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Outstanding</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-3">₹{totalPendingAmount.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{pendingOrders.length} accounts with pending balance</span>
          </div>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group hover:border-rose-500/30 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Critical Overdue</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-3">{overdueOrders.length} Invoices</div>
          <div className="text-[11px] text-rose-400/90 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>Requires finance recovery follow-up</span>
          </div>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reconciled Collections</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-3">{payments.length} Transactions</div>
          <div className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Verified via UPI & Bank Gateways</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 glass-card">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10'
                : 'bg-white/[0.02] text-slate-400 border border-white/[0.04] hover:text-white hover:border-white/[0.1]'
            }`}
          >
            Pending & Overdue ({pendingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                : 'bg-white/[0.02] text-slate-400 border border-white/[0.04] hover:text-white hover:border-white/[0.1]'
            }`}
          >
            All Transactions ({payments.length})
          </button>
        </div>

        <div className="relative max-w-xs flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search payments, customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            className="glass-input text-xs"
          />
        </div>
      </div>

      {/* Tab 1: Dedicated Pending Payments Tracker Table */}
      {activeTab === 'pending' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Order Code</th>
                <th className="p-4">Customer & Phone</th>
                <th className="p-4">Total Order</th>
                <th className="p-4">Paid So Far</th>
                <th className="p-4">Pending Due</th>
                <th className="p-4">Overdue Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {pendingOrders.map(ord => {
                const isOverdue = (ord.days_overdue || 0) > 0 || ord.payment_status === 'Overdue';
                return (
                  <tr key={ord.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-400">{ord.order_code}</td>
                    <td className="p-4">
                      <div className="font-bold text-white text-sm">{ord.customer_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{ord.customer_phone || ord.customer_company}</div>
                    </td>
                    <td className="p-4 font-semibold text-white font-mono text-sm">₹{Number(ord.net_amount).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-emerald-400 font-semibold font-mono">₹{Number(ord.paid_amount).toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-amber-300 font-mono text-sm">₹{Number(ord.pending_amount).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      {isOverdue ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/25 flex items-center gap-1.5 w-fit">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>{ord.days_overdue || 7} Days Overdue</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          Due in 5 days
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrderId(ord.id);
                          setPaymentAmount(ord.pending_amount);
                          setShowRecordModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                      >
                        Collect Balance
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: All Payment Transactions */}
      {activeTab === 'all' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Payment Code</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Method</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Reference No</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {payments.map(pay => (
                <tr key={pay.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-400">{pay.payment_code}</td>
                  <td className="p-4">
                    <div className="font-bold text-white">{pay.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{pay.customer_company || 'Retail Purchase'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300 font-semibold text-[10px]">
                      {pay.payment_method}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-emerald-400 font-mono text-sm">₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                  <td className="p-4 font-mono text-slate-400 text-[11px]">{pay.reference_number || 'N/A'}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20 text-[10px]">
                      {pay.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[11px]">{new Date(pay.payment_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Payment Modal */}
      {(showRecordModal || isRecordPaymentOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Record Customer Payment</h3>
                <p className="text-xs text-slate-400">Updates outstanding customer balance in real time</p>
              </div>
              <button
                onClick={() => { setShowRecordModal(false); if (setIsRecordPaymentOpen) setIsRecordPaymentOpen(false); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Order</label>
                <select
                  value={selectedOrderId}
                  onChange={e => setSelectedOrderId(e.target.value)}
                  className="glass-input text-xs"
                >
                  {pendingOrders.map(o => (
                    <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                      {o.order_code} - {o.customer_name} (Due: ₹{o.pending_amount})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Collected Amount (₹) *</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="glass-input text-xs font-bold text-emerald-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="glass-input text-xs"
                  >
                    <option value="UPI" className="bg-slate-900 text-white">UPI / QR Code</option>
                    <option value="Bank Transfer" className="bg-slate-900 text-white">NEFT / IMPS Transfer</option>
                    <option value="Cash" className="bg-slate-900 text-white">Cash</option>
                    <option value="Card" className="bg-slate-900 text-white">Card Swipe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. UPI_TXN_9872"
                    value={refNumber}
                    onChange={e => setRefNumber(e.target.value)}
                    className="glass-input text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => { setShowRecordModal(false); if (setIsRecordPaymentOpen) setIsRecordPaymentOpen(false); }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                disabled={savingPayment}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg shadow-emerald-600/30 disabled:opacity-50 active:scale-95 transition-all"
              >
                {savingPayment ? 'Logging...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
