import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import Layout from './components/Layout.jsx';
import LoginScreen from './pages/LoginScreen.jsx';
import InventoryScreen from './pages/InventoryScreen.jsx';
import WorkOrdersScreen from './pages/WorkOrdersScreen.jsx';
import TransfersScreen from './pages/TransfersScreen.jsx';
import CustomerOrdersScreen from './pages/CustomerOrdersScreen.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center text-white text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Mini ERP Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/inventory" replace />} />
            <Route path="inventory" element={<InventoryScreen />} />
            <Route path="work-orders" element={<WorkOrdersScreen />} />
            <Route path="transfers" element={<TransfersScreen />} />
            <Route path="customer-orders" element={<CustomerOrdersScreen />} />
          </Route>

          <Route path="*" element={<Navigate to="/inventory" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
