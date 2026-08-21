import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import InventoryScreen from './pages/InventoryScreen.jsx';
import WorkOrdersScreen from './pages/WorkOrdersScreen.jsx';
import TransfersScreen from './pages/TransfersScreen.jsx';
import CustomerOrdersScreen from './pages/CustomerOrdersScreen.jsx';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white text-xs gap-3 animate-fadeIn">
        <div className="w-6 h-6 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
        <span className="font-medium text-gray-400">Loading Enterprise Session...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/inventory" replace />} />
        <Route path="inventory" element={<InventoryScreen />} />
        <Route path="work-orders" element={<WorkOrdersScreen />} />
        <Route path="transfers" element={<TransfersScreen />} />
        <Route path="customer-orders" element={<CustomerOrdersScreen />} />
        <Route path="login" element={<Navigate to="/inventory" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/inventory" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

