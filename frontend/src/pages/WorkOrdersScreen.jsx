import React, { useState, useEffect } from 'react';
import { workOrderAPI, masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Wrench, Plus, CheckCircle2, AlertTriangle, RefreshCw, UserCheck, Play, Check, Clock, AlertCircle } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import Toast from '../components/common/Toast.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';
import EmptyStateSVG from '../components/svg/EmptyStateSVG.jsx';

export default function WorkOrdersScreen() {
  const { hasRole, user } = useAuth();
  const [workOrders, setWorkOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    orderNumber: '',
    locationId: '',
    itemId: '',
    requiredQty: '',
    assignedUserId: ''
  });

  const fetchData = async () => {
    if (!user) {
      setWorkOrders([
        {
          id: 'preview-wo-1',
          orderNumber: 'WO-2026-101',
          status: 'IN_PROGRESS',
          requiredQty: 25,
          completedQty: 10,
          hasShortage: false,
          location: { name: 'Main Assembly Unit', code: 'WH-MAIN' },
          item: { name: 'EV Battery Pack 48V', sku: 'FG-BAT-48V', unit: 'units' },
          assignedUser: { name: 'Operations Lead' }
        },
        {
          id: 'preview-wo-2',
          orderNumber: 'WO-2026-102',
          status: 'PENDING',
          requiredQty: 50,
          completedQty: 0,
          hasShortage: true,
          location: { name: 'Assembly Plant 2', code: 'WH-EAST' },
          item: { name: 'BMS Controller Board', sku: 'SUB-BMS-01', unit: 'units' },
          assignedUser: { name: 'Senior Technician' }
        }
      ]);
      setLocations([
        { id: 'loc-1', name: 'Main Assembly Unit', code: 'WH-MAIN' }
      ]);
      setItems([
        { id: 'item-1', name: 'EV Battery Pack 48V', sku: 'FG-BAT-48V' }
      ]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [woRes, locRes, itemRes, userRes] = await Promise.all([
        workOrderAPI.getWorkOrders(),
        masterAPI.getLocations(),
        masterAPI.getItems(),
        masterAPI.getUsers()
      ]);
      setWorkOrders(woRes.data.data);
      setLocations(locRes.data.data);
      setItems(itemRes.data.data);
      setUsers(userRes.data.data);

      if (locRes.data.data.length > 0 && !formData.locationId) {
        setFormData((prev) => ({ ...prev, locationId: locRes.data.data[0].id }));
      }
      if (itemRes.data.data.length > 0 && !formData.itemId) {
        setFormData((prev) => ({ ...prev, itemId: itemRes.data.data[0].id }));
      }
      if (userRes.data.data.length > 0 && !formData.assignedUserId) {
        setFormData((prev) => ({ ...prev, assignedUserId: userRes.data.data[0].id }));
      }
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateWorkOrder = async (e) => {
    e.preventDefault();
    if (!hasRole(['ADMIN'])) {
      showNotification('error', 'Only Admin is authorized to create Work Orders.');
      return;
    }

    const qty = parseInt(formData.requiredQty, 10);
    if (!qty || qty <= 0) {
      showNotification('error', 'Required quantity must be greater than 0.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await workOrderAPI.createWorkOrder({
        orderNumber: formData.orderNumber.trim() || undefined,
        locationId: formData.locationId,
        itemId: formData.itemId,
        requiredQty: qty,
        assignedUserId: formData.assignedUserId
      });
      showNotification('success', `Work Order ${res.data.data.orderNumber} created successfully!`);
      setShowModal(false);
      setFormData((prev) => ({ ...prev, orderNumber: '', requiredQty: '' }));
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (id, nextStatus) => {
    try {
      setActionLoading(true);
      await workOrderAPI.updateStatus(id, nextStatus);
      showNotification('success', `Work Order status updated to '${nextStatus}'`);
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">Assigned</span>;
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px] inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            In Progress
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
          </span>
        );
      default:
        return null;
    }
  };

  const shortageCount = workOrders.filter(w => w.hasShortage).length;
  const inProgressCount = workOrders.filter(w => w.status === 'IN_PROGRESS').length;
  const completedCount = workOrders.filter(w => w.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast notification={notification} onClose={() => setNotification(null)} />

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Work Orders</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{workOrders.length}</div>
            <span className="text-[10px] text-gray-500 font-medium mt-1 block">Scheduled Batches</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange shadow-xs">
            <Wrench className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">In Production</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{inProgressCount}</div>
            <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 animate-spin" /> Live Line Assembly
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Play className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Shortage Alerts</span>
            <div className={`text-2xl font-black mt-1 ${shortageCount > 0 ? 'text-red-600 animate-pulseSlow' : 'text-gray-700'}`}>
              {shortageCount}
            </div>
            <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" /> Material Needed
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{completedCount}</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Ready / In Stock
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Check className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-card p-5 rounded-2xl border border-surface-border shadow-xs gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange border border-orange-200 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            Work Orders & Material Stock Check
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Admin production scheduling with automated location stock shortage detection
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

          {hasRole(['ADMIN']) ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 interactive-btn cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Work Order
            </button>
          ) : (
            <div className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 font-medium">
              * Admin only creation
            </div>
          )}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs">
        <div className="overflow-x-auto min-h-[260px]">
          {loading ? (
            <SkeletonLoader rows={5} cols={7} />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-500 bg-surface-muted/50 font-semibold">
                  <th className="py-3 px-3">Order Number</th>
                  <th className="py-3 px-3">Location & Item</th>
                  <th className="py-3 px-3 text-center">Required Qty</th>
                  <th className="py-3 px-3">Assigned User</th>
                  <th className="py-3 px-3">Material Check & Shortage</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {workOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-6">
                      <EmptyStateSVG
                        title="No Work Orders Scheduled"
                        subtitle="Create a new production work order to schedule and check inventory materials."
                        actionText={hasRole(['ADMIN']) ? "+ Create Work Order" : null}
                        onAction={() => setShowModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  workOrders.map((wo) => (
                    <tr key={wo.id} className="hover:bg-orange-50/30 transition-colors duration-150 group">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
                        <span className="group-hover:text-brand-orange transition-colors">{wo.orderNumber}</span>
                        <div className="text-[10px] font-normal text-gray-400">
                          {new Date(wo.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{wo.item.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {wo.location.name} ({wo.location.code}) • {wo.item.sku}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-black text-gray-900 text-sm">
                          {wo.requiredQty}
                        </span>
                        <span className="text-[10px] text-gray-500 ml-1 font-mono">{wo.item.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                          {wo.assignedUser.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">{wo.assignedUser.email}</div>
                      </td>
                      {/* Shortage Calculation Cell with Visual Tag */}
                      <td className="py-3 px-3">
                        {wo.hasShortage ? (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold animate-pulseSlow">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <div>
                              <div>Shortage: {wo.shortage} {wo.item.unit}</div>
                              <span className="text-[10px] text-red-700 font-normal block">
                                (Available at {wo.location.code}: {wo.availableAtLocation})
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <div>Stock Sufficient</div>
                              <span className="text-[10px] text-emerald-700 font-normal block">
                                (Available: {wo.availableAtLocation} {wo.item.unit})
                              </span>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getStatusBadge(wo.status)}
                      </td>
                      {/* Status Progress Button */}
                      <td className="py-3 px-3 text-right">
                        {wo.status === 'ASSIGNED' && hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                          <button
                            onClick={() => handleStatusUpdate(wo.id, 'IN_PROGRESS')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition interactive-btn inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Play className="w-3 h-3" /> Start
                          </button>
                        )}
                        {wo.status === 'IN_PROGRESS' && hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                          <button
                            onClick={() => handleStatusUpdate(wo.id, 'COMPLETED')}
                            disabled={actionLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition interactive-btn inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Complete
                          </button>
                        )}
                        {wo.status === 'COMPLETED' && (
                          <span className="text-xs text-emerald-600 font-bold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Done
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

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New Work Order"
        icon={Wrench}
      >
        <form onSubmit={handleCreateWorkOrder} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">
              Work Order ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. WO-1002 (Auto-generated if empty)"
              value={formData.orderNumber}
              onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Target Warehouse Location</label>
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
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Required Item Material</label>
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
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Required Quantity</label>
            <input
              type="number"
              min="1"
              required
              placeholder="e.g. 100"
              value={formData.requiredQty}
              onChange={(e) => setFormData({ ...formData, requiredQty: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Assign To User</label>
            <select
              value={formData.assignedUserId}
              onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role}) - {u.email}
                </option>
              ))}
            </select>
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
              {actionLoading ? 'Creating...' : 'Confirm Work Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
