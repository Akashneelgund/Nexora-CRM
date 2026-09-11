import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DealOrder, Product, Customer } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Building,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Smartphone,
  X,
  Trash2,
  Receipt
} from 'lucide-react';

export const SalesPage: React.FC<{
  isNewSaleModalOpen?: boolean;
  setIsNewSaleModalOpen?: (v: boolean) => void;
}> = ({ isNewSaleModalOpen, setIsNewSaleModalOpen }) => {
  const [sales, setSales] = useState<DealOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showNewSaleModal, setShowNewSaleModal] = useState(false);
  const [mobileQuickEntry, setMobileQuickEntry] = useState(false);
  const { showToast, setLowStockAlertProduct } = useNotifications();

  // New Sale Form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ product_id: string; quantity: number }[]>([
    { product_id: 'prod-01', quantity: 1 }
  ]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paidAdvance, setPaidAdvance] = useState(0);
  const [notes, setNotes] = useState('');
  const [savingSale, setSavingSale] = useState(false);

  const fetchSales = () => {
    setLoading(true);
    api.getSales({ dateFilter, search })
      .then(res => {
        if (res.success) setSales(res.orders || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSales();
    api.getProducts().then(r => setProducts(r.products || [])).catch(console.error);
    api.getCustomers().then(r => setCustomers(r.customers || [])).catch(console.error);
  }, [dateFilter, search]);

  const handleAddItem = () => {
    if (products.length > 0) {
      setSelectedItems([...selectedItems, { product_id: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx));
  };

  const handleCreateSale = async () => {
    if (!selectedCustomerId && customers.length > 0) {
      showToast('Select Customer', 'Please choose a customer for this order', 'error');
      return;
    }
    setSavingSale(true);
    try {
      const custId = selectedCustomerId || customers[0]?.id;
      const res = await api.createSale({
        customer_id: custId,
        items: selectedItems,
        discount_amount: discountAmount,
        paid_amount: paidAdvance,
        notes: notes || 'Standard commercial sale transaction'
      });

      if (res.success) {
        showToast('Sale Recorded!', `Order ${res.orderCode} confirmed. Stock decremented automatically.`, 'success');
        setShowNewSaleModal(false);
        setMobileQuickEntry(false);
        if (setIsNewSaleModalOpen) setIsNewSaleModalOpen(false);
        fetchSales();
      }
    } catch (err: any) {
      showToast('Sale Error', err.message || 'Failed to complete sale', 'error');
    } finally {
      setSavingSale(false);
    }
  };

  const calculateSubtotal = () => {
    return selectedItems.reduce((sum, item) => {
      const prod = products.find(p => p.id === item.product_id);
      return sum + (prod ? prod.price * item.quantity : 0);
    }, 0);
  };

  const subtotal = calculateSubtotal();
  const taxable = Math.max(subtotal - discountAmount, 0);
  const taxAmount = Math.round(taxable * 0.18);
  const netAmount = taxable + taxAmount;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Commercial Transactions</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Sales & Orders</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track closed deals, invoices, line items and real-time inventory deductions</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileQuickEntry(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span>30-Sec Mobile Entry</span>
          </button>

          <button
            onClick={() => setShowNewSaleModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* Date Range & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 glass-card">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                dateFilter === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white bg-white/[0.03]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search orders or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            className="glass-input"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">Order Code</th>
              <th className="p-4">Customer & Entity</th>
              <th className="p-4">Sales Rep / Pod</th>
              <th className="p-4">Total Amount</th>
              <th className="p-4">Paid Advance</th>
              <th className="p-4">Pending Balance</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {sales.map(order => (
              <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-mono font-semibold text-indigo-400">{order.order_code}</td>
                <td className="p-4">
                  <div className="font-bold text-white">{order.customer_name}</div>
                  <div className="text-slate-400 text-[11px]">{order.customer_company || 'Retail Client'}</div>
                </td>
                <td className="p-4">
                  <div className="text-slate-200">{order.sales_rep_name}</div>
                  <div className="text-[10px] text-indigo-400 font-mono">{order.team_name}</div>
                </td>
                <td className="p-4 font-bold text-white font-mono">₹{Number(order.net_amount).toLocaleString('en-IN')}</td>
                <td className="p-4 font-semibold text-emerald-400 font-mono">₹{Number(order.paid_amount).toLocaleString('en-IN')}</td>
                <td className="p-4 font-semibold text-amber-300 font-mono">₹{Number(order.pending_amount).toLocaleString('en-IN')}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    order.payment_status === 'Paid' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                    order.payment_status === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' :
                    'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  }`}>
                    {order.payment_status}
                  </span>
                </td>
                <td className="p-4 text-slate-400 font-mono text-[11px]">{new Date(order.sale_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Sale Modal */}
      {(showNewSaleModal || isNewSaleModalOpen || mobileQuickEntry) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">
                  {mobileQuickEntry ? '30-Second Quick Sales Entry' : 'Create Sales Deal & Order'}
                </h3>
                <p className="text-xs text-slate-400">Inventory automatically deducted with real-time stock alert checks</p>
              </div>
              <button
                onClick={() => {
                  setShowNewSaleModal(false);
                  setMobileQuickEntry(false);
                  if (setIsNewSaleModalOpen) setIsNewSaleModalOpen(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer Select */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer / Client Account *</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="glass-input text-xs"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name} ({c.company || c.phone})
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Order Items & Quantities</label>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Product
                </button>
              </div>

              {selectedItems.map((item, idx) => {
                const prod = products.find(p => p.id === item.product_id);
                return (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.08]">
                    <select
                      value={item.product_id}
                      onChange={e => {
                        const updated = [...selectedItems];
                        updated[idx].product_id = e.target.value;
                        setSelectedItems(updated);
                      }}
                      className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                          {p.name} (₹{p.price.toLocaleString('en-IN')} - Stock: {p.stock})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => {
                        const updated = [...selectedItems];
                        updated[idx].quantity = Math.max(1, Number(e.target.value));
                        setSelectedItems(updated);
                      }}
                      className="w-16 px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white text-center font-mono"
                    />

                    {selectedItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calculations Summary */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/[0.08] space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Items:</span>
                <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={e => setDiscountAmount(Number(e.target.value))}
                  className="w-24 px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded text-right text-white font-mono"
                />
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (18%):</span>
                <span className="font-mono">₹{taxAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/[0.08]">
                <span>Net Total:</span>
                <span className="text-emerald-400 font-mono">₹{netAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-white/[0.08]">
                <span>Paid Advance Token (₹):</span>
                <input
                  type="number"
                  value={paidAdvance}
                  onChange={e => setPaidAdvance(Number(e.target.value))}
                  className="w-28 px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded text-right text-emerald-400 font-semibold font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setShowNewSaleModal(false);
                  setMobileQuickEntry(false);
                  if (setIsNewSaleModalOpen) setIsNewSaleModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateSale}
                disabled={savingSale}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-xs text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
              >
                {savingSale ? 'Finalizing Order...' : 'Confirm Sale & Deduct Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

