import axios, { AxiosError } from 'axios';

// Get API URL from env or default to localhost
let envApiUrl = import.meta.env.VITE_API_URL;

if (envApiUrl && !envApiUrl.startsWith('http')) {
  // If it's a Render internal host (no dots), it won't resolve in the browser.
  // We append .onrender.com to make it the public URL.
  if (!envApiUrl.includes('.')) {
    envApiUrl = `${envApiUrl}.onrender.com`;
  }
  envApiUrl = `https://${envApiUrl}`;
}

// 1. If no env, use localhost (dev) or relative path (prod)
// 2. If env exists, ensure it ends with /api/ (case insensitive and handle trailing slashes)
let API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api/' : 'http://localhost:8000/api/');

if (envApiUrl) {
  let base = envApiUrl.trim();
  if (base.endsWith('/')) base = base.slice(0, -1);
  if (!base.toLowerCase().endsWith('/api')) {
    base = `${base}/api`;
  }
  API_URL = `${base}/`;
}

console.log("Constructed API_URL:", API_URL);
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
  code: data.code,
  name: data.code, // Alias for backward compatibility in UI
  category: data.category,
  type: data.type,
  branchId: data.branch_id,
  photo: data.photo,
  collection: data.collection,
  quantity: data.quantity,
  maxQuantity: data.max_quantity,
  buyPrice: data.buy_price,
  buyPriceUsd: data.buy_price_usd,
  isUsdPriced: data.is_usd_priced,
  sellPrice: data.sell_price,
  totalLength: data.total_length,
  remainingLength: data.remaining_length,
  width: data.width,
  sellPricePerMeter: data.sell_price_per_meter,
  // Carpet fields
  // pricePerSquareMeter: data.price_per_square_meter, // Not in schema yet
  availableSizes: data.available_sizes,
  similarity_percentage: data.similarity_percentage
});

const toProduct = (data: any): any => ({
  code: data.code || data.name,
  category: data.category,
  type: data.type,
  branch_id: data.branchId,
  photo: data.photo || "placeholder.jpg",
  collection: data.collection,
  quantity: data.quantity || 0,
  max_quantity: data.maxQuantity,
  buy_price: data.buyPrice,
  buy_price_usd: data.buyPriceUsd,
  is_usd_priced: data.isUsdPriced,
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
  productName: data.product?.code || "Unknown", // Backend now uses code
  quantity: data.quantity,
  amount: data.amount,
  paymentType: data.payment_type,
  branchId: data.branch_id,
  sellerId: data.seller_id,
  date: data.date, // Use the actual business date field
  orderId: data.order_id,
  type: data.product?.type || "unit" // Nested info
});

const toSale = (data: any): any => ({
  product_id: data.productId,
  quantity: data.quantity,
  amount: data.amount,
  payment_type: data.paymentType,
  branch_id: data.branchId,
  seller_id: data.sellerId,
  order_id: data.orderId,
  size: data.size,
  // Backend calculates profit, checks stock etc.
});

const fromCollection = (data: any): any => ({
  id: data.id,
  name: data.name,
  icon: data.icon,
  price_per_sqm: data.price_per_sqm,
  buy_price_per_sqm: data.buy_price_per_sqm
});

const toCollection = (data: any): any => ({
  name: data.name,
  icon: data.icon,
  price_per_sqm: data.price_per_sqm,
  buy_price_per_sqm: data.buy_price_per_sqm
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
    const response = await api.post('auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('auth/me');
    return fromUser(response.data);
  },
  register: async (userData: any) => {
    const response = await api.post('auth/register', userData);
    return fromUser(response.data);
  }
};

export const branchService = {
  getAll: async () => {
    const response = await api.get('branches/');
    return response.data.map(fromBranch);
  },
  getOne: async (id: string) => {
    const response = await api.get(`branches/${id}`);
    return fromBranch(response.data);
  },
  create: async (data: any) => {
    const response = await api.post('branches/', data); // No mapper needed for simple branch create yet
    return fromBranch(response.data);
  },
  delete: async (id: string) => {
    await api.delete(`branches/${id}`);
  }
};

export const productService = {
  getAll: async (filters?: any) => {
    console.log("Fetching products with filters:", filters);
    const response = await api.get('products/', { params: filters });
    console.log(`Fetched ${response.data.length} products`);
    return response.data.map(fromProduct);
  },
  getOne: async (id: string) => {
    const response = await api.get(`products/${id}`);
    return fromProduct(response.data);
  },
  create: async (data: any) => {
    const payload = toProduct(data);
    console.log("Creating product with payload:", payload);
    try {
      const response = await api.post('products/', payload);
      console.log("Product created successfully:", response.data);
      return fromProduct(response.data);
    } catch (error: any) {
      console.error("Product creation failed detail:", error.response?.data?.detail);
      throw error;
    }
  },
  update: async (id: string, data: any) => {
    const payload = toProduct(data);
    const response = await api.patch(`products/${id}`, payload);
    return fromProduct(response.data);
  },
  delete: async (id: string) => {
    await api.delete(`products/${id}`);
  },
  searchImage: async (file: File, category?: string) => {
    const formData = new FormData();
    formData.append("file", file);

    let url = 'products/search-image';
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }

    const response = await api.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return response.data.map(fromProduct);
  }
};

export const salesService = {
  create: async (data: any) => {
    const payload = toSale(data);
    const response = await api.post('sales/', payload);
    return fromSale(response.data);
  },
  getAll: async (filters?: any) => {
    const response = await api.get('sales/', { params: filters });
    return response.data.map(fromSale);
  }
};

export const debtService = {
  getAll: async () => {
    const response = await api.get('debts/');
    return response.data.map(fromDebt);
  },
  create: async (data: any) => {
    const payload = toDebt(data);
    const response = await api.post('debts/', payload);
    return fromDebt(response.data);
  },
  addPayment: async (debtId: string, data: any) => {
    // Payment payload: amount, note?
    const response = await api.post(`debts/${debtId}/payments`, data);
    return response.data;
  }
}

export const expenseService = {
  getAll: async () => {
    const response = await api.get('expenses/');
    return response.data.map((e: any) => ({
      id: e.id,
      amount: e.amount,
      description: e.description,
      branchId: e.branch_id,
      sellerId: e.seller_id,
      date: e.created_at,
    }));
  },
  create: async (data: any) => {
    const payload = {
      amount: data.amount,
      description: data.description,
    };
    const response = await api.post('expenses/', payload);
    return {
      id: response.data.id,
      amount: response.data.amount,
      description: response.data.description,
      branchId: response.data.branch_id,
      sellerId: response.data.seller_id,
      date: response.data.created_at,
    };
  },
  delete: async (id: string) => {
    await api.delete(`expenses/${id}`);
  }
}

export const collectionService = {
  getAll: async () => {
    const response = await api.get('collections/');
    return response.data.map(fromCollection);
  },
  create: async (data: any) => {
    const payload = toCollection(data);
    const response = await api.post('collections/', payload);
    return fromCollection(response.data);
  },
  update: async (id: string, data: any) => {
    const payload = toCollection(data);
    const response = await api.put(`collections/${id}`, payload);
    return fromCollection(response.data);
  },
  delete: async (id: string) => {
    await api.delete(`collections/${id}`);
  }
};

export default api;
