import React, { useState, useEffect } from 'react';
import { masterAPI } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, UserPlus, Edit2, Trash2, Shield, UserCheck, Briefcase, RefreshCw, AlertCircle, Building2 } from 'lucide-react';
import Modal from '../components/common/Modal.jsx';
import Toast from '../components/common/Toast.jsx';
import SkeletonLoader from '../components/common/SkeletonLoader.jsx';
import EmptyStateSVG from '../components/svg/EmptyStateSVG.jsx';

export default function UsersScreen() {
  const { user, hasRole } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OPERATIONS_USER',
    locationId: ''
  });

  const fetchData = async (showSkeleton = false) => {
    if (!user) {
      setUsersList([
        { id: 'usr-1', name: 'Prakhar Admin', email: 'admin@erp.com', role: 'ADMIN', location: { name: 'Main Assembly Unit', code: 'WH-MAIN' }, createdAt: new Date().toISOString() },
        { id: 'usr-2', name: 'Operations Lead', email: 'ops@erp.com', role: 'OPERATIONS_USER', location: { name: 'Main Assembly Unit', code: 'WH-MAIN' }, createdAt: new Date().toISOString() },
        { id: 'usr-3', name: 'Sales Executive', email: 'sales@erp.com', role: 'SALES_USER', location: { name: 'Regional Hub East', code: 'WH-EAST' }, createdAt: new Date().toISOString() }
      ]);
      setLocations([{ id: 'loc-1', name: 'Main Assembly Unit', code: 'WH-MAIN' }]);
      setLoading(false);
      return;
    }

    try {
      if (showSkeleton) setLoading(true);
      const [uRes, lRes] = await Promise.all([
        masterAPI.getUsers(),
        masterAPI.getLocations()
      ]);
      setUsersList(uRes.data.data);
      setLocations(lRes.data.data);

      if (lRes.data.data.length > 0 && !formData.locationId) {
        setFormData((prev) => ({ ...prev, locationId: lRes.data.data[0].id }));
      }
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
  }, [user]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!hasRole(['ADMIN'])) {
      showNotification('error', 'Only Admin is authorized to add employee accounts.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await masterAPI.createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        locationId: formData.locationId || null
      });
      showNotification('success', `Employee '${res.data.data.name}' added successfully!`);
      setShowAddModal(false);
      setFormData({ name: '', email: '', password: '', role: 'OPERATIONS_USER', locationId: locations[0]?.id || '' });
      await fetchData(false);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (targetUser) => {
    setEditingUser(targetUser);
    setFormData({
      name: targetUser.name,
      email: targetUser.email,
      password: '',
      role: targetUser.role,
      locationId: targetUser.locationId || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setActionLoading(true);
      const res = await masterAPI.updateUser(editingUser.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password ? formData.password : undefined,
        role: formData.role,
        locationId: formData.locationId || null
      });
      showNotification('success', `Employee '${res.data.data.name}' updated successfully!`);
      setShowEditModal(false);
      setEditingUser(null);
      await fetchData(false);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === user?.id) {
      showNotification('error', 'You cannot delete your own logged-in Admin account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove employee '${targetUser.name}' (${targetUser.email})?`)) {
      return;
    }

    try {
      setActionLoading(true);
      const res = await masterAPI.deleteUser(targetUser.id);
      showNotification('success', res.data.message || 'Employee removed successfully.');
      await fetchData(false);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesTab = activeTab === 'ALL' || u.role === activeTab;
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-bold text-[11px]">Administrator</span>;
      case 'OPERATIONS_USER':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold text-[11px]">Operations</span>;
      case 'SALES_USER':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">Sales</span>;
      default:
        return null;
    }
  };

  const adminCount = usersList.filter(u => u.role === 'ADMIN').length;
  const opsCount = usersList.filter(u => u.role === 'OPERATIONS_USER').length;
  const salesCount = usersList.filter(u => u.role === 'SALES_USER').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <Toast notification={notification} onClose={() => setNotification(null)} />

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Employees</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{usersList.length}</div>
            <span className="text-[10px] text-gray-500 font-medium mt-1 block">Active Accounts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-brand-orange shadow-xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Admins</span>
            <div className="text-2xl font-black text-red-600 mt-1">{adminCount}</div>
            <span className="text-[10px] text-red-600 font-semibold flex items-center gap-1 mt-1">
              <Shield className="w-3 h-3" /> Full Access
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Operations</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{opsCount}</div>
            <span className="text-[10px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
              <UserCheck className="w-3 h-3" /> Operations Staff
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-surface-card rounded-2xl border border-surface-border p-4 shadow-xs interactive-card flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sales</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">{salesCount}</div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <Briefcase className="w-3 h-3" /> Sales Staff
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface-card p-5 rounded-2xl border border-surface-border shadow-xs gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-50 text-brand-orange border border-orange-200 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            Employees
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage staff accounts and permissions
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

          {hasRole(['ADMIN']) && (
            <button
              onClick={() => {
                setFormData({ name: '', email: '', password: '', role: 'OPERATIONS_USER', locationId: locations[0]?.id || '' });
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 flex items-center gap-1.5 interactive-btn cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-xs">
        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3.5 border-b border-surface-border mb-4 gap-3">
          <div className="flex items-center space-x-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`pb-2 relative transition cursor-pointer ${
                activeTab === 'ALL' ? 'text-brand-orange font-bold border-b-2 border-brand-orange' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              All Staff ({usersList.length})
            </button>
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`pb-2 relative transition cursor-pointer ${
                activeTab === 'ADMIN' ? 'text-brand-orange font-bold border-b-2 border-brand-orange' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Admins ({adminCount})
            </button>
            <button
              onClick={() => setActiveTab('OPERATIONS_USER')}
              className={`pb-2 relative transition cursor-pointer ${
                activeTab === 'OPERATIONS_USER' ? 'text-brand-orange font-bold border-b-2 border-brand-orange' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Operations ({opsCount})
            </button>
            <button
              onClick={() => setActiveTab('SALES_USER')}
              className={`pb-2 relative transition cursor-pointer ${
                activeTab === 'SALES_USER' ? 'text-brand-orange font-bold border-b-2 border-brand-orange' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Sales ({salesCount})
            </button>
          </div>

          <input
            type="text"
            placeholder="Search by name, email, role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs border border-surface-border rounded-xl px-3 py-1.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition w-full sm:w-64"
          />
        </div>

        {/* Employees Table */}
        <div className="overflow-x-auto min-h-[260px]">
          {loading ? (
            <SkeletonLoader rows={5} cols={5} />
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-surface-border text-gray-500 bg-surface-muted/50 font-semibold">
                  <th className="py-3 px-3">Employee Name</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3 text-center">Assigned Role</th>
                  <th className="py-3 px-3">Primary Location</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6">
                      <EmptyStateSVG
                        title="No Employees Found"
                        subtitle="No staff records match your current filter or search criteria."
                        actionText={hasRole(['ADMIN']) ? "+ Add Employee" : null}
                        onAction={() => setShowAddModal(true)}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-orange-50/30 transition-colors duration-150 group">
                      <td className="py-3 px-3 font-bold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-700 font-bold flex items-center justify-center border border-gray-200">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{u.name}</div>
                            {u.id === user?.id && (
                              <span className="text-[9px] text-brand-orange font-bold block">(You - Active Session)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-gray-700 font-mono">
                        {u.email}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {getRoleBadge(u.role)}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        {u.location ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <Building2 className="w-3.5 h-3.5 text-gray-400" />
                            <span>{u.location.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({u.location.code})</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">All Locations (Global)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {hasRole(['ADMIN']) && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              disabled={actionLoading}
                              title="Edit Employee"
                              className="p-1.5 text-gray-600 hover:text-brand-orange hover:bg-orange-50 rounded-lg border border-gray-200 transition interactive-btn cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={actionLoading || u.id === user?.id}
                              title={u.id === user?.id ? "Cannot delete active logged in account" : "Delete Employee"}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200 transition interactive-btn cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Add Employee Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
        icon={UserPlus}
      >
        <form onSubmit={handleCreateUser} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Work Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. ramesh@erp.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Account Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Assigned Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer font-semibold"
            >
              <option value="OPERATIONS_USER">Operations User (Inventory & Transfers)</option>
              <option value="SALES_USER">Sales User (Customer Orders & Reservations)</option>
              <option value="ADMIN">Administrator (Full Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Primary Warehouse Location (Optional)</label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer"
            >
              <option value="">Global (All Locations)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-3.5 py-2 border border-surface-border text-gray-600 rounded-xl text-xs hover:bg-gray-100 transition interactive-btn cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition interactive-btn disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Saving...' : 'Add Employee Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setEditingUser(null); }}
        title="Update Employee Account"
        icon={Edit2}
      >
        <form onSubmit={handleUpdateUser} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Work Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">New Password (Leave blank to keep unchanged)</label>
            <input
              type="password"
              minLength={6}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Assigned Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer font-semibold"
            >
              <option value="OPERATIONS_USER">Operations User (Inventory & Transfers)</option>
              <option value="SALES_USER">Sales User (Customer Orders & Reservations)</option>
              <option value="ADMIN">Administrator (Full Access)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-700 mb-1">Primary Warehouse Location</label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full text-xs border border-surface-border rounded-xl p-2.5 bg-surface-muted focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:outline-none transition cursor-pointer"
            >
              <option value="">Global (All Locations)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-surface-border">
            <button
              type="button"
              onClick={() => { setShowEditModal(false); setEditingUser(null); }}
              className="px-3.5 py-2 border border-surface-border text-gray-600 rounded-xl text-xs hover:bg-gray-100 transition interactive-btn cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-gradient-to-r from-brand-orange to-amber-600 hover:from-brand-hover hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition interactive-btn disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Updating...' : 'Update Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
