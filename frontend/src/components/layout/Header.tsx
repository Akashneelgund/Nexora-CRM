import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { api } from '../../services/api';
import {
  Search,
  Bell,
  AlertTriangle,
  Send,
  Plus,
  Check,
  CheckCheck,
  Package,
  CreditCard,
  UserPlus,
  ShoppingBag,
  Menu,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  onOpenCommand: () => void;
  onOpenMobileMenu?: () => void;
  onOpenNewLead?: () => void;
  onOpenNewSale?: () => void;
  onOpenNewPayment?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCommand,
  onOpenMobileMenu,
  onOpenNewLead,
  onOpenNewSale,
  onOpenNewPayment
}) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, showToast, setLowStockAlertProduct } = useNotifications();
  const [notifOpen, setNotifOpen] = useState(false);
  const [waSending, setWaSending] = useState(false);

  const handleTestWhatsAppReport = async () => {
    setWaSending(true);
    try {
      const res = await api.sendTestWhatsAppReport('+91 9986917364');
      if (res.success) {
        showToast(
          'WhatsApp Report Dispatched!',
          'Daily sales & telecalling report sent to +91 9986917364.',
          'success'
        );
      }
    } catch (e: any) {
      showToast('Dispatch Error', e.message || 'Failed to dispatch report', 'error');
    } finally {
      setWaSending(false);
    }
  };

  const handleOpenLowStockDemo = () => {
    setLowStockAlertProduct({
      id: 'prod-03',
      sku: 'NX-PRN-TH80',
      name: 'High-Speed Thermal Receipt Printer 80mm',
      price: 6800,
      cost: 3500,
      stock: 4,
      min_stock: 15
    });
  };

  return (
    <header className="h-16 bg-[#090B10]/80 backdrop-blur-2xl border-b border-white/[0.06] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onOpenCommand}
          className="flex-1 flex items-center justify-between px-3.5 py-2 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.15] rounded-xl text-slate-400 text-xs transition-all group shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
            <span className="hidden sm:inline text-slate-400 group-hover:text-slate-300">Search leads, customers, products, orders...</span>
            <span className="sm:hidden text-slate-400">Search CRM...</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-2 py-0.5 text-[10px] font-medium font-mono text-slate-400 bg-white/[0.06] border border-white/[0.08] rounded-md shadow-sm">
              Ctrl + K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Low Stock Alert Button */}
        <button
          onClick={handleOpenLowStockDemo}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 border border-amber-500/25 text-xs font-semibold transition-all select-none"
          title="Click to view Low Stock Alarms"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Low Stock Alarms</span>
        </button>

        {/* WhatsApp Daily Report Trigger */}
        <button
          onClick={handleTestWhatsAppReport}
          disabled={waSending}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition-all disabled:opacity-50 select-none"
          title="Send WhatsApp Report to +91 9986917364"
        >
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>{waSending ? 'Sending...' : 'Send WhatsApp Report'}</span>
        </button>

        {/* Quick Action Button */}
        {onOpenNewLead && (
          <button
            onClick={onOpenNewLead}
            className="btn-primary"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        )}

        {/* Notification Popover */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] relative transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#090B10] animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-dropdown rounded-2xl z-50 overflow-hidden animate-slide-up">
              <div className="p-3.5 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAsRead('all')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No new notifications.</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs transition-colors cursor-pointer hover:bg-white/[0.04] ${
                        !n.is_read ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white">{n.title}</span>
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1" />}
                      </div>
                      <p className="text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2.5 pl-2.5 border-l border-white/[0.08]">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={user?.name}
            className="w-8 h-8 rounded-xl object-cover border border-white/[0.12]"
          />
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
            <div className="text-[10px] text-indigo-400 font-medium">{user?.role_name}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
