import React, { useState, useEffect } from 'react';
import { customerOrderAPI, masterAPI, inventoryAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ShoppingCart, Plus, CheckCircle2, AlertCircle, RefreshCw, XCircle, ShieldCheck, Lock } from 'lucide-react';

export default function CustomerOrdersScreen() {
  const { hasRole } = useAuth();
  const [orders, setOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [items, setItems] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    orderNumber: '',
    customerName: '',
    locationId: '',
    itemId: '',
    quantity: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [orderRes, locRes, itemRes, invRes] = await Promise.all([
        customerOrderAPI.getCustomerOrders(),
        masterAPI.getLocations(),
        masterAPI.getItems(),
        inventoryAPI.getInventories()
      ]);
      setOrders(orderRes.data.data);
      setLocations(locRes.data.data);
      setItems(itemRes.data.data);
      setInventories(invRes.data.data);

      if (locRes.data.data.length > 0 && !formData.locationId) {
        setFormData((prev) => ({ ...prev, locationId: locRes.data.data[0].id }));
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
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Helper to calculate currently available stock for selected location and item
  const getAvailableStockForSelected = () => {
    if (!formData.itemId || !formData.locationId) return 0;
    const matching = inventories.filter(
      (inv) => inv.itemId === formData.itemId && inv.locationId === formData.locationId
    );
    return matching.reduce((sum, inv) => sum + inv.availableQty, 0);
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!hasRole(['ADMIN', 'SALES_USER'])) {
      showNotification('error', 'Only Admin or Sales User can create customer orders and reserve stock.');
      return;
    }

    const qty = parseInt(formData.quantity, 10);
    if (!qty || qty <= 0) {
      showNotification('error', 'Order quantity must be greater than 0.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await customerOrderAPI.createCustomerOrder({
        orderNumber: formData.orderNumber.trim() || undefined,
        customerName: formData.customerName.trim(),
        locationId: formData.locationId,
        itemId: formData.itemId,
        quantity: qty
      });
      showNotification(
        'success',
        `Order ${res.data.data.orderNumber} confirmed! Stock reserved with database concurrency lock.`
      );
      setShowModal(false);
      setFormData((prev) => ({ ...prev, orderNumber: '', customerName: '', quantity: '' }));
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order and release its reserved inventory?')) {
      return;
    }
    try {
      setActionLoading(true);
      const res = await customerOrderAPI.cancelCustomerOrder(id);
      showNotification('success', res.data.message || 'Order cancelled and reserved stock released.');
      await fetchData();
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const availableStock = getAvailableStockForSelected();

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
            <ShoppingCart className="w-5 h-5 text-brand-orange" />
            Customer Orders & Stock Reservation
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Sales ordering with atomic row-level concurrency locking to prevent overselling
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

          {hasRole(['ADMIN', 'SALES_USER']) ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-orange hover:bg-brand-hover text-white px-4 py-2 rounded-lg font-medium text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Customer Order
            </button>
          ) : (
            <div className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
              * Sales role only
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-5 shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-border text-gray-500 bg-surface-muted/50 font-semibold">
                <th className="py-3 px-3">Order Number</th>
                <th className="py-3 px-3">Customer Name</th>
                <th className="py-3 px-3">Fulfillment Location</th>
                <th className="py-3 px-3">Item Ordered</th>
                <th className="py-3 px-3 text-center">Reserved Quantity</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-400 text-xs">
                    No customer orders found. Click "+ New Customer Order" to create one.
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-3 font-mono font-bold text-gray-900">
                      {ord.orderNumber}
                      <div className="text-[10px] font-normal text-gray-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-gray-800">
                      {ord.customerName}
                    </td>
                    <td className="py-3 px-3 text-gray-700">
                      <span className="font-medium">{ord.location.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono ml-1">({ord.location.code})</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{ord.item.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{ord.item.sku}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-bold text-xs">
                        {ord.quantity} {ord.item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {ord.status === 'CONFIRMED' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px] inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Confirmed
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-semibold text-[11px]">
                          Cancelled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {ord.status === 'CONFIRMED' && hasRole(['ADMIN', 'SALES_USER']) && (
                        <button
                          onClick={() => handleCancelOrder(ord.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded text-[11px] font-medium transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" /> Cancel & Release
                        </button>
                      )}
                      {ord.status === 'CANCELLED' && (
                        <span className="text-[11px] text-gray-400 font-medium">Released</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-surface-border">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-brand-orange" />
                Create Order & Reserve Stock
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Order Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SO-1002 (Auto-generated if empty)"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bharat Heavy Electricals"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Fulfillment Location</label>
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
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">Item to Order</label>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-gray-700">Order Quantity</label>
                  <span className="text-[10px] text-gray-500">
                    Live Available: <strong className="text-emerald-700 font-bold">{availableStock} Units</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder={`Max available: ${availableStock}`}
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="w-full text-xs border border-surface-border rounded-lg p-2 bg-surface-muted focus:bg-white focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Concurrency guard informative note */}
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-[11px] text-blue-800 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>ACID Concurrency Protection:</strong> Reservation is executed with PostgreSQL row-level locking (<code>SELECT FOR UPDATE</code>) to guarantee zero overselling under simultaneous user load.
                </span>
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
                  {actionLoading ? 'Reserving...' : 'Confirm & Reserve Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
