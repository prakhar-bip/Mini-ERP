import React, { useState, useEffect } from 'react';
import { transferAPI, masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowLeftRight, Plus, Send, CheckCircle2, AlertCircle, RefreshCw, ArrowRight, Truck, PackageCheck } from 'lucide-react';

export default function TransfersScreen() {
  const { hasRole } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'REQUESTED' | 'DISPATCHED' | 'RECEIVED'
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    transferNumber: '',
    sourceLocationId: '',
    destLocationId: '',
    itemId: '',
    quantity: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trRes, locRes, itemRes] = await Promise.all([
        transferAPI.getTransfers(activeTab !== 'ALL' ? { status: activeTab } : undefined),
        masterAPI.getLocations(),
        masterAPI.getItems()
      ]);
      setTransfers(trRes.data.data);
      setLocations(locRes.data.data);
      setItems(itemRes.data.data);

      if (locRes.data.data.length >= 2) {
        if (!formData.sourceLocationId) {
          setFormData((prev) => ({
            ...prev,
            sourceLocationId: locRes.data.data[0].id,
            destLocationId: locRes.data.data[1].id
          }));
        }
      }
      if (itemRes.data.data.length > 0 && !formData.itemId) {
        setFormData((prev) => ({ ...prev, itemId: itemRes.data.data[0].id }));
      }
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateTransfer = async (e) => {
    e.preventDefault();
    if (!hasRole(['ADMIN', 'OPERATIONS_USER'])) {
      showNotification('error', 'Only Admin or Operations User can request transfers.');
      return;
    }

    if (formData.sourceLocationId === formData.destLocationId) {
      showNotification('error', 'Source and Destination locations must be different.');
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (!qty || qty <= 0) {
      showNotification('error', 'Quantity must be greater than 0.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await transferAPI.createTransfer({
        transferNumber: formData.transferNumber.trim() || undefined,
        sourceLocationId: formData.sourceLocationId,
        destLocationId: formData.destLocationId,
        itemId: formData.itemId,
        quantity: qty
      });
      showNotification('success', `Transfer ${res.data.data.transferNumber} created successfully!`);
      setShowModal(false);
      setFormData((prev) => ({ ...prev, transferNumber: '', quantity: '' }));
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDispatch = async (id) => {
    try {
      setActionLoading(true);
      const res = await transferAPI.dispatchTransfer(id);
      showNotification('success', res.data.message || 'Transfer dispatched! Source inventory reduced.');
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReceive = async (id) => {
    try {
      setActionLoading(true);
      const res = await transferAPI.receiveTransfer(id);
      showNotification('success', res.data.message || 'Transfer received! Destination inventory increased.');
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">Requested</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px] flex items-center gap-1 inline-flex"><Truck className="w-3 h-3 text-amber-600" /> In-Transit</span>;
      case 'RECEIVED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] flex items-center gap-1 inline-flex"><PackageCheck className="w-3 h-3 text-emerald-600" /> Received</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 shadow-md transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-card p-5 rounded-xl border border-surface-border shadow-xs gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-brand-orange" />
            Internal Stock Transfers
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Inter-warehouse inventory movements with double-entry ACID consistency
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 text-gray-500 hover:text-gray-900 border border-surface-border rounded-lg bg-surface-muted hover:bg-gray-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {hasRole(['ADMIN', 'OPERATIONS_USER']) && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-orange hover:bg-brand-hover text-white px-4 py-2 rounded-lg font-medium text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Request Transfer
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5 shadow-xs">
        {/* Filter Tabs with Orange Active Line */}
        <div className="flex items-center space-x-6 text-xs font-semibold pb-3 border-b border-surface-border mb-4">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[13px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Transfers
          </button>
          <button
            onClick={() => setActiveTab('REQUESTED')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'REQUESTED'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[13px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Requested
          </button>
          <button
            onClick={() => setActiveTab('DISPATCHED')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'DISPATCHED'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[13px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            In-Transit (Dispatched)
          </button>
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`pb-3 relative transition cursor-pointer ${
              activeTab === 'RECEIVED'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[13px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Received
          </button>
        </div>

        {/* Transfers Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-500 bg-surface-muted/50 font-semibold">
                <th className="py-3 px-3">Transfer ID</th>
                <th className="py-3 px-3">Route (Source $\rightarrow$ Destination)</th>
                <th className="py-3 px-3">Item & Quantity</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Timeline</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                    No transfers found in this view.
                  </td>
                </tr>
              ) : (
                transfers.map((tr) => (
                  <tr key={tr.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {tr.transferNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 font-medium text-gray-800">
                        <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-gray-700">
                          {tr.sourceLocation.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="px-2 py-0.5 bg-gray-100 rounded border border-gray-200 text-gray-700">
                          {tr.destLocation.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{tr.item.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        Qty: <strong className="text-gray-800 text-xs">{tr.quantity}</strong> {tr.item.unit} ({tr.item.sku})
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {getStatusBadge(tr.status)}
                    </td>
                    <td className="py-3 px-3 text-center text-[10px] text-gray-500">
                      {tr.dispatchedAt && (
                        <div>Dispatched: {new Date(tr.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                      {tr.receivedAt && (
                        <div>Received: {new Date(tr.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      )}
                      {!tr.dispatchedAt && <div>Created: {new Date(tr.createdAt).toLocaleDateString()}</div>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {tr.status === 'REQUESTED' && hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                        <button
                          onClick={() => handleDispatch(tr.id)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-medium transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Send className="w-3 h-3" /> Dispatch Stock
                        </button>
                      )}
                      {tr.status === 'DISPATCHED' && hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                        <button
                          onClick={() => handleReceive(tr.id)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <PackageCheck className="w-3 h-3" /> Receive Stock
                        </button>
                      )}
                      {tr.status === 'RECEIVED' && (
                        <span className="text-[11px] text-emerald-700 font-medium">Delivered</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-brand-orange" />
                Request Internal Stock Transfer
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Transfer Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TR-1002 (Auto-generated if empty)"
                  value={formData.transferNumber}
                  onChange={(e) => setFormData({ ...formData, transferNumber: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Source Location (From)</label>
                <select
                  value={formData.sourceLocationId}
                  onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Destination Location (To)</label>
                <select
                  value={formData.destLocationId}
                  onChange={(e) => setFormData({ ...formData, destLocationId: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Item to Transfer</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                >
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Transfer Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 40"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                <strong>Important Rule:</strong> Stock reduces from source on <em>Dispatch</em>. Destination stock will <em>NOT</em> increase until <em>Received</em>.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-surface-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-surface-border text-gray-600 rounded-lg text-xs hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-brand-orange hover:bg-brand-hover text-white rounded-lg text-xs font-medium shadow-md shadow-orange-500/20 transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Creating...' : 'Submit Transfer Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
