import React, { useState, useEffect } from 'react';
import { inventoryAPI, masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Plus, RefreshCw, Search, Layers, CheckCircle2, TrendingUp, ShieldCheck, Box, Edit2, Trash2 } from 'lucide-react';
import StockGaugeSVG from '../components/svg/StockGaugeSVG.jsx';
import EmptyStateSVG from '../components/svg/EmptyStateSVG.jsx';
import Toast from '../components/common/Toast.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';
import Modal from '../components/common/Modal.jsx';

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

  // Edit Inventory state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInv, setEditingInv] = useState(null);
  const [editFormData, setEditFormData] = useState({
    physicalQty: '',
    reservedQty: '',
    batch: ''
  });

  const fetchData = async (showSkeleton = false) => {
    if (!user) {
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
      if (showSkeleton) setLoading(true);
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
    fetchData(true);
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
      showNotification('error', 'Quantity must be a positive integer.');
      return;
    }
    if (!formData.batch.trim()) {
      showNotification('error', 'Batch identifier is required.');
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
      showNotification('success', `Stock inwarded successfully for batch '${formData.batch}'!`);
      setFormData((prev) => ({ ...prev, batch: '', physicalQty: '' }));
      await fetchData(false);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (inv) => {
    setEditingInv(inv);
    setEditFormData({
      physicalQty: inv.physicalQty,
      reservedQty: inv.reservedQty,
      batch: inv.batch
    });
    setShowEditModal(true);
  };

  const handleUpdateInventory = async (e) => {
    e.preventDefault();
    if (!editingInv) return;

    const phys = parseInt(editFormData.physicalQty, 10);
    const rsvd = parseInt(editFormData.reservedQty, 10);

    if (isNaN(phys) || phys < 0) {
      showNotification('error', 'Physical quantity must be a non-negative integer.');
      return;
    }
    if (isNaN(rsvd) || rsvd < 0) {
      showNotification('error', 'Reserved quantity must be a non-negative integer.');
      return;
    }
    if (phys < rsvd) {
      showNotification('error', `Physical quantity (${phys}) cannot be less than reserved quantity (${rsvd}).`);
      return;
    }

    try {
      setActionLoading(true);
      await inventoryAPI.updateInventory(editingInv.id, {
        physicalQty: phys,
        reservedQty: rsvd,
        batch: editFormData.batch.trim()
      });
      showNotification('success', `Inventory batch '${editFormData.batch}' updated successfully!`);
      setShowEditModal(false);
      setEditingInv(null);
      await fetchData(false);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInventory = async (inv) => {
    if (inv.reservedQty > 0) {
      showNotification('error', `Cannot delete batch '${inv.batch}'. It has ${inv.reservedQty} active reserved units.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete inventory batch '${inv.batch}'?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await inventoryAPI.deleteInventory(inv.id);
      showNotification('success', res.data.message || `Inventory batch '${inv.batch}' deleted successfully.`);
      await fetchData(false);
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

  const totalPhysical = inventories.reduce((sum, i) => sum + i.physicalQty, 0);
  const totalReserved = inventories.reduce((sum, i) => sum + i.reservedQty, 0);
  const totalAvailable = inventories.reduce((sum, i) => sum + i.availableQty, 0);

  return (
    <div className="space-y-6">
      <Toast notification={notification} onClose={() => setNotification(null)} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Physical Stock</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{totalPhysical.toLocaleString()}</div>
            <span className="text-[10px] text-gray-500 font-medium mt-1 block">Warehouse Buckets Total</span>
          </div>
          <StockGaugeSVG total={totalPhysical} available={totalAvailable} size={48} strokeWidth={5} color="#3b82f6" />
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reserved Stock</span>
            <div className="text-2xl font-black text-brand-orange mt-1">{totalReserved.toLocaleString()}</div>
            <span className="text-[10px] text-brand-orange font-semibold flex items-center gap-1 mt-1">
              <Box className="w-3 h-3" /> Sales Order Allocations
            </span>
          </div>
          <StockGaugeSVG total={totalPhysical} available={totalReserved} size={48} strokeWidth={5} color="#f97316" />
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Available Stock</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{totalAvailable.toLocaleString()}</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Ready for Fulfillment
            </span>
          </div>
          <StockGaugeSVG total={totalPhysical} available={totalAvailable} size={48} strokeWidth={5} color="#10b981" />
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Inventory Batches</span>
            <div className="text-2xl font-black text-navy-900 mt-1">{inventories.length}</div>
            <span className="text-[10px] text-gray-500 font-medium mt-1 block">Active SKU Batches</span>
          </div>
          <StockGaugeSVG total={inventories.length || 1} available={inventories.length || 1} size={48} strokeWidth={5} color="#1e293b" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {hasRole(['ADMIN', 'OPERATIONS_USER']) && (
          <div className="lg:col-span-4 bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs h-fit interactive-card">
            <div className="flex items-center justify-between pb-3.5 border-b border-surface-border mb-4">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange border border-orange-200 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                Add Stock
              </h2>
            </div>
            <form onSubmit={handleAddStock} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Item / SKU</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer"
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
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-2 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center justify-center gap-1.5 interactive-btn cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <><Plus className="w-4 h-4" /> <span>Inward Stock</span></>}
              </button>
            </form>
          </div>
        )}

        <div className={`${hasRole(['ADMIN', 'OPERATIONS_USER']) ? 'lg:col-span-8' : 'lg:col-span-12'} bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-surface-border gap-3">
            <div className="flex items-center space-x-6 text-xs font-semibold">
              <button onClick={() => setActiveTab('batches')} className={`pb-3.5 relative transition cursor-pointer ${activeTab === 'batches' ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]' : 'text-gray-500 hover:text-gray-800'}`}>All Inventory Batches ({inventories.length})</button>
              <button onClick={() => setActiveTab('summary')} className={`pb-3.5 relative transition cursor-pointer ${activeTab === 'summary' ? 'text-brand-orange font-bold border-b-2 border-brand-orange -mb-[15px]' : 'text-gray-500 hover:text-gray-800'}`}>Stock Summary</button>
            </div>
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-48 group">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-surface-border rounded-lg bg-surface-muted focus:bg-white focus:outline-none focus:border-brand-orange transition" />
              </div>
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="text-xs border border-surface-border rounded-lg p-1.5 bg-surface-muted text-gray-700 cursor-pointer">
                <option value="">All Locations</option>
                {locations.map((loc) => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
              </select>
              <button onClick={() => fetchData(false)} title="Refresh" className="p-1.5 text-gray-500 border border-surface-border rounded-lg bg-surface-muted hover:bg-gray-100 transition cursor-pointer">
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto min-h-[260px]">
            {loading ? (
              <SkeletonLoader rows={5} cols={7} />
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
                    {hasRole(['ADMIN', 'OPERATIONS_USER']) && <th className="py-2.5 px-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {filteredInventories.length === 0 ? (
                    <tr><td colSpan={hasRole(['ADMIN', 'OPERATIONS_USER']) ? "7" : "6"} className="py-6"><EmptyStateSVG title="No Inventory Batches Found" /></td></tr>
                  ) : (
                    filteredInventories.map((inv) => (
                      <tr key={inv.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-3"><div className="font-bold text-gray-900">{inv.item.name}</div><div className="text-[10px] text-gray-500">{inv.item.sku}</div></td>
                        <td className="py-3 px-3 text-gray-700 font-medium">{inv.location.name}</td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-800">{inv.batch}</td>
                        <td className="py-3 px-3 text-center"><span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">{inv.physicalQty}</span></td>
                        <td className="py-3 px-3 text-center"><span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 font-bold">{inv.reservedQty}</span></td>
                        <td className="py-3 px-3 text-center"><span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">{inv.availableQty}</span></td>
                        {hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button onClick={() => handleOpenEdit(inv)} className="p-1.5 text-gray-500 hover:text-brand-orange border border-surface-border rounded-lg transition cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteInventory(inv)} className="p-1.5 text-gray-500 hover:text-red-600 border border-surface-border rounded-lg transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <div className="space-y-4">
                {summary.map((sum) => (
                  <div key={`${sum.locationId}_${sum.itemId}`} className="p-4 rounded-xl border border-surface-border bg-surface-muted/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-900">{sum.itemName}</span>
                      <div className="space-x-2 text-xs font-semibold text-emerald-700">Available: {sum.availableQty}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingInv(null); }} title="Edit Inventory Batch" icon={Edit2}>
        {editingInv && (
          <form onSubmit={handleUpdateInventory} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Item / SKU</label>
              <div className="p-2.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-800 border border-gray-200">{editingInv.item.name} ({editingInv.item.sku})</div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Warehouse Location</label>
              <div className="p-2.5 bg-gray-100 rounded-xl text-xs font-bold text-gray-800 border border-gray-200">{editingInv.location.name} ({editingInv.location.code})</div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Batch Identifier</label>
              <input type="text" required value={editFormData.batch} onChange={(e) => setEditFormData({ ...editFormData, batch: e.target.value })} className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange transition font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Physical Quantity</label>
                <input type="number" min="0" required value={editFormData.physicalQty} onChange={(e) => setEditFormData({ ...editFormData, physicalQty: e.target.value })} className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Reserved Quantity</label>
                <input type="number" min="0" required value={editFormData.reservedQty} onChange={(e) => setEditFormData({ ...editFormData, reservedQty: e.target.value })} className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white transition" />
              </div>
            </div>
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-surface-border">
              <button type="button" onClick={() => { setShowEditModal(false); setEditingInv(null); }} className="px-3.5 py-2 border border-surface-border text-gray-600 rounded-xl text-xs hover:bg-gray-100 transition cursor-pointer">Cancel</button>
              <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-gradient-to-r from-brand-orange to-amber-600 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer">{actionLoading ? 'Saving...' : 'Update Batch'}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
