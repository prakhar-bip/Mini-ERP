import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, LogOut, RefreshCw, UserCheck } from 'lucide-react';
import ERPLogoSVG from './svg/ERPLogoSVG.jsx';

export default function Header() {
  const { user, logout, quickLogin } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[9px] px-1.5 py-0.2 rounded font-medium">Admin</span>;
      case 'OPERATIONS_USER':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] px-1.5 py-0.2 rounded font-medium">Operations</span>;
      case 'SALES_USER':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-medium">Sales</span>;
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
    <header className="h-13 bg-navy-900 text-white flex items-center justify-between px-4 border-b border-navy-800 select-none z-30 sticky top-0 shadow-xs backdrop-blur-md">
      {/* Brand Logo & Title */}
      <div className="flex items-center space-x-3 group">
        <div className="p-1 rounded-lg bg-navy-800 border border-navy-700 shadow-xs">
          <ERPLogoSVG className="w-5 h-5" animated={false} />
        </div>
        <div>
          <h1 className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-2">
            Mini Operations ERP
            <span className="text-[9px] font-normal px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live
            </span>
          </h1>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className={`hidden md:flex items-center bg-navy-800/80 border rounded-lg px-3 py-1 text-xs text-gray-300 transition-all duration-200 ${
        searchFocused ? 'w-80 border-brand-orange ring-1 ring-brand-orange/20' : 'w-64 border-navy-700'
      }`}>
        <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${searchFocused ? 'text-brand-orange' : 'text-gray-400'}`} />
        <input
          type="text"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search items, orders, transfers..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-400 w-full"
        />
        <kbd className="hidden sm:inline-block text-[9px] bg-navy-700 text-gray-300 px-1 py-0.5 rounded border border-navy-600 font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right Controls & User Role Switcher */}
      <div className="flex items-center space-x-3">
        {user ? (
          <>
            {/* Quick Role Switcher Buttons */}
            <div className="hidden lg:flex items-center bg-navy-800/80 rounded-lg p-0.5 border border-navy-700 space-x-1 text-xs">
              <span className="text-gray-400 px-1.5 text-[10px] font-medium flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 ${switching ? 'animate-spin text-brand-orange' : ''}`} /> Switch:
              </span>
              <button
                onClick={() => handleRoleSwitch('ADMIN')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  user?.role === 'ADMIN'
                    ? 'bg-brand-orange text-white font-semibold'
                    : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => handleRoleSwitch('OPERATIONS_USER')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  user?.role === 'OPERATIONS_USER'
                    ? 'bg-brand-orange text-white font-semibold'
                    : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                }`}
              >
                Ops
              </button>
              <button
                onClick={() => handleRoleSwitch('SALES_USER')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                  user?.role === 'SALES_USER'
                    ? 'bg-brand-orange text-white font-semibold'
                    : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                }`}
              >
                Sales
              </button>
            </div>

            {/* User Info Avatar */}
            <div className="flex items-center space-x-2 pl-2 border-l border-navy-700">
              <div className="w-7 h-7 rounded-lg bg-navy-800 border border-navy-600 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">{user?.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getRoleBadge(user?.role)}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-navy-800 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <UserCheck className="w-3.5 h-3.5 text-gray-400" />
            <span>Authentication Required</span>
          </div>
        )}
      </div>
    </header>
  );
}
