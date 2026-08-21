import React, { useState, useEffect } from 'react';
import { inventoryAPI, masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Plus, RefreshCw, AlertCircle, CheckCircle2, Layers, Search, Filter } from 'lucide-react';

export default function InventoryScreen() {
  const { hasRole } = useAuth();
  const [inventories, setInventories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('batches'); // 'batches' | 'summary'
  const [selectedLocation, setSelectedLocation] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form state for adding stock
  const [formData, setFormData] = useState({
    itemId: '',
    locationId: '',
    batch: '',
    physicalQty: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [invRes, sumRes, locRes, itemRes] = await Promise.all([
        inventoryAPI.getInventories({ locationId: selectedLocation || undefined }),
        inventoryAPI.getSummary(selectedLocation ? { locationId: selectedLocation } : undefined),
        masterAPI.getLocations(),
        masterAPI.getItems()
      ]);
      setInventories(invRes.data.data);
      setSummary(sumRes.data.data);
      setLocations(locRes.data.data);
      setItems(itemRes.data.data);

      if (!formData.itemId && itemRes.data.data.length > 0) {
        setFormData((prev) => ({ ...prev, itemId: itemRes.data.data[0].id }));
      }
      if (!formData.locationId && locRes.data.data.length > 0) {
        setFormData((prev) => ({ ...prev, locationId: locRes.data.data[0].id }));
      }
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedLocation]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!hasRole(['ADMIN', 'OPERATIONS_USER'])) {
      showNotification('error', 'Only Admin or Operations User can add inventory stock.');
      return;
    }

    const qty = parseInt(formData.physicalQty, 10);
    if (!qty || qty <= 0) {
      showNotification('error', 'Please enter a valid positive quantity.');
      return;
    }
    if (!formData.batch.trim()) {
      showNotification('error', 'Please enter a batch number.');
      return;
    }

    try {
      setActionLoading(true);
      await inventoryAPI.addStock({
        itemId: formData.itemId,
        locationId: formData.locationId,
        batch: formData.batch.trim(),
        physicalQty: qty
      });
      showNotification('success', `Stock added successfully! Batch: ${formData.batch}`);
      setFormData((prev) => ({ ...prev, batch: '', physicalQty: '' }));
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredInventories = inventories.filter((inv) => {
    const term = searchTerm.toLowerCase();
    return (
      inv.item.name.toLowerCase().includes(term) ||
      inv.item.sku.toLowerCase().includes(term) ||
      inv.batch.toLowerCase().includes(term) ||
      inv.location.name.toLowerCase().includes(term)
    );
  });

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

      {/* Main Split-Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Key Info & Stock Adjustment Form */}
        <div className="lg:col-span-4 bg-surface-card rounded-xl border border-surface-border p-5 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-brand-orange" />
              Stock Inwarding
            </h2>
            <span className="text-[10px] text-gray-400 font-mono">Formula: Avail = Phys - Rsvd</span>
          </div>

          <form onSubmit={handleAddStock} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Item / SKU</label>
              <select
                value={formData.itemId}
                onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none transition"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.sku}) - {item.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Warehouse Location</label>
              <select
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none transition"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Batch Number</label>
              <input
                type="text"
                required
                placeholder="e.g. BATCH-2026-X"
                value={formData.batch}
                onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Physical Quantity (Units)</label>
              <input
                type="number"
                min="1"
                required
                placeholder="e.g. 50"
                value={formData.physicalQty}
                onChange={(e) => setFormData({ ...formData, physicalQty: e.target.value })}
                className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none transition"
              />
            </div>

            {/* Segmented Type Toggle buttons like in the theme */}
            <div className="pt-2">
              <div className="text-[10px] text-gray-400 uppercase font-semibold mb-1.5">Tracking Mode</div>
              <div className="flex gap-1.5">
                <span className="px-2.5 py-1 bg-gray-900 text-white rounded text-[10px] font-medium">Batch Stock</span>
                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded text-[10px] font-medium border border-gray-200">Serialized</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !hasRole(['ADMIN', 'OPERATIONS_USER'])}
              className="w-full mt-2 bg-brand-orange hover:bg-brand-hover text-white py-2.5 px-4 rounded-lg font-medium text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {actionLoading ? 'Updating Stock...' : 'Inward Stock Bucket'}
            </button>
            {!hasRole(['ADMIN', 'OPERATIONS_USER']) && (
              <p className="text-[10px] text-amber-600 text-center font-medium">
                * Only Admin or Operations User can add stock
              </p>
            )}
          </form>
        </div>

        {/* Right Card: Inventory Data Grid */}
        <div className="lg:col-span-8 bg-surface-card rounded-xl border border-surface-border p-5 shadow-xs">
          {/* Header Controls & Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-surface-border gap-3">
            {/* Tabs with active orange underline */}
            <div className="flex items-center space-x-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('batches')}
                className={`pb-3 relative transition cursor-pointer ${
                  activeTab === 'batches'
                    ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[13px]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All Inventory Batches ({inventories.length})
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`pb-3 relative transition cursor-pointer ${
                  activeTab === 'summary'
                    ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[13px]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Stock Summary by Location
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter SKU / Batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-surface-border rounded-lg bg-surface-muted focus:bg-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-xs border border-surface-border rounded-lg p-1.5 bg-surface-muted text-gray-700 focus:outline-none"
              >
                <option value="">All Locations</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>

              <button
                onClick={fetchData}
                title="Refresh"
                className="p-1.5 text-gray-500 hover:text-gray-900 border border-surface-border rounded-lg bg-surface-muted hover:bg-gray-100 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="mt-4 overflow-x-auto">
            {activeTab === 'batches' ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border text-gray-500 bg-surface-muted/50 font-semibold">
                    <th className="py-2.5 px-3">Item Name & SKU</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Batch</th>
                    <th className="py-2.5 px-3 text-center">Physical Qty</th>
                    <th className="py-2.5 px-3 text-center">Reserved Qty</th>
                    <th className="py-2.5 px-3 text-center">Available Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredInventories.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-gray-400 text-xs">
                        No inventory records found.
                      </td>
                    </tr>
                  ) : (
                    filteredInventories.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50/80 transition">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-900">{inv.item.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{inv.item.sku} • {inv.item.category}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-medium">
                          {inv.location.name}
                          <div className="text-[10px] text-gray-400 font-mono">{inv.location.code}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-800">
                          {inv.batch}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                            {inv.physicalQty} {inv.item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-semibold text-[11px]">
                            {inv.reservedQty} {inv.item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                            inv.availableQty > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {inv.availableQty} {inv.item.unit}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <div className="space-y-4">
                {summary.map((sum) => (
                  <div key={`${sum.locationId}_${sum.itemId}`} className="p-4 rounded-lg border border-surface-border bg-surface-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-bold text-gray-900 text-sm">{sum.itemName}</span>
                        <span className="ml-2 text-xs text-gray-500 font-mono">({sum.itemSku})</span>
                        <span className="ml-2 px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-semibold">{sum.locationName}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium">Phys: {sum.physicalQty}</span>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-medium">Rsvd: {sum.reservedQty}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">Avail: {sum.availableQty}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                      {sum.batches.map((b) => (
                        <div key={b.id} className="p-2 bg-white rounded border border-surface-border text-[11px]">
                          <div className="font-mono text-gray-800 font-semibold">{b.batch}</div>
                          <div className="text-gray-500 text-[10px]">Avail: <strong className="text-emerald-600">{b.availableQty}</strong> (Phys: {b.physicalQty})</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
