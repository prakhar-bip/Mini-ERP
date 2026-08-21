import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center px-4 py-12 select-none relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-orange/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-surface-card rounded-2xl shadow-2xl border border-surface-border p-8 z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-orange to-amber-500 text-white shadow-lg shadow-orange-500/20 mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Mini Operations ERP</h2>
          <p className="text-xs text-gray-500 mt-1">
            Enterprise Operations, Stock Transfers & Concurrency Engine
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@erp.com"
                className="w-full pl-9 pr-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs border border-surface-border rounded-lg focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-orange hover:bg-brand-hover text-white py-2.5 px-4 rounded-lg font-medium text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Click Quick Demo Login Section */}
        <div className="mt-6 pt-5 border-t border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> 1-Click Role Login
            </span>
            <span className="text-[10px] text-gray-400">For Quick Evaluation</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="p-2 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-800 text-[11px] font-medium transition text-center cursor-pointer"
            >
              👑 Admin
              <span className="block text-[9px] text-red-600 font-normal">Full Access</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('OPERATIONS_USER')}
              className="p-2 rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-800 text-[11px] font-medium transition text-center cursor-pointer"
            >
              ⚙️ Operations
              <span className="block text-[9px] text-blue-600 font-normal">Inventory/Transfers</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('SALES_USER')}
              className="p-2 rounded-lg border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-[11px] font-medium transition text-center cursor-pointer"
            >
              🛒 Sales
              <span className="block text-[9px] text-emerald-600 font-normal">Orders/Reserve</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
