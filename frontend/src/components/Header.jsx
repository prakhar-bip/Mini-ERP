import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Search, LogOut, User, Shield } from 'lucide-react';
import ERPLogoSVG from './svg/ERPLogoSVG.jsx';

export default function Header() {
  const { user, logout } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-red-500/15 text-red-300 border border-red-500/25 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide">
            Administrator
          </span>
        );
      case 'OPERATIONS_USER':
        return (
          <span className="bg-blue-500/15 text-blue-300 border border-blue-500/25 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide">
            Operations
          </span>
        );
      case 'SALES_USER':
        return (
          <span className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide">
            Sales
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="h-14 bg-navy-900 text-white flex items-center justify-between px-5 border-b border-navy-800 select-none z-30 sticky top-0 shadow-xs">
      {/* Brand Mark & Platform Name */}
      <div className="flex items-center space-x-3">
        <div className="p-1.5 rounded-xl bg-navy-800 border border-navy-700/80 shadow-xs flex items-center justify-center">
          <ERPLogoSVG className="w-5 h-5" animated={false} />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold tracking-wider uppercase text-white">
            Mini Operations ERP
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Enterprise
          </span>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className={`hidden md:flex items-center bg-navy-800/80 border rounded-xl px-3.5 py-1.5 text-xs text-gray-300 transition-all duration-200 ${
        searchFocused ? 'w-80 border-brand-orange ring-2 ring-brand-orange/20' : 'w-64 border-navy-700/70'
      }`}>
        <Search className={`w-3.5 h-3.5 mr-2 shrink-0 ${searchFocused ? 'text-brand-orange' : 'text-gray-400'}`} />
        <input
          type="text"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search SKU, batch, orders..."
          className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-400 w-full"
        />
        <kbd className="hidden sm:inline-block text-[9px] bg-navy-700 text-gray-300 px-1.5 py-0.5 rounded border border-navy-600 font-mono">
          ⌘K
        </kbd>
      </div>

      {/* Right User Profile & Actions */}
      <div className="flex items-center space-x-3">
        {user ? (
          <div className="flex items-center space-x-3">
            {/* User Profile Tag */}
            <div className="flex items-center space-x-2.5 bg-navy-800/70 px-3 py-1.5 rounded-xl border border-navy-700/80 shadow-xs">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-brand-orange to-amber-500 text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-gray-100 leading-tight">
                  {user?.name}
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  {user?.email}
                </span>
              </div>
              <div className="ml-1">
                {getRoleBadge(user?.role)}
              </div>
            </div>

            {/* Logout Action Button */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-navy-800/90 rounded-xl border border-navy-700/60 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs text-gray-400 bg-navy-800/60 px-3 py-1.5 rounded-xl border border-navy-700">
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span>Sign In Required</span>
          </div>
        )}
      </div>
    </header>
  );
}
