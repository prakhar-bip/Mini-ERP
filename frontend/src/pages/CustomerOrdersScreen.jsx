import React, { useState, useEffect } from 'react';
import { customerOrderAPI, masterAPI, inventoryAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ShoppingCart, Plus, CheckCircle2, AlertCircle, RefreshCw, XCircle, ShieldCheck, Lock, DollarSign, Box } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import Toast from '../components/common/Toast.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';
import EmptyStateSVG from '../components/svg/EmptyStateSVG.jsx';
import ConcurrencyShieldSVG from '../components/svg/ConcurrencyShieldSVG.jsx';

export default function CustomerOrdersScreen() {
  const { user, hasRole } = useAuth();
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
    if (!user) {
      setOrders([
        {
          id: 'preview-ord-1',
          orderNumber: 'SO-2026-501',
          customerName: 'Tata Power EV Solutions',
          status: 'CONFIRMED',
          quantity: 15,
          createdAt: new Date().toISOString(),
          location: { name: 'Main Fulfillment Center', code: 'WH-MAIN' },
          item: { name: 'Commercial Energy Storage Pack', sku: 'FG-ESS-100KW', unit: 'units' }
        },
        {
          id: 'preview-ord-2',
          orderNumber: 'SO-2026-502',
          customerName: 'Bharat Heavy Electricals Ltd',
          status: 'CONFIRMED',
          quantity: 25,
          createdAt: new Date().toISOString(),
          location: { name: 'Western Hub', code: 'WH-WEST' },
          item: { name: 'Industrial Battery Module', sku: 'FG-BAT-48V', unit: 'units' }
        }
      ]);
      setLocations([
        { id: 'loc-1', name: 'Main Fulfillment Center', code: 'WH-MAIN' }
      ]);
      setItems([
        { id: 'item-1', name: 'Commercial Energy Storage Pack', sku: 'FG-ESS-100KW' }
      ]);
      setLoading(false);
      return;
    }

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
  }, [user]);

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
  const confirmedCount = orders.filter(o => o.status === 'CONFIRMED').length;
  const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;
  const totalReservedUnits = orders
    .filter(o => o.status === 'CONFIRMED')
    .reduce((sum, o) => sum + o.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast notification={notification} onClose={() => setNotification(null)} />

      {/* KPI Overview Strip with ACID Concurrency Shield */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{orders.length}</div>
            <span className="text-[10px] text-gray-500 font-medium mt-1 block">Sales Orders Logged</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange shadow-xs">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Confirmed</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{confirmedCount}</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3" /> Active Orders
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Reserved Units</span>
            <div className="text-2xl font-black text-brand-orange mt-1">{totalReservedUnits.toLocaleString()}</div>
            <span className="text-[10px] text-brand-orange font-semibold flex items-center gap-1 mt-1">
              <Box className="w-3 h-3" /> Reserved Stock
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Cancelled Orders</span>
            <div className="text-2xl font-black text-gray-500 mt-1">{cancelledCount}</div>
            <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1">
              <XCircle className="w-3 h-3" /> Released Stock
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 shadow-xs">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-card p-5 rounded-2xl border border-surface-border shadow-xs gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange border border-orange-200 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            Customer Orders
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage customer sales orders
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

          {hasRole(['ADMIN', 'SALES_USER']) ? (
            <button
              onClick={() => setShowModal(true)}
              className="bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 interactive-btn cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          ) : (
            <div className="text-[11px] text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 font-medium">
              * Sales role only
            </div>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs">
        <div className="overflow-x-auto min-h-[260px]">
          {loading ? (
            <SkeletonLoader rows={5} cols={7} />
          ) : (
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
                    <td colSpan="7" className="py-6">
                      <EmptyStateSVG
                        title="No Customer Orders Found"
                        subtitle="Create a new customer order to reserve stock with concurrency protection."
                        actionText={hasRole(['ADMIN', 'SALES_USER']) ? "+ New Customer Order" : null}
                        onAction={() => setShowModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-orange-50/30 transition-colors duration-150 group">
                      <td className="py-3 px-3 font-mono font-bold text-gray-900">
                        <span className="group-hover:text-brand-orange transition-colors">{ord.orderNumber}</span>
                        <div className="text-[10px] font-normal text-gray-400">
                          {new Date(ord.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-900">
                        {ord.customerName}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        <span className="font-semibold">{ord.location.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono ml-1">({ord.location.code})</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900">{ord.item.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{ord.item.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 font-black text-xs">
                          {ord.quantity} {ord.item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        {ord.status === 'CONFIRMED' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Confirmed
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium text-[11px]">
                            Cancelled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {ord.status === 'CONFIRMED' && hasRole(['ADMIN', 'SALES_USER']) && (
                          <button
                            onClick={() => handleCancelOrder(ord.id)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-[11px] font-bold transition interactive-btn inline-flex items-center gap-1 cursor-pointer"
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
          )}
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Order & Reserve Stock"
        icon={ShoppingCart}
      >
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
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
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
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Fulfillment Location</label>
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
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Item to Order</label>
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-gray-700">Order Quantity</label>
              <span className="text-[10px] text-gray-500 font-medium">
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
              {actionLoading ? 'Reserving...' : 'Confirm & Reserve Stock'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
