import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, Mail, ArrowRight, AlertCircle, RefreshCw, Shield, Sparkles } from 'lucide-react';
import ERPLogoSVG from './svg/ERPLogoSVG.jsx';

export default function AuthModal() {
  const { login, quickLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
    } catch (err) {
      setError(err.message || 'Demo authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-md animate-fadeIn">
      {/* Sleek Minimalist Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200/80 p-7 z-10 animate-fadeInScale">
        {/* Header with Minimalist Branding */}
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-100">
          <div className="p-1.5 rounded-xl bg-navy-900 shadow-xs">
            <ERPLogoSVG className="w-6 h-6" animated={false} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              Mini Operations ERP
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Secure
              </span>
            </h2>
            <p className="text-xs text-gray-500">Sign in to access workspace dashboard</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-slideInDown">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@erp.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all bg-gray-50/50 focus:bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all bg-gray-50/50 focus:bg-white text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-navy-900 hover:bg-navy-800 text-white py-2.5 px-4 rounded-xl font-semibold text-xs shadow-xs flex items-center justify-center gap-2 interactive-btn cursor-pointer disabled:opacity-50 transition"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-orange" />
                <span>Signing in...</span>
              </div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Role Quick Access */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 1-Click Demo Roles
            </span>
            <span className="text-[10px] text-gray-400">Quick Test</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="p-2 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100 text-gray-800 text-xs font-semibold interactive-btn text-center cursor-pointer transition"
            >
              Admin
              <span className="block text-[9px] text-gray-500 font-normal">Full Control</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('OPERATIONS_USER')}
              className="p-2 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100 text-gray-800 text-xs font-semibold interactive-btn text-center cursor-pointer transition"
            >
              Operations
              <span className="block text-[9px] text-gray-500 font-normal">Stock & Transfers</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('SALES_USER')}
              className="p-2 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-gray-100 text-gray-800 text-xs font-semibold interactive-btn text-center cursor-pointer transition"
            >
              Sales
              <span className="block text-[9px] text-gray-500 font-normal">Orders & Locks</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
