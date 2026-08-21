import React, { useState, useEffect } from 'react';
import { inventoryAPI, masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Plus, RefreshCw, Search, Layers, CheckCircle2, TrendingUp, ShieldCheck, Box } from 'lucide-react';
import StockGaugeSVG from '../components/svg/StockGaugeSVG.jsx';
import EmptyStateSVG from '../components/svg/EmptyStateSVG.jsx';
import Toast from '../components/common/Toast.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';

export default function InventoryScreen() {
  const { user, hasRole } = useAuth();
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
    if (!user) {
      // Provide realistic preview data for blurred backdrop
      setInventories([
        {
          id: 'preview-1',
          batch: 'BAT-2026-001',
          physicalQty: 150,
          reservedQty: 30,
          availableQty: 120,
          location: { name: 'Main Hub', code: 'WH-MAIN' },
          item: { name: 'Lithium Iron Phosphate Cell', sku: 'RAW-LITH-01', category: 'Raw Materials', unit: 'pcs' }
        },
        {
          id: 'preview-2',
          batch: 'BAT-2026-002',
          physicalQty: 90,
          reservedQty: 10,
          availableQty: 80,
          location: { name: 'Regional Hub', code: 'WH-WEST' },
          item: { name: 'Aluminium Battery Enclosure', sku: 'RAW-ALUM-02', category: 'Packaging', unit: 'pcs' }
        }
      ]);
      setLocations([
        { id: 'loc-1', name: 'Main Hub', code: 'WH-MAIN' },
        { id: 'loc-2', name: 'Regional Hub', code: 'WH-WEST' }
      ]);
      setItems([
        { id: 'item-1', name: 'Lithium Iron Phosphate Cell', sku: 'RAW-LITH-01', category: 'Raw Materials', unit: 'pcs' },
        { id: 'item-2', name: 'Aluminium Battery Enclosure', sku: 'RAW-ALUM-02', category: 'Packaging', unit: 'pcs' }
      ]);
      setLoading(false);
      return;
    }

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
  }, [user, selectedLocation]);

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

  // Calculate high-level KPIs
  const totalPhysical = inventories.reduce((sum, i) => sum + i.physicalQty, 0);
  const totalReserved = inventories.reduce((sum, i) => sum + i.reservedQty, 0);
  const totalAvailable = inventories.reduce((sum, i) => sum + i.availableQty, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast notification={notification} onClose={() => setNotification(null)} />

      {/* KPI Overview Strip with Circular SVG Stock Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Physical Card */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Stock</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{totalPhysical.toLocaleString()}</div>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
              <Box className="w-3 h-3" /> Across {locations.length} Locations
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Reserved Card */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reserved Stock</span>
            <div className="text-2xl font-black text-brand-orange mt-1">{totalReserved.toLocaleString()}</div>
            <span className="text-[10px] text-brand-orange font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Reserved for Orders
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Available Card */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Available Stock</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{totalAvailable.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Ready for Use
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Dynamic Circular SVG Gauge */}
        <div className="bg-surface-card rounded-2xl border border-surface-border p-3 shadow-xs interactive-card flex items-center justify-center">
          <StockGaugeSVG
            physical={totalPhysical}
            reserved={totalReserved}
            available={totalAvailable}
            size={88}
            strokeWidth={8}
            showLabels={true}
          />
        </div>
      </div>

      {/* Main Split-Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Inwarding Form (Only visible to Admin & Operations Users) */}
        {hasRole(['ADMIN', 'OPERATIONS_USER']) && (
          <div className="lg:col-span-4 bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs h-fit interactive-card">
            <div className="flex items-center justify-between pb-3.5 border-b border-surface-border mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange border border-orange-200 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                Add Stock
              </h2>
              <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">Available = Total - Reserved</span>
            </div>

            <form onSubmit={handleAddStock} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Item / SKU</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
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
                  className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Batch Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BATCH-2026-X"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
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
                  className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
                />
              </div>

              <div className="pt-2">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1.5">Tracking Mode</div>
                <div className="flex gap-1.5">
                  <span className="px-2.5 py-1 bg-navy-900 text-white rounded-lg text-[10px] font-semibold shadow-xs">Batch Stock</span>
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium border border-gray-200">Serialized</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-2 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 interactive-btn cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? (
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Stock...</span>
                  </div>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Inward Stock Bucket</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Right Card: Inventory Data Grid */}
        <div className={`${hasRole(['ADMIN', 'OPERATIONS_USER']) ? 'lg:col-span-8' : 'lg:col-span-12'} bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs`}>
          {/* Header Controls & Tab Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-surface-border gap-3">
            {/* Tabs */}
            <div className="flex items-center space-x-6 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('batches')}
                className={`pb-3.5 relative transition cursor-pointer ${
                  activeTab === 'batches'
                    ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                All Inventory Batches ({inventories.length})
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`pb-3.5 relative transition cursor-pointer ${
                  activeTab === 'summary'
                    ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Stock Summary by Location
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48 group">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5 group-focus-within:text-brand-orange transition-colors" />
                <input
                  type="text"
                  placeholder="Filter SKU / Batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-surface-border rounded-lg bg-surface-muted focus:bg-white focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20 transition"
                />
              </div>

              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="text-xs border border-surface-border rounded-lg p-1.5 bg-surface-muted text-gray-700 focus:outline-none cursor-pointer"
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
                className="p-1.5 text-gray-500 hover:text-gray-900 border border-surface-border rounded-lg bg-surface-muted hover:bg-gray-100 transition interactive-btn cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-orange' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="mt-4 overflow-x-auto min-h-[260px]">
            {loading ? (
              <SkeletonLoader rows={5} cols={6} />
            ) : activeTab === 'batches' ? (
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
                      <td colSpan="6" className="py-6">
                        <EmptyStateSVG
                          title="No Inventory Batches Found"
                          subtitle="No stock buckets match your filter or location selection."
                          actionText={hasRole(['ADMIN', 'OPERATIONS_USER']) ? "Inward Stock" : null}
                          onAction={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredInventories.map((inv) => (
                      <tr key={inv.id} className="hover:bg-orange-50/30 transition-colors duration-150 group">
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900 group-hover:text-brand-orange transition-colors">{inv.item.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{inv.item.sku} • {inv.item.category}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-700 font-medium">
                          {inv.location.name}
                          <div className="text-[10px] text-gray-400 font-mono">{inv.location.code}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-800">
                          <span className="bg-gray-100 group-hover:bg-white px-2 py-0.5 rounded border border-gray-200 transition">
                            {inv.batch}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">
                            {inv.physicalQty} {inv.item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold text-[11px]">
                            {inv.reservedQty} {inv.item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] transition-transform group-hover:scale-105 ${
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
                {summary.length === 0 ? (
                  <EmptyStateSVG
                    title="No Summary Data"
                    subtitle="Select a different warehouse location or add stock to populate summary."
                  />
                ) : (
                  summary.map((sum) => (
                    <div key={`${sum.locationId}_${sum.itemId}`} className="p-4 rounded-xl border border-surface-border bg-surface-muted/30 interactive-card">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-bold text-gray-900 text-sm">{sum.itemName}</span>
                          <span className="ml-2 text-xs text-gray-500 font-mono">({sum.itemSku})</span>
                          <span className="ml-2 px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-semibold">{sum.locationName}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-semibold">Phys: {sum.physicalQty}</span>
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded font-semibold">Rsvd: {sum.reservedQty}</span>
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">Avail: {sum.availableQty}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {sum.batches.map((b) => (
                          <div key={b.id} className="p-2.5 bg-white rounded-lg border border-surface-border text-[11px] shadow-2xs hover:border-brand-orange transition">
                            <div className="font-mono text-gray-800 font-bold">{b.batch}</div>
                            <div className="text-gray-500 text-[10px] mt-0.5">
                              Avail: <strong className="text-emerald-600">{b.availableQty}</strong> (Phys: {b.physicalQty})
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
