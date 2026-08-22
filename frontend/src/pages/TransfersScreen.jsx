import React, { useState, useEffect } from 'react';
import { transferAPI, masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ArrowLeftRight, Plus, Send, CheckCircle2, RefreshCw, ArrowRight, Truck, PackageCheck, AlertCircle, Clock, Check } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import Toast from '../components/common/Toast.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';
import EmptyStateSVG from '../components/svg/EmptyStateSVG.jsx';
import TransferRouteSVG from '../components/svg/TransferRouteSVG.jsx';

export default function TransfersScreen() {
  const { user, hasRole } = useAuth();
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

  const fetchData = async (showSkeleton = false) => {
    if (!user) {
      setTransfers([
        {
          id: 'preview-tr-1',
          transferNumber: 'TR-2026-001',
          status: 'DISPATCHED',
          quantity: 40,
          dispatchedAt: new Date().toISOString(),
          sourceLocation: { name: 'Main Warehouse', code: 'WH-MAIN' },
          destLocation: { name: 'Regional Hub East', code: 'WH-EAST' },
          item: { name: 'Lithium Iron Phosphate Cell', sku: 'RAW-LITH-01', unit: 'pcs' }
        },
        {
          id: 'preview-tr-2',
          transferNumber: 'TR-2026-002',
          status: 'REQUESTED',
          quantity: 20,
          createdAt: new Date().toISOString(),
          sourceLocation: { name: 'Main Hub', code: 'WH-MAIN' },
          destLocation: { name: 'Regional Hub', code: 'WH-WEST' },
          item: { name: 'Aluminium Battery Enclosure', sku: 'RAW-ALUM-02', unit: 'pcs' }
        }
      ]);
      setLocations([{ id: 'loc-1', name: 'Main Hub', code: 'WH-MAIN' }]);
      setItems([{ id: 'item-1', name: 'Lithium Cell', sku: 'RAW-LITH-01' }]);
      setLoading(false);
      return;
    }

    try {
      if (showSkeleton) setLoading(true);
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
    fetchData(true);
  }, [user, activeTab]);

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
      await fetchData(false);
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
      await fetchData(false);
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
      await fetchData(false);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">Requested</span>;
      case 'DISPATCHED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] flex items-center gap-1.5 inline-flex animate-pulseSlow">
            <Truck className="w-3.5 h-3.5 text-amber-600 animate-bounce" /> In-Transit
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1.5 inline-flex">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Received
          </span>
        );
      default:
        return null;
    }
  };

  const requestedCount = transfers.filter(t => t.status === 'REQUESTED').length;
  const dispatchedCount = transfers.filter(t => t.status === 'DISPATCHED').length;
  const receivedCount = transfers.filter(t => t.status === 'RECEIVED').length;

  const latestInTransit = transfers.find(t => t.status === 'DISPATCHED');

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast notification={notification} onClose={() => setNotification(null)} />

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Transfers</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{transfers.length}</div>
            <span className="text-[10px] text-gray-500 font-medium mt-1 block">Inter-Warehouse Moves</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pending</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{requestedCount}</div>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" /> Ready at Source
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">In Transit</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{dispatchedCount}</div>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
              <Truck className="w-3 h-3 animate-pulseSlow" /> Moving
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{receivedCount}</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Done
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Live In-Transit SVG Route Showcase (if any transit exists) */}
      {latestInTransit && (
        <div className="bg-surface-card rounded-2xl border border-amber-200/80 p-5 shadow-xs animate-fadeIn">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                Active Transit: <span className="font-mono text-brand-orange">{latestInTransit.transferNumber}</span>
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-gray-500">
              {latestInTransit.item.name} ({latestInTransit.quantity} {latestInTransit.item.unit})
            </span>
          </div>
          <TransferRouteSVG
            sourceName={latestInTransit.sourceLocation.name}
            destName={latestInTransit.destLocation.name}
            status="DISPATCHED"
            quantity={latestInTransit.quantity}
            unit={latestInTransit.item.unit}
          />
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-card p-5 rounded-2xl border border-surface-border shadow-xs gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange border border-orange-200 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            Transfers
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Transfer inventory between warehouses
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2 text-gray-500 hover:text-gray-900 border border-surface-border rounded-xl bg-surface-muted hover:bg-gray-100 transition interactive-btn cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-orange' : ''}`} />
          </button>

          {hasRole(['ADMIN', 'OPERATIONS_USER']) && (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 interactive-btn cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Transfer
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-6 text-xs font-semibold pb-3.5 border-b border-surface-border mb-4">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3.5 relative transition cursor-pointer ${
              activeTab === 'ALL'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            All Transfers
          </button>
          <button
            onClick={() => setActiveTab('REQUESTED')}
            className={`pb-3.5 relative transition cursor-pointer ${
              activeTab === 'REQUESTED'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Requested
          </button>
          <button
            onClick={() => setActiveTab('DISPATCHED')}
            className={`pb-3.5 relative transition cursor-pointer ${
              activeTab === 'DISPATCHED'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            In-Transit (Dispatched)
          </button>
          <button
            onClick={() => setActiveTab('RECEIVED')}
            className={`pb-3.5 relative transition cursor-pointer ${
              activeTab === 'RECEIVED'
                ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Received
          </button>
        </div>

        {/* Transfers Table */}
        <div className="overflow-x-auto min-h-[260px]">
          {loading ? (
            <SkeletonLoader rows={5} cols={6} />
          ) : (
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
                    <td colSpan="6" className="py-6">
                      <EmptyStateSVG
                        title="No Transfers Found"
                        subtitle="Create a new transfer to move stock between warehouse facilities."
                        actionText={hasRole(['ADMIN', 'OPERATIONS_USER']) ? "Request Transfer" : null}
                        onAction={() => setShowModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-orange-50/30 transition-colors duration-150 group">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
                        <span className="group-hover:text-brand-orange transition-colors">{tr.transferNumber}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 font-semibold text-gray-800">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-lg border border-gray-200 text-gray-700">
                            {tr.sourceLocation.name}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-brand-orange shrink-0 animate-pulseSlow" />
                          <span className="px-2.5 py-1 bg-gray-100 rounded-lg border border-gray-200 text-gray-700">
                            {tr.destLocation.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{tr.item.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Qty: <strong className="text-gray-900 text-xs font-bold">{tr.quantity}</strong> {tr.item.unit} ({tr.item.sku})
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(tr.status)}
                      </td>
                      <td className="py-3 px-3 text-center text-[10px] text-gray-500 font-mono">
                        {tr.dispatchedAt && (
                          <div className="text-amber-700 font-medium">Dispatched: {new Date(tr.dispatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                        {tr.receivedAt && (
                          <div className="text-emerald-700 font-medium">Received: {new Date(tr.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                        {!tr.dispatchedAt && <div>Created: {new Date(tr.createdAt).toLocaleDateString()}</div>}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {tr.status === 'REQUESTED' && hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                          <button
                            onClick={() => handleDispatch(tr.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition interactive-btn inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Dispatch Stock
                          </button>
                        )}
                        {tr.status === 'DISPATCHED' && hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                          <button
                            onClick={() => handleReceive(tr.id)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition interactive-btn inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> Receive Stock
                          </button>
                        )}
                        {tr.status === 'RECEIVED' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Request Transfer Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Request Internal Stock Transfer"
        icon={ArrowLeftRight}
      >
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
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Source Location (From)</label>
            <select
              value={formData.sourceLocationId}
              onChange={(e) => setFormData({ ...formData, sourceLocationId: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer"
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
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer"
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
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer"
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
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-3.5 py-2 border border-surface-border text-gray-600 rounded-xl text-xs hover:bg-gray-100 transition interactive-btn cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition interactive-btn disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Creating...' : 'Submit Transfer Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
