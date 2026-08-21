import React from 'react';
import { NavLink } from 'react-router-dom';
import { Package, Wrench, ArrowLeftRight, ShoppingCart, LayoutDashboard } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/work-orders', label: 'Work Orders', icon: Wrench },
    { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { to: '/customer-orders', label: 'Customer Orders', icon: ShoppingCart },
  ];

  return (
    <aside className="w-16 sm:w-56 bg-surface-card border-r border-surface-border flex flex-col justify-between shrink-0 select-none">
      <div className="py-4">
        <div className="px-4 mb-3 hidden sm:block">
          <span className="text-[11px] font-semibold tracking-wider text-gray-400 uppercase">
            Operations
          </span>
        </div>
        <nav className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-sm shadow-orange-500/20'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 shrink-0 sm:mr-3 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                    <span className="hidden sm:inline-block">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-surface-border text-center sm:text-left">
        <div className="hidden sm:block text-[11px] text-gray-400 leading-tight">
          Mini Operations ERP
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            PostgreSQL Connected
          </div>
        </div>
      </div>
    </aside>
  );
}
