import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          info: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/30 bg-[#0C141E]/95 text-emerald-100 shadow-emerald-950/40',
          error: 'border-rose-500/30 bg-[#1A0D14]/95 text-rose-100 shadow-rose-950/40',
          warning: 'border-amber-500/30 bg-[#1A140D]/95 text-amber-100 shadow-amber-950/40',
          info: 'border-indigo-500/30 bg-[#0E1322]/95 text-indigo-100 shadow-indigo-950/40',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-slide-up transition-all ${borders[toast.type]}`}
          >
            <div className="p-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
              {icons[toast.type]}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight text-white">{toast.title}</h4>
              <p className="text-[11px] mt-0.5 text-slate-300 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
