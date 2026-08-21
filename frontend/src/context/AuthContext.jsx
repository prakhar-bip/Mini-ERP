import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('erp_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authAPI.getMe();
        setUser(res.data.data);
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('erp_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('erp_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('erp_token', newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const quickLogin = async (role) => {
    const credentials = {
      ADMIN: { email: 'admin@erp.com', password: 'Password@123' },
      OPERATIONS_USER: { email: 'ops@erp.com', password: 'Password@123' },
      SALES_USER: { email: 'sales@erp.com', password: 'Password@123' }
    };
    const cred = credentials[role];
    if (cred) {
      return login(cred.email, cred.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('erp_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) return false;
    if (allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, quickLogin, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
