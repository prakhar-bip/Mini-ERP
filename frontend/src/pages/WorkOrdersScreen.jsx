import React, { useState, useEffect } from 'react';
import { workOrderAPI, masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Wrench, Plus, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, UserCheck, Play, Check } from 'lucide-react';

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
  }, []);

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
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">Assigned</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px]">In Progress</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">Completed</span>;
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
            <Wrench className="w-5 h-5 text-brand-orange" />
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
            className="p-2 text-gray-500 hover:text-gray-900 border border-surface-border rounded-lg bg-surface-muted hover:bg-gray-100 transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {hasRole(['ADMIN']) ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-orange hover:bg-brand-hover text-white px-4 py-2 rounded-lg font-medium text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Work Order
            </button>
          ) : (
            <div className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              * Admin only creation
            </div>
          )}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5 shadow-xs">
        <div className="overflow-x-auto">
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
                  <td colSpan="7" className="py-8 text-center text-gray-400 text-xs">
                    No work orders found. Click "+ Create Work Order" to create one.
                  </td>
                </tr>
              ) : (
                workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {wo.orderNumber}
                      <div className="text-[10px] font-normal text-gray-400">
                        {new Date(wo.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{wo.item.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {wo.location.name} ({wo.location.code}) • {wo.item.sku}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-gray-900 text-sm">
                        {wo.requiredQty}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">{wo.item.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <div className="flex items-center gap-1.5 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        {wo.assignedUser.name}
                      </div>
                      <div className="text-[10px] text-gray-400">{wo.assignedUser.email}</div>
                    </td>
                    {/* Automated Shortage Calculation Cell */}
                    <td className="py-3 px-3">
                      {wo.hasShortage ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <div>
                            <strong>Shortage: {wo.shortage} {wo.item.unit}</strong>
                            <span className="text-[10px] text-amber-700 block">
                              (Available at location: {wo.availableAtLocation})
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div>
                            <strong>Stock Sufficient</strong>
                            <span className="text-[10px] text-emerald-700 block">
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
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Play className="w-3 h-3" /> Start
                        </button>
                      )}
                      {wo.status === 'IN_PROGRESS' && hasRole(['ADMIN', 'OPERATIONS_USER']) && (
                        <button
                          onClick={() => handleStatusUpdate(wo.id, 'COMPLETED')}
                          disabled={actionLoading}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-medium transition inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3 h-3" /> Complete
                        </button>
                      )}
                      {wo.status === 'COMPLETED' && (
                        <span className="text-[11px] text-gray-400 font-medium">Done</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Work Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-brand-orange" />
                Create New Work Order
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

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
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Target Warehouse Location</label>
                <select
                  value={formData.locationId}
                  onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
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
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Required Item Material</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
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
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Assign To User</label>
                <select
                  value={formData.assignedUserId}
                  onChange={(e) => setFormData({ ...formData, assignedUserId: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role}) - {u.email}
                    </option>
                  ))}
                </select>
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
                  {actionLoading ? 'Creating...' : 'Confirm Work Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
