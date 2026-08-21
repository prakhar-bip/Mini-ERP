import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Wrench, ArrowLeftRight, ShoppingCart } from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();

  const allNavItems = [
    { to: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'OPERATIONS_USER', 'SALES_USER'] },
    { to: '/work-orders', label: 'Work Orders', icon: Wrench, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight, roles: ['ADMIN', 'OPERATIONS_USER'] },
    { to: '/customer-orders', label: 'Customer Orders', icon: ShoppingCart, roles: ['ADMIN', 'SALES_USER'] },
  ];

  // Dynamically filter navigation links based on user's authorized role
  const navItems = user
    ? allNavItems.filter((item) => item.roles.includes(user.role))
    : allNavItems;

  const getRoleHeaderLabel = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin Portal';
      case 'OPERATIONS_USER':
        return 'Operations Portal';
      case 'SALES_USER':
        return 'Sales Portal';
      default:
        return 'Operations';
    }
  };

  return (
    <aside className="w-16 sm:w-56 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 select-none shadow-xs">
      <div className="py-4">
        <div className="px-4 mb-2.5 hidden sm:flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
            {getRoleHeaderLabel(user?.role)}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        </div>
        <nav className="space-y-1 px-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className="flex items-center">
                    <Icon
                      className={`w-4 h-4 shrink-0 sm:mr-2.5 transition-colors ${
                        isActive ? 'text-brand-orange' : 'text-gray-400 group-hover:text-gray-700'
                      }`}
                    />
                    <span className="hidden sm:inline-block font-semibold">{item.label}</span>
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-3.5 border-t border-gray-100 bg-gray-50/50">
        <div className="hidden sm:block text-[11px] text-gray-500 leading-tight">
          <div className="font-semibold text-gray-700">Mini ERP</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
