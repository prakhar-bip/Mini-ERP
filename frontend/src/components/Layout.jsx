import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Header from './Header.jsx';
import Sidebar from './Sidebar.jsx';
import AuthModal from './AuthModal.jsx';
import { ChevronRight, Database, Package, Wrench, ArrowLeftRight, ShoppingCart, Sparkles } from 'lucide-react';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();

  const getBreadcrumbInfo = (path) => {
    switch (path) {
      case '/inventory':
        return { label: 'Inventory & Stock Management', icon: Package, badge: 'Realtime Stock' };
      case '/work-orders':
        return { label: 'Production & Work Orders', icon: Wrench, badge: 'Material Shortage Engine' };
      case '/transfers':
        return { label: 'Internal Stock Transfers', icon: ArrowLeftRight, badge: 'ACID Double-Entry' };
      case '/customer-orders':
        return { label: 'Customer Orders & Reservation', icon: ShoppingCart, badge: 'Row-Lock Protected' };
      default:
        return { label: 'Operations Dashboard', icon: Sparkles, badge: 'Active' };
    }
  };

  const breadcrumb = getBreadcrumbInfo(location.pathname);
  const CurrentIcon = breadcrumb.icon;

  return (
    <div className="relative min-h-screen flex flex-col bg-surface-canvas text-gray-900 selection:bg-brand-orange selection:text-white overflow-hidden">
      {/* Dashboard Foundation Layer - Blurs smoothly when unauthenticated */}
      <div
        className={`min-h-screen flex flex-col flex-1 transition-all duration-700 ${
          !user
            ? 'filter blur-md opacity-60 pointer-events-none select-none scale-[0.99]'
            : 'filter blur-0 opacity-100 scale-100'
        }`}
      >
        <Header />
        
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 flex flex-col overflow-y-auto">
            {/* Minimal Sub-Header & Breadcrumb Bar */}
            <div className="bg-white/80 backdrop-blur-xs border-b border-gray-200/80 px-6 py-2 flex items-center justify-between shadow-2xs sticky top-0 z-20">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="font-medium text-gray-500">Operations</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                  <CurrentIcon className="w-3.5 h-3.5 text-brand-orange" />
                  <span>{breadcrumb.label}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-medium text-[10px]">
                  <Database className="w-3 h-3 text-emerald-600" />
                  <span>PostgreSQL Active</span>
                </div>
              </div>
            </div>

            {/* Main View Container with Smooth Route Transition Animation */}
            <div key={location.pathname} className="p-6 flex-1 animate-fadeIn">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Auth Modal Overlay when user is not logged in */}
      {!user && <AuthModal />}
    </div>
  );
}
