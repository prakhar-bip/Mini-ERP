import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Mail, AlertCircle, Sparkles, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import ERPLogoSVG from '../components/svg/ERPLogoSVG.jsx';
import SupplyChainHeroSVG from '../components/svg/SupplyChainHeroSVG.jsx';

export default function LoginScreen() {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();

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
      navigate('/inventory');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role) => {
    setError('');
    setLoading(true);
    try {
      await quickLogin(role);
      navigate('/inventory');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center px-4 py-8 select-none relative overflow-hidden">
      {/* Background glowing gradients & ambient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-orange/20 rounded-full blur-3xl pointer-events-none animate-pulseSlow"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulseSlow"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-800/30 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Split Content Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Animated Vector Graphic & Value Prop */}
        <div className="hidden lg:flex lg:col-span-6 flex-col items-center justify-center text-center p-6 space-y-4 animate-fadeIn">
          <div className="w-full max-w-sm">
            <SupplyChainHeroSVG className="w-full h-auto drop-shadow-2xl" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <span>Next-Gen Operations Engine</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Real-time multi-warehouse inventory, double-entry stock transit, and PostgreSQL ACID row-level locking.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2 text-[11px] text-gray-300">
              <span className="flex items-center gap-1 bg-navy-800/80 px-2.5 py-1 rounded-full border border-navy-700">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 0% Oversell
              </span>
              <span className="flex items-center gap-1 bg-navy-800/80 px-2.5 py-1 rounded-full border border-navy-700">
                <CheckCircle2 className="w-3 h-3 text-brand-orange" /> Real-time Stock
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto bg-surface-card rounded-2xl shadow-2xl border border-surface-border p-8 animate-fadeInScale">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-navy-900 border border-navy-700 shadow-xl mb-3 group hover:scale-105 transition-transform duration-300">
              <ERPLogoSVG className="w-10 h-10" animated={true} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Mini Operations ERP</h2>
            <p className="text-xs text-gray-500 mt-1">
              Sign in to manage warehouse stock & orders
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-slideInDown">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@erp.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all bg-surface-muted focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-surface-border rounded-xl focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all bg-surface-muted focus:bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 interactive-btn cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Quick Demo Login Section */}
          <div className="mt-6 pt-5 border-t border-surface-border">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Role Login
              </span>
              <span className="text-[10px] text-gray-400 font-mono">1-Click Test</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="p-2.5 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100/90 text-red-800 text-[11px] font-bold interactive-btn text-center cursor-pointer shadow-xs group"
              >
                <div className="group-hover:scale-110 transition-transform">👑 Admin</div>
                <span className="block text-[9px] text-red-600 font-medium">Full Access</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('OPERATIONS_USER')}
                className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/90 text-blue-800 text-[11px] font-bold interactive-btn text-center cursor-pointer shadow-xs group"
              >
                <div className="group-hover:scale-110 transition-transform">⚙️ Ops</div>
                <span className="block text-[9px] text-blue-600 font-medium">Stock/Transfers</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('SALES_USER')}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-800 text-[11px] font-bold interactive-btn text-center cursor-pointer shadow-xs group"
              >
                <div className="group-hover:scale-110 transition-transform">🛒 Sales</div>
                <span className="block text-[9px] text-emerald-600 font-medium">Orders/Lock</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
