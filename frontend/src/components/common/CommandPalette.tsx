import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck, Users, ShoppingBag, CreditCard, Package, PlusCircle, MessageSquare, BarChart3, Settings, ArrowRight, X } from 'lucide-react';
import { api } from '../../services/api';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewLead?: () => void;
  onOpenNewSale?: () => void;
  onOpenNewPayment?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenNewLead,
  onOpenNewSale,
  onOpenNewPayment
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ leads: any[]; customers: any[]; products: any[] }>({
    leads: [],
    customers: [],
    products: []
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ leads: [], customers: [], products: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [leadsRes, custRes, prodRes] = await Promise.all([
          api.getLeads({ search: query, limit: 4 }),
          api.getCustomers({ search: query, limit: 4 }),
          api.getProducts({ search: query, limit: 4 })
        ]);
        setResults({
          leads: leadsRes.leads || [],
          customers: custRes.customers || [],
          products: prodRes.products || []
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Pipeline Kanban', icon: <UserCheck className="w-4 h-4 text-blue-400" />, action: () => { navigate('/leads'); onClose(); } },
    { label: 'Pending Payments', icon: <CreditCard className="w-4 h-4 text-amber-400" />, action: () => { navigate('/payments'); onClose(); } },
    { label: 'Inventory Catalog', icon: <Package className="w-4 h-4 text-emerald-400" />, action: () => { navigate('/inventory'); onClose(); } },
    { label: 'Team Leaderboard', icon: <BarChart3 className="w-4 h-4 text-purple-400" />, action: () => { navigate('/teams'); onClose(); } },
    { label: 'Internal Chat Lounge', icon: <MessageSquare className="w-4 h-4 text-indigo-400" />, action: () => { navigate('/chat'); onClose(); } },
    { label: 'Role & Permissions Matrix', icon: <Settings className="w-4 h-4 text-slate-400" />, action: () => { navigate('/settings'); onClose(); } },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="w-5 h-5 text-indigo-400" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command or search leads, customers, products (Ctrl+K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-white/[0.06] border border-white/[0.1] rounded-lg">ESC</kbd>
        </div>

        {/* Body */}
        <div className="p-3 overflow-y-auto divide-y divide-white/[0.04] space-y-3">
          {/* Quick Actions if query is empty */}
          {!query && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Navigation & Workflows
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {quickNav.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={item.action}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] text-left text-xs font-semibold text-slate-300 hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && (
            <>
              {results.leads.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" /> Leads ({results.leads.length})
                  </div>
                  {results.leads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => { navigate(`/leads/${lead.id}`); onClose(); }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer text-xs text-slate-200 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">{lead.name}</div>
                        <div className="text-[11px] text-slate-400">{lead.phone} • {lead.source} • <span className="text-indigo-400 font-mono">{lead.lead_code}</span></div>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-slate-300">{lead.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {results.customers.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Customers ({results.customers.length})
                  </div>
                  {results.customers.map(cust => (
                    <div
                      key={cust.id}
                      onClick={() => { navigate('/customers'); onClose(); }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer text-xs text-slate-200 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">{cust.name}</div>
                        <div className="text-[11px] text-slate-400">{cust.company || cust.phone}</div>
                      </div>
                      <div className="text-xs font-bold text-emerald-400 font-mono">₹{cust.total_sales.toLocaleString('en-IN')}</div>
                    </div>
                  ))}
                </div>
              )}

              {results.products.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" /> Inventory Products ({results.products.length})
                  </div>
                  {results.products.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => { navigate('/inventory'); onClose(); }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] cursor-pointer text-xs text-slate-200 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">{prod.name}</div>
                        <div className="text-[11px] text-slate-400">SKU: <span className="font-mono text-indigo-400">{prod.sku}</span> • Price: <span className="font-mono text-emerald-400">₹{prod.price.toLocaleString('en-IN')}</span></div>
                      </div>
                      <div className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full font-mono ${prod.stock <= prod.min_stock ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-white/[0.05] text-slate-300'}`}>
                        Stock: {prod.stock}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.leads.length === 0 && results.customers.length === 0 && results.products.length === 0 && !loading && (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No matching leads, customers, or products found for "{query}".
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-black/40 border-t border-white/[0.08] text-[10px] text-slate-500 flex justify-between items-center">
          <span>Navigate with <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded">↓</kbd> and select with <kbd className="px-1.5 py-0.5 bg-white/[0.06] rounded">↵ Enter</kbd></span>
          <span className="font-semibold text-slate-400">NEXORA Command Center</span>
        </div>
      </div>
    </div>
  );
};
