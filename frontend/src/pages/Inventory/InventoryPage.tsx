import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Product } from '../../types';
import { useNotifications } from '../../context/NotificationContext';
import {
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Search,
  Filter,
  Building,
  CheckCircle2,
  X,
  History,
  Sparkles,
  Layers,
  ShoppingBag
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useNotifications();

  // Stock Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [movementType, setMovementType] = useState('Stock Added');
  const [adjustReason, setAdjustReason] = useState('Restock shipment received');
  const [adjusting, setAdjusting] = useState(false);

  // Warehouse Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [fromWh, setFromWh] = useState('wh-blr');
  const [toWh, setToWh] = useState('wh-hbl');
  const [transferProdId, setTransferProdId] = useState('');
  const [transferQty, setTransferQty] = useState(5);
  const [transferring, setTransferring] = useState(false);

  const fetchInventory = () => {
    setLoading(true);
    Promise.all([
      api.getProducts({ search, category: selectedCategory !== 'all' ? selectedCategory : undefined, lowStockOnly: filterLowStock }),
      api.getWarehouses()
    ])
      .then(([prodRes, whRes]) => {
        if (prodRes.success) setProducts(prodRes.products || []);
        if (whRes.success) setWarehouses(whRes.warehouses || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInventory();
  }, [search, selectedCategory, filterLowStock]);

  const handleAdjustStock = async () => {
    if (!selectedProduct || adjustQty === 0) return;
    setAdjusting(true);
    try {
      const res = await api.adjustStock({
        product_id: selectedProduct.id,
        quantity_change: movementType === 'Stock Deducted' ? -Math.abs(adjustQty) : Math.abs(adjustQty),
        movement_type: movementType,
        reason: adjustReason
      });

      if (res.success) {
        showToast('Stock Updated', `New stock for ${selectedProduct.name}: ${res.product.newStock} units`, 'success');
        setSelectedProduct(null);
        fetchInventory();
      }
    } catch (e: any) {
      showToast('Adjustment Error', e.message || 'Failed to update stock', 'error');
    } finally {
      setAdjusting(false);
    }
  };

  const handleTransferStock = async () => {
    if (fromWh === toWh) {
      showToast('Invalid Transfer', 'Origin and Destination warehouses must be different', 'error');
      return;
    }
    const prodId = transferProdId || products[0]?.id;
    if (!prodId) return;

    setTransferring(true);
    try {
      const res = await api.transferStock({
        product_id: prodId,
        from_warehouse_id: fromWh,
        to_warehouse_id: toWh,
        quantity: transferQty,
        notes: 'Inter-warehouse replenishment'
      });

      if (res.success) {
        showToast('Transfer Completed', `Transferred ${transferQty} units between warehouses.`, 'success');
        setTransferModalOpen(false);
        fetchInventory();
      }
    } catch (e: any) {
      showToast('Transfer Error', e.message || 'Failed to transfer stock', 'error');
    } finally {
      setTransferring(false);
    }
  };

  const lowStockCount = products.filter(p => p.stock <= p.min_stock).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const categoriesList = [
    { id: 'all', label: 'All 71 Products' },
    { id: 'cat-yantra', label: 'All Yantra (34)' },
    { id: 'cat-bracelet', label: 'Bracelet (3)' },
    { id: 'cat-chowki', label: 'Chowki (2)' },
    { id: 'cat-general', label: 'General & Mala (15)' },
    { id: 'cat-kit', label: 'Kit (4)' },
    { id: 'cat-ring', label: 'Gemstone Ring (13)' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <Package className="w-3.5 h-3.5" />
            <span>Official Inventory Catalog (71 Products)</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Products & Stock Inventory</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time stock tracking for Sacred Yantras, Gemstone Rings, Chowkis, Worship Kits, and Karungali Malas across warehouses.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-semibold border border-white/[0.08] transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
            <span>Warehouse Transfer</span>
          </button>
        </div>
      </div>

      {/* Warehouse Hubs Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map(wh => (
          <div key={wh.id} className="glass-card p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{wh.name}</h4>
                <p className="text-[10px] text-slate-400">{wh.location} • {wh.code}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {categoriesList.map(c => (
          <button
            key={c.id}
            onClick={() => {
              setSelectedCategory(c.id);
              setFilterLowStock(false);
            }}
            className={'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ' + (
              selectedCategory === c.id && !filterLowStock
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                : 'bg-white/[0.02] text-slate-400 border-white/[0.06] hover:border-white/20'
            )}
          >
            {c.label}
          </button>
        ))}

        <button
          onClick={() => {
            setFilterLowStock(true);
            setSelectedCategory('all');
          }}
          className={'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ' + (
            filterLowStock
              ? 'bg-amber-600 text-white border-amber-400 shadow-md'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
          )}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Low Stock / Out of Stock ({lowStockCount + outOfStockCount})</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 glass-card">
        <div className="text-xs text-slate-400">
          Showing <b className="text-white">{products.length} Products</b> in Catalog
        </div>

        <div className="relative max-w-sm flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Product Name or SKU (0001 - 0071)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
            className="glass-input"
          />
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.02] text-slate-400 border-b border-white/[0.06] font-semibold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="p-4">SKU / Number</th>
              <th className="p-4">Product Name</th>
              <th className="p-4">Category</th>
              <th className="p-4">Unit Price</th>
              <th className="p-4">Qty in Stock</th>
              <th className="p-4">Min. Alert Level</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Quick Stock Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {products.map(prod => {
              const isOut = prod.stock === 0;
              const isLow = prod.stock > 0 && prod.stock <= prod.min_stock;

              return (
                <tr key={prod.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-mono font-bold text-indigo-400">{prod.sku}</td>
                  <td className="p-4">
                    <div className="font-bold text-white text-sm">{prod.name}</div>
                    <div className="text-[11px] text-slate-400">{prod.warehouse_name || 'Bangalore Central Warehouse'}</div>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.06] text-slate-300">
                      {prod.category_name || 'All Yantra'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-white font-mono text-sm">₹{prod.price.toLocaleString('en-IN')}</td>
                  <td className="p-4 font-bold text-sm font-mono">
                    <span className={isOut ? 'text-rose-400' : isLow ? 'text-amber-400' : 'text-emerald-400'}>
                      {prod.stock} units
                    </span>
                  </td>
                  <td className="p-4 text-slate-400 font-mono">{prod.min_stock} units</td>
                  <td className="p-4">
                    <span className={'px-2.5 py-0.5 rounded-full text-[10px] font-semibold ' + (
                      isOut
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 animate-pulse'
                        : isLow
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    )}>
                      {isOut ? 'OUT OF STOCK' : isLow ? 'LOW STOCK ALERT' : 'IN STOCK'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setSelectedProduct(prod)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors"
                    >
                      Adjust Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Adjust Stock Level</h3>
                <p className="text-xs text-indigo-400 font-mono">{selectedProduct.sku} - {selectedProduct.name}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.08] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Stock In-Hand:</span>
                <span className="font-bold text-white font-mono text-sm">{selectedProduct.stock} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unit Price:</span>
                <span className="font-bold text-emerald-400 font-mono">₹{selectedProduct.price.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Stock Added', 'Stock Deducted'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setMovementType(type)}
                      className={'py-2 rounded-xl text-xs font-bold border transition-all ' + (
                        movementType === type
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                          : 'bg-white/[0.03] text-slate-300 border-white/[0.08]'
                      )}
                    >
                      {type === 'Stock Added' ? '➕ Add Stock' : '➖ Deduct / Write-off'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={adjustQty}
                  onChange={e => setAdjustQty(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="e.g. Vendor restock arrival / damaged shipment"
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustStock}
                disabled={adjusting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 active:scale-95"
              >
                {adjusting ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Transfer Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0C101A] border border-white/[0.12] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-base font-bold text-white">Inter-Warehouse Transfer</h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Product to Transfer</label>
                <select
                  value={transferProdId}
                  onChange={e => setTransferProdId(e.target.value)}
                  className="glass-input text-xs"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      {p.sku} - {p.name} ({p.stock} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">From Warehouse</label>
                  <select
                    value={fromWh}
                    onChange={e => setFromWh(e.target.value)}
                    className="glass-input text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-white">{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">To Warehouse</label>
                  <select
                    value={toWh}
                    onChange={e => setToWh(e.target.value)}
                    className="glass-input text-xs"
                  >
                    {warehouses.map(w => (
                      <option key={w.id} value={w.id} className="bg-slate-900 text-white">{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={transferQty}
                  onChange={e => setTransferQty(Number(e.target.value))}
                  className="glass-input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferStock}
                disabled={transferring}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 disabled:opacity-50 active:scale-95"
              >
                {transferring ? 'Transferring...' : 'Execute Warehouse Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
