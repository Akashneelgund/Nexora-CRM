import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PhoneCall, UserCheck, ShoppingBag, MessageSquare, CreditCard, Package } from 'lucide-react';

interface MobileNavProps {
  onOpenMobileSales?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = () => {
  const items = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/calling', label: 'Call Desk', icon: PhoneCall },
    { to: '/leads', label: 'Leads', icon: UserCheck },
    { to: '/sales', label: 'Sales', icon: ShoppingBag },
    { to: '/chat', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090B10]/95 backdrop-blur-2xl border-t border-white/[0.08] z-40 px-2 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }: { isActive: boolean }) =>
              `flex flex-col items-center justify-center gap-1 w-14 py-1 text-xs transition-all relative ${
                isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute -top-1 w-6 h-0.5 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};
