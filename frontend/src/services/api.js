import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Format API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

export const masterAPI = {
  getLocations: () => api.get('/master/locations'),
  getItems: () => api.get('/master/items'),
  getUsers: () => api.get('/master/users'),
  createUser: (data) => api.post('/master/users', data),
  updateUser: (id, data) => api.put(`/master/users/${id}`, data),
  deleteUser: (id) => api.delete(`/master/users/${id}`)
};

export const inventoryAPI = {
  getInventories: (params) => api.get('/inventory', { params }),
  getSummary: (params) => api.get('/inventory/summary', { params }),
  addStock: (data) => api.post('/inventory/add', data),
  adjustStock: (data) => api.post('/inventory/adjust', data),
  updateInventory: (id, data) => api.put(`/inventory/${id}`, data),
  deleteInventory: (id) => api.delete(`/inventory/${id}`)
};

export const workOrderAPI = {
  getWorkOrders: (params) => api.get('/work-orders', { params }),
  getWorkOrderById: (id) => api.get(`/work-orders/${id}`),
  createWorkOrder: (data) => api.post('/work-orders', data),
  updateStatus: (id, status) => api.patch(`/work-orders/${id}/status`, { status })
};

export const transferAPI = {
  getTransfers: (params) => api.get('/transfers', { params }),
  createTransfer: (data) => api.post('/transfers', data),
  dispatchTransfer: (id) => api.post(`/transfers/${id}/dispatch`),
  receiveTransfer: (id) => api.post(`/transfers/${id}/receive`)
};

export const customerOrderAPI = {
  getCustomerOrders: (params) => api.get('/customer-orders', { params }),
  createCustomerOrder: (data) => api.post('/customer-orders', data),
  cancelCustomerOrder: (id) => api.post(`/customer-orders/${id}/cancel`)
};

export default api;
