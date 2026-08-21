import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import { ChevronRight, Database } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const getBreadcrumb = (path) => {
    switch (path) {
      case '/inventory':
        return 'Inventory & Stock Management';
      case '/work-orders':
        return 'Production & Work Orders';
      case '/transfers':
        return 'Internal Stock Transfers';
      case '/customer-orders':
        return 'Customer Orders & Reservation';
      default:
        return 'Operations Dashboard';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-canvas text-gray-900">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 flex flex-col overflow-y-auto">
          {/* Sub-Header & Breadcrumb Bar */}
          <div className="bg-surface-card border-b border-surface-border px-6 py-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <span className="font-medium text-gray-700">Operations</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-semibold text-gray-900">{getBreadcrumb(location.pathname)}</span>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium text-[11px]">
                <Database className="w-3 h-3 text-emerald-600" />
                <span>Active DB</span>
              </div>
            </div>
          </div>

          {/* Main View Container */}
          <div className="p-6 flex-1">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
