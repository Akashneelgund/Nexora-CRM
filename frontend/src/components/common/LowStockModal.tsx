import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import { AlertTriangle, Plus, X, Package } from 'lucide-react';

export const LowStockModal: React.FC = () => {
  const { lowStockAlertProduct, setLowStockAlertProduct, showToast } = useNotifications();
  const [addQty, setAddQty] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(false);

  if (!lowStockAlertProduct) return null;

  const handleAddStock = async () => {
    if (!lowStockAlertProduct || addQty <= 0) return;
    setLoading(true);
    try {
      const res = await api.adjustStock({
        product_id: lowStockAlertProduct.id,
        quantity_change: addQty,
        movement_type: 'Stock Added',
        reason: 'Restocked via Low Stock Alert popup'
      });
      if (res.success) {
        showToast('Stock Restocked', `Added ${addQty} units to ${lowStockAlertProduct.name}. New Stock: ${res.product.newStock}`, 'success');
        setLowStockAlertProduct(null);
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update stock', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0C101A] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Amber glow accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
        
        <button
          onClick={() => setLowStockAlertProduct(null)}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Inventory Alert</span>
            <h3 className="text-base font-bold text-white leading-tight">Low Stock Alarm</h3>
          </div>
        </div>

        <div className="bg-white/[0.02] rounded-2xl p-4 border border-white/[0.08] mb-5 space-y-2">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Package className="w-4 h-4 text-indigo-400" />
            <span>{lowStockAlertProduct.name}</span>
          </div>
          <div className="text-xs text-slate-400 font-mono">SKU: <span className="text-indigo-300 font-bold">{lowStockAlertProduct.sku}</span></div>
          
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] mt-2">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Current Stock</div>
              <div className="text-xl font-bold text-rose-400 font-mono">{lowStockAlertProduct.stock} units</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Minimum Required</div>
              <div className="text-xl font-bold text-amber-300 font-mono">{lowStockAlertProduct.min_stock} units</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Quick Add Stock Units
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={addQty}
              onChange={(e) => setAddQty(Number(e.target.value))}
              className="glass-input text-xs font-mono font-bold text-emerald-400"
            />
            <button
              onClick={handleAddStock}
              disabled={loading || addQty <= 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Restocking...' : 'Restock Now'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-white/[0.08] pt-4">
          <button
            onClick={() => setLowStockAlertProduct(null)}
            className="px-4 py-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
          >
            Dismiss Alert
          </button>
        </div>
      </div>
    </div>
  );
};
