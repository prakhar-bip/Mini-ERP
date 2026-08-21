import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, Bell, LogOut, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';

export default function Header() {
  const { user, logout, quickLogin } = useAuth();
  const [switching, setSwitching] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>;
      case 'OPERATIONS_USER':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-medium">Operations</span>;
      case 'SALES_USER':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium">Sales</span>;
      default:
        return null;
    }
  };

  const handleRoleSwitch = async (role) => {
    setSwitching(true);
    try {
      await quickLogin(role);
    } catch (e) {
      console.error(e);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="h-14 bg-navy-900 text-white flex items-center justify-between px-4 border-b border-navy-800 select-none z-30 sticky top-0">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-orange to-amber-500 flex items-center justify-center font-bold text-white shadow-md shadow-orange-950/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide uppercase text-white flex items-center gap-2">
            Mini Operations ERP
            <span className="text-[10px] font-normal px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
              v1.0
            </span>
          </h1>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center bg-navy-800/80 border border-navy-700/80 rounded-full px-3.5 py-1.5 w-96 text-sm text-gray-300 focus-within:border-brand-orange transition-all">
        <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
        <input
          type="text"
          placeholder="Search items, orders, batch ID..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-400 w-full"
        />
        <kbd className="hidden sm:inline-block text-[10px] bg-navy-700 text-gray-300 px-1.5 py-0.5 rounded border border-navy-600 font-mono">
          Ctrl K
        </kbd>
      </div>

      {/* Right Controls & User Role Switcher */}
      <div className="flex items-center space-x-3">
        {/* Quick Role Switcher Buttons */}
        <div className="hidden lg:flex items-center bg-navy-800 rounded-lg p-1 border border-navy-700 space-x-1 text-xs">
          <span className="text-gray-400 px-1.5 font-medium text-[11px] flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${switching ? 'animate-spin' : ''}`} /> Switch:
          </span>
          <button
            onClick={() => handleRoleSwitch('ADMIN')}
            className={`px-2 py-0.5 rounded transition ${user?.role === 'ADMIN' ? 'bg-brand-orange text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-navy-700'}`}
          >
            Admin
          </button>
          <button
            onClick={() => handleRoleSwitch('OPERATIONS_USER')}
            className={`px-2 py-0.5 rounded transition ${user?.role === 'OPERATIONS_USER' ? 'bg-brand-orange text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-navy-700'}`}
          >
            Ops
          </button>
          <button
            onClick={() => handleRoleSwitch('SALES_USER')}
            className={`px-2 py-0.5 rounded transition ${user?.role === 'SALES_USER' ? 'bg-brand-orange text-white font-medium shadow-sm' : 'text-gray-300 hover:bg-navy-700'}`}
          >
            Sales
          </button>
        </div>

        {/* User Info Avatar */}
        <div className="flex items-center space-x-2 pl-2 border-l border-navy-700">
          <div className="w-8 h-8 rounded-full bg-navy-700 border border-navy-600 flex items-center justify-center text-xs font-semibold text-white">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-medium text-white leading-tight">{user?.name}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {getRoleBadge(user?.role)}
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-navy-800 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
