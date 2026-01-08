import axios, { AxiosError } from 'axios';

// Get API URL from env or default to localhost
let envApiUrl = import.meta.env.VITE_API_URL;

if (envApiUrl && !envApiUrl.startsWith('http')) {
  // If just a host (e.g. from Render), assume HTTPS and prepend
  envApiUrl = `https://${envApiUrl}`;
}

// Ensure /api suffix if not present (Render host implies root, but our prefix is /api)
// But wait, if defaults to localhost:8000/api, we want consistency.
// If envApiUrl is just the host, it's "https://gilamchi.onrender.com".
// We need "https://gilamchi.onrender.com/api".

const API_URL = envApiUrl ? `${envApiUrl}/api` : 'http://localhost:8000/api';
// Note: If envApiUrl already has /api (unlikely from Render 'host'), this might double it. 
// But 'host' is just domain. So this is safe for Render.


const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// --- Mappers ---

const fromUser = (data: any): any => ({
  id: data.id,
  name: data.username, // Map username to name
  role: data.role,
  branchId: data.branch_id,
  canAddProducts: data.can_add_products,
});

const fromProduct = (data: any): any => ({
  id: data.id,
  name: data.name,
  category: data.category,
  type: data.type,
  branchId: data.branch_id,
  photo: data.photo,
  collection: data.collection,
  quantity: data.quantity,
  maxQuantity: data.max_quantity,
  buyPrice: data.buy_price,
  sellPrice: data.sell_price,
  totalLength: data.total_length,
  remainingLength: data.remaining_length,
  width: data.width,
  sellPricePerMeter: data.sell_price_per_meter,
  // Carpet fields
  // pricePerSquareMeter: data.price_per_square_meter, // Not in schema yet
  availableSizes: data.available_sizes
});

const toProduct = (data: any): any => ({
  name: data.name,
  category: data.category,
  type: data.type,
  branch_id: data.branchId,
  photo: data.photo || "placeholder.jpg",
  collection: data.collection,
  quantity: data.quantity || 0,
  max_quantity: data.maxQuantity,
  buy_price: data.buyPrice,
  sell_price: data.sellPrice,
  total_length: data.totalLength,
  remaining_length: data.remainingLength,
  width: data.width,
  sell_price_per_meter: data.sellPricePerMeter,
  available_sizes: data.availableSizes
});

const fromBranch = (data: any): any => ({
  id: data.id,
  name: data.name,
  status: 'open' // Mock status as backend doesn't have it yet
});

const fromSale = (data: any): any => ({
  id: data.id,
  productId: data.product_id,
  productName: data.product?.name || "Unknown", // Assuming backend expands product or we handle it
  quantity: data.quantity,
  amount: data.amount,
  paymentType: data.payment_type,
  branchId: data.branch_id,
  sellerId: data.seller_id,
  date: data.created_at, // Use created_at as date
  type: data.product?.type || "unit" // Nested info
});

const toSale = (data: any): any => ({
  product_id: data.productId,
  quantity: data.quantity,
  amount: data.amount,
  payment_type: data.paymentType,
  branch_id: data.branchId,
  seller_id: data.sellerId,
  // Backend calculates profit, checks stock etc.
});

const fromDebt = (data: any): any => ({
  id: data.id,
  debtorName: data.debtor_name,
  phoneNumber: data.phone_number,
  orderDetails: data.order_details,
  totalAmount: data.total_amount,
  paidAmount: data.paid_amount,
  remainingAmount: data.remaining_amount,
  paymentDeadline: data.payment_deadline,
  branchId: data.branch_id,
  sellerId: data.seller_id,
  sellerName: data.seller?.username || "Unknown",
  date: data.created_at,
  status: data.status,
  paymentHistory: (data.payments || []).map((p: any) => ({
    id: p.id,
    amount: p.amount,
    date: p.created_at,
    sellerId: p.seller_id,
    sellerName: "Unknown", // Backend payment schema needs seller expand
  }))
});

const toDebt = (data: any): any => ({
  debtor_name: data.debtorName,
  phone_number: data.phoneNumber,
  order_details: data.orderDetails,
  total_amount: data.totalAmount,
  payment_deadline: data.paymentDeadline, // expected ISO string
  branch_id: data.branchId,
  seller_id: data.sellerId
});

// --- Services ---

export const authService = {
  login: async (formData: URLSearchParams) => {
    const response = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return fromUser(response.data);
  },
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    return fromUser(response.data);
  }
};

export const branchService = {
  getAll: async () => {
    const response = await api.get('/branches/');
    return response.data.map(fromBranch);
  },
  getOne: async (id: string) => {
    const response = await api.get(`/branches/${id}`);
    return fromBranch(response.data);
  },
  create: async (data: any) => {
    const response = await api.post('/branches/', data); // No mapper needed for simple branch create yet
    return fromBranch(response.data);
  }
};

export const productService = {
  getAll: async (filters?: any) => {
    const response = await api.get('/products/', { params: filters });
    return response.data.map(fromProduct);
  },
  getOne: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return fromProduct(response.data);
  },
  create: async (data: any) => {
    const payload = toProduct(data);
    const response = await api.post('/products/', payload);
    return fromProduct(response.data);
  },
  update: async (id: string, data: any) => {
    console.warn("Update product not strictly implemented in backend yet");
    return data;
  }
};

export const salesService = {
  create: async (data: any) => {
    const payload = toSale(data);
    const response = await api.post('/sales/', payload);
    return fromSale(response.data);
  },
  getAll: async (filters?: any) => {
    const response = await api.get('/sales/', { params: filters });
    return response.data.map(fromSale);
  }
};

export const debtService = {
  getAll: async () => {
    const response = await api.get('/debts/');
    return response.data.map(fromDebt);
  },
  create: async (data: any) => {
    const payload = toDebt(data);
    const response = await api.post('/debts/', payload);
    return fromDebt(response.data);
  },
  addPayment: async (debtId: string, data: any) => {
    // Payment payload: amount, note?
    const response = await api.post(`/debts/${debtId}/payments`, data);
    return response.data;
  }
}

export default api;
