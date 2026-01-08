import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type UserRole = "admin" | "seller";
export type ProductType = "unit" | "meter";
export type PaymentType = "cash" | "card" | "transfer";
export type Category =
  | "Gilamlar"
  | "Paloslar"
  | "Joynamozlar"
  | "Metrajlar";
export type Theme = "light" | "dark";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  branchId?: string;
  canAddProducts?: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  type: ProductType;
  branchId: string;
  photo: string;
  collection?: string; // For carpets (Gilamlar) - e.g., 'Lara', 'Emili', 'Isfahan'
  // Unit fields
  quantity?: number;
  maxQuantity?: number; // Maximum/initial quantity for stock tracking
  buyPrice: number;
  sellPrice: number;
  // Meter fields
  totalLength?: number;
  remainingLength?: number;
  width?: number;
  sellPricePerMeter?: number;
  // Carpet-specific fields (for Gilamlar category)
  pricePerSquareMeter?: number; // Price per m² in USD or local currency
  availableSizes?: string[]; // e.g., ["1×2", "2×3", "3×4", "3×5"]
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
  paymentType: PaymentType;
  branchId: string;
  sellerId: string;
  date: string;
  profit?: number; // Extra profit when sold above standard price
  orderId?: string; // Link to order if part of multi-product order
  type: ProductType; // unit or meter
}

export interface BasketItem {
  id: string; // Unique ID for this basket item
  productId: string;
  productName: string;
  category: Category;
  type: ProductType;
  quantity: number;
  pricePerUnit: number;
  total: number;
  photo: string;
  // Carpet-specific fields (for Gilamlar category)
  width?: string; // e.g., "3"
  height?: string; // e.g., "4"
  area?: number; // Calculated area in m² (width × height)
}

export interface Payment {
  type: PaymentType;
  amount: number;
}

export interface Order {
  id: string;
  items: BasketItem[];
  payments: Payment[];
  totalAmount: number;
  sellerEnteredTotal: number; // What the seller actually sold for
  calculatedTotal: number; // Database calculated price
  branchId: string;
  sellerId: string;
  date: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  branchId: string;
  sellerId: string;
  sellerName: string;
  date: string;
  expenseType: "personal" | "shop"; // Personal or shop expense
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  sellerId: string;
  sellerName: string;
  note?: string; // Optional payment note
}

export interface Debt {
  id: string;
  debtorName: string; // Who owes the money
  phoneNumber?: string; // Debtor's phone number
  orderDetails: string; // What they're buying
  totalAmount: number; // Total order amount
  paidAmount: number; // Amount already paid
  remainingAmount: number; // Amount left to pay
  paymentDeadline: string; // When they said they'll pay
  branchId: string;
  sellerId: string;
  sellerName: string;
  date: string; // When debt was created
  status: "pending" | "paid" | "overdue"; // Payment status
  orderItems?: BasketItem[]; // Optional: store the actual items they bought
  paymentHistory: DebtPayment[]; // History of all payments made
}

export interface Branch {
  id: string;
  name: string;
  status: "open" | "closed";
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  debts: Debt[];
  branches: Branch[];
  basket: BasketItem[];
  addToBasket: (item: BasketItem) => void;
  removeFromBasket: (id: string) => void;
  updateBasketItem: (
    id: string,
    quantity: number,
    pricePerUnit: number,
  ) => void;
  updateBasketItemFull: (updatedItem: BasketItem) => void;
  clearBasket: () => void;
  completeOrder: (
    payments: Payment[],
    sellerEnteredTotal: number,
  ) => void;
  addSale: (sale: Sale) => void;
  addProduct: (product: Product) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  renameCollection: (oldName: string, newName: string) => void;
  deleteCollection: (collectionName: string) => void;
  renameSize: (oldSize: string, newSize: string, collectionName?: string) => void;
  deleteSize: (size: string, collectionName?: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (expenseId: string, expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  addDebt: (debt: Debt) => void;
  updateDebt: (debtId: string, debt: Debt) => void;
  deleteDebt: (debtId: string) => void;
  makeDebtPayment: (debtId: string, payment: DebtPayment) => void;
  theme: Theme;
  toggleTheme: () => void;
  staff: User[];
  updateStaffPermission: (
    userId: string,
    canAddProducts: boolean,
  ) => void;
  switchToBranchAccount: (branchId: string) => void;
  switchBackToAdmin: () => void;
  isAdminViewingAsSeller: boolean;
  originalAdminUser: User | null;
}

const AppContext = createContext<AppContextType | undefined>(
  undefined,
);

const MOCK_BRANCHES: Branch[] = [
  { id: "b1", name: "Filial 1", status: "open" },
  { id: "b2", name: "Filial 2", status: "open" },
  { id: "b3", name: "Filial 3", status: "open" },
];

const MOCK_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Isfahan Carpet",
    category: "Gilamlar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
    quantity: 15,
    maxQuantity: 15,
    buyPrice: 150000, // 15 USD per m² * 10000 (exchange rate)
    sellPrice: 180000, // 18 USD per m² * 10000
    collection: "Isfahan",
    pricePerSquareMeter: 180000, // 18 USD per m²
    availableSizes: [
      "1×2",
      "2×3",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "5×5.5",
      "5×7",
    ],
  },
  {
    id: "p2",
    name: "Polas klassik",
    category: "Paloslar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=400",
    totalLength: 100,
    remainingLength: 25,
    width: 3.5,
    buyPrice: 150000,
    sellPrice: 200000,
    sellPricePerMeter: 60000,
  },
  {
    id: "p3",
    name: "Mashad Carpet",
    category: "Gilamlar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=400",
    quantity: 3,
    maxQuantity: 20,
    buyPrice: 70000, // 7 USD per m² * 10000
    sellPrice: 88000, // 8.8 USD per m² * 10000
    collection: "Mashad",
    pricePerSquareMeter: 88000, // 8.8 USD per m²
    availableSizes: [
      "1×2",
      "2×3",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "5×5.5",
      "5×7",
    ],
  },
  {
    id: "p4",
    name: "Joynamoz zamonaviy",
    category: "Joynamozlar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400",
    quantity: 12,
    maxQuantity: 25,
    buyPrice: 80000,
    sellPrice: 120000,
  },
  {
    id: "p5",
    name: "Metraj lux",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1601887370915-c4a9b3b8c7a7?w=400",
    totalLength: 150,
    remainingLength: 80,
    width: 4.0,
    buyPrice: 65000,
    sellPrice: 75000,
    sellPricePerMeter: 75000,
    collection: "Izmir",
    pricePerSquareMeter: 75000, // Price per m²
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
  {
    id: "p6",
    name: "Polas rangli",
    category: "Paloslar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
    quantity: 6,
    maxQuantity: 12,
    buyPrice: 350000,
    sellPrice: 520000,
  },
  {
    id: "p7",
    name: "Emili Carpet",
    category: "Gilamlar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1597218868981-1b68e15f0065?w=400",
    quantity: 18,
    maxQuantity: 20,
    buyPrice: 110000, // 11 USD per m² * 10000
    sellPrice: 130000, // 13 USD per m² * 10000
    collection: "Emili",
    pricePerSquareMeter: 130000, // 13 USD per m²
    availableSizes: [
      "1×2",
      "2×3",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "5×5.5",
      "5×7",
    ],
  },
  {
    id: "p8",
    name: "Metraj premium",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1604762524889-b35929bfe7a8?w=400",
    totalLength: 80,
    remainingLength: 15,
    width: 3.0,
    buyPrice: 75000,
    sellPrice: 85000,
    sellPricePerMeter: 85000,
    collection: "Prestige",
    pricePerSquareMeter: 85000, // Price per m²
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
  {
    id: "p9",
    name: "Joynamoz klassik",
    category: "Joynamozlar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=400",
    quantity: 30,
    maxQuantity: 30,
    buyPrice: 50000,
    sellPrice: 75000,
  },
  {
    id: "p10",
    name: "Lara Carpet",
    category: "Gilamlar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400",
    quantity: 9,
    maxQuantity: 18,
    buyPrice: 130000, // 13 USD per m² * 10000
    sellPrice: 150000, // 15 USD per m² * 10000
    collection: "Lara",
    pricePerSquareMeter: 150000, // 15 USD per m²
    availableSizes: [
      "1×2",
      "2×3",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "5×5.5",
      "5×7",
    ],
  },
  {
    id: "p11",
    name: "Polas yupqa",
    category: "Paloslar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1622983280777-e97d2ab7f0c6?w=400",
    totalLength: 120,
    remainingLength: 95,
    width: 2.5,
    buyPrice: 120000,
    sellPrice: 165000,
    sellPricePerMeter: 55000,
  },
  {
    id: "p12",
    name: "Joynamoz qalin",
    category: "Joynamozlar",
    type: "unit",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1574643156929-51fa098b0394?w=400",
    quantity: 2,
    maxQuantity: 15,
    buyPrice: 100000,
    sellPrice: 150000,
  },
  // Additional Metraj products for collection system
  {
    id: "p13",
    name: "Metraj lara",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    totalLength: 200,
    remainingLength: 175,
    width: 3.5,
    buyPrice: 50000,
    sellPrice: 60000,
    sellPricePerMeter: 60000,
    collection: "Lara",
    pricePerSquareMeter: 60000,
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
  {
    id: "p14",
    name: "Metraj emili",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    totalLength: 250,
    remainingLength: 220,
    width: 3.0,
    buyPrice: 35000,
    sellPrice: 45000,
    sellPricePerMeter: 45000,
    collection: "Emili",
    pricePerSquareMeter: 45000,
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
  {
    id: "p15",
    name: "Metraj melord",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    totalLength: 180,
    remainingLength: 145,
    width: 4.0,
    buyPrice: 55000,
    sellPrice: 68000,
    sellPricePerMeter: 68000,
    collection: "Melord",
    pricePerSquareMeter: 68000,
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
  {
    id: "p16",
    name: "Metraj mashad",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    totalLength: 160,
    remainingLength: 130,
    width: 3.5,
    buyPrice: 60000,
    sellPrice: 72000,
    sellPricePerMeter: 72000,
    collection: "Mashad",
    pricePerSquareMeter: 72000,
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
  {
    id: "p17",
    name: "Metraj isfahan",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    totalLength: 140,
    remainingLength: 110,
    width: 4.0,
    buyPrice: 52000,
    sellPrice: 65000,
    sellPricePerMeter: 65000,
    collection: "Isfahan",
    pricePerSquareMeter: 65000,
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
  {
    id: "p18",
    name: "Metraj sultan",
    category: "Metrajlar",
    type: "meter",
    branchId: "b1",
    photo:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
    totalLength: 100,
    remainingLength: 78,
    width: 4.5,
    buyPrice: 80000,
    sellPrice: 95000,
    sellPricePerMeter: 95000,
    collection: "Sultan",
    pricePerSquareMeter: 95000,
    availableSizes: [
      "1×1.5",
      "1×2",
      "1.5×2",
      "1.5×2.5",
      "2×2.5",
      "2×3",
      "2.5×3",
      "2.5×3.5",
      "3×3.5",
      "3×4",
      "3×5",
      "3×6",
      "3×7",
      "3.5×4",
      "3.5×4.5",
      "3.5×5",
      "3.5×5.5",
      "3.5×6",
      "3.5×7",
      "4×4.5",
      "4×5",
      "4×6",
      "4×7",
      "4.5×5",
      "4.5×6",
      "4.5×7",
      "5×5.5",
      "5×6",
      "5×7",
    ],
  },
];

const MOCK_SALES: Sale[] = [
  // Order 1: Multi-product order with PROFIT (3 products, sold above standard price)
  {
    id: "s1",
    productId: "p1",
    productName: "Isfahan Carpet",
    quantity: 12, // 3×4 carpet (12m²)
    amount: 2280000, // Database: 2,160,000, Sold: 2,280,000
    paymentType: "cash",
    branchId: "b1",
    sellerId: "22222",
    date: new Date().toISOString(),
    orderId: "order-001",
    type: "unit",
    profit: 120000, // +120,000 profit
  },
  {
    id: "s2",
    productId: "p10",
    productName: "Lara Carpet",
    quantity: 6, // 2×3 carpet (6m²)
    amount: 960000, // Database: 900,000 (6m² × 150,000), Sold: 960000
    paymentType: "cash",
    branchId: "b1",
    sellerId: "22222",
    date: new Date().toISOString(),
    orderId: "order-001",
    type: "unit",
    profit: 60000, // +60,000 profit
  },
  {
    id: "s3",
    productId: "p4",
    productName: "Joynamoz zamonaviy",
    quantity: 2,
    amount: 260000, // Database: 240,000 (2 × 120,000), Sold: 260000
    paymentType: "cash",
    branchId: "b1",
    sellerId: "22222",
    date: new Date().toISOString(),
    orderId: "order-001",
    type: "unit",
    profit: 20000, // +20,000 profit
  },

  // Order 2: Multi-product order with LOSS (2 products, gave discount)
  {
    id: "s4",
    productId: "p7",
    productName: "Emili Carpet",
    quantity: 12, // 3×4 carpet (12m²)
    amount: 1480000, // Database: 1,560,000 (12m² × 130,000), Sold: 1,480,000
    paymentType: "card",
    branchId: "b1",
    sellerId: "22222",
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    orderId: "order-002",
    type: "unit",
    profit: -80000, // -80,000 loss
  },
  {
    id: "s5",
    productId: "p3",
    productName: "Mashad Carpet",
    quantity: 6, // 2×3 carpet (6m²)
    amount: 500000, // Database: 528,000 (6m² × 88,000), Sold: 500,000
    paymentType: "card",
    branchId: "b1",
    sellerId: "22222",
    date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    orderId: "order-002",
    type: "unit",
    profit: -28000, // -28,000 loss
  },

  // Order 3: Multi-product order at BASE PRICE (2 products, exact database price)
  {
    id: "s6",
    productId: "p5",
    productName: "Metraj lux",
    quantity: 20, // Area: 20m² (e.g., 4×5 size)
    amount: 1500000, // Database: 1,500,000 (20m² × 75,000), Sold: 1,500,000
    paymentType: "transfer",
    branchId: "b1",
    sellerId: "22222",
    date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    orderId: "order-003",
    type: "meter",
    // No profit field = sold at exact database price
  },
  {
    id: "s7",
    productId: "p9",
    productName: "Joynamoz klassik",
    quantity: 3,
    amount: 225000, // Database: 225,000 (3 × 75,000), Sold: 225,000
    paymentType: "transfer",
    branchId: "b1",
    sellerId: "22222",
    date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    orderId: "order-003",
    type: "unit",
    // No profit field = sold at exact database price
  },
];

const MOCK_EXPENSES: Expense[] = [
  {
    id: "e1",
    description: "Tushlik",
    amount: 500000,
    branchId: "b1",
    sellerId: "22222",
    sellerName: "Aziz Rahimov",
    date: new Date().toISOString(),
    expenseType: "personal",
  },
  {
    id: "e2",
    description: "Taksi",
    amount: 300000,
    branchId: "b1",
    sellerId: "22222",
    sellerName: "Aziz Rahimov",
    date: new Date().toISOString(),
    expenseType: "personal",
  },
  {
    id: "e3",
    description: "Kommunal xizmatlar",
    amount: 500000,
    branchId: "b2",
    sellerId: "33333",
    sellerName: "Jasur Aliyev",
    date: new Date().toISOString(),
    expenseType: "shop",
  },
  {
    id: "e4",
    description: "Sotuvchi oylig",
    amount: 300000,
    branchId: "b2",
    sellerId: "33333",
    sellerName: "Jasur Aliyev",
    date: new Date().toISOString(),
    expenseType: "personal",
  },
  {
    id: "e5",
    description: "Kommunal xizmatlar",
    amount: 500000,
    branchId: "b3",
    sellerId: "44444",
    sellerName: "Sardor Umarov",
    date: new Date().toISOString(),
    expenseType: "shop",
  },
  {
    id: "e6",
    description: "Sotuvchi oylig",
    amount: 300000,
    branchId: "b3",
    sellerId: "44444",
    sellerName: "Sardor Umarov",
    date: new Date().toISOString(),
    expenseType: "personal",
  },
];

const MOCK_DEBTS: Debt[] = [
  {
    id: "d1",
    debtorName: "Ali Karimov",
    phoneNumber: "+998 90 123 45 67",
    orderDetails: "Isfahan Carpet (3×4)",
    totalAmount: 2280000,
    paidAmount: 1000000,
    remainingAmount: 1280000,
    paymentDeadline: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
    branchId: "b1",
    sellerId: "22222",
    sellerName: "Aziz Rahimov",
    date: new Date().toISOString(),
    status: "pending",
    orderItems: [
      {
        id: "bi1",
        productId: "p1",
        productName: "Isfahan Carpet",
        category: "Gilamlar",
        type: "unit",
        quantity: 12,
        pricePerUnit: 190000,
        total: 2280000,
        photo:
          "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
        width: "3",
        height: "4",
        area: 12,
      },
    ],
    paymentHistory: [
      {
        id: "dp1",
        amount: 500000,
        date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        sellerId: "22222",
        sellerName: "Aziz Rahimov",
        note: "Dastlabki to'lov",
      },
      {
        id: "dp2",
        amount: 500000,
        date: new Date().toISOString(),
        sellerId: "22222",
        sellerName: "Aziz Rahimov",
      },
    ],
  },
  {
    id: "d2",
    debtorName: "Nargiza Nazarova",
    phoneNumber: "+998 91 234 56 78",
    orderDetails: "Lara Carpet (2×3)",
    totalAmount: 960000,
    paidAmount: 500000,
    remainingAmount: 460000,
    paymentDeadline: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
    branchId: "b1",
    sellerId: "22222",
    sellerName: "Aziz Rahimov",
    date: new Date().toISOString(),
    status: "pending",
    orderItems: [
      {
        id: "bi2",
        productId: "p10",
        productName: "Lara Carpet",
        category: "Gilamlar",
        type: "unit",
        quantity: 6,
        pricePerUnit: 160000,
        total: 960000,
        photo:
          "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400",
        width: "2",
        height: "3",
        area: 6,
      },
    ],
    paymentHistory: [
      {
        id: "dp3",
        amount: 500000,
        date: new Date().toISOString(),
        sellerId: "22222",
        sellerName: "Aziz Rahimov",
        note: "Naqd to'lov",
      },
    ],
  },
  {
    id: "d3",
    debtorName: "Ali Karimov",
    orderDetails: "Metraj lux (4×5)",
    totalAmount: 1500000,
    paidAmount: 1500000,
    remainingAmount: 0,
    paymentDeadline: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    branchId: "b1",
    sellerId: "22222",
    sellerName: "Aziz Rahimov",
    date: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
    status: "paid",
    orderItems: [
      {
        id: "bi3",
        productId: "p5",
        productName: "Metraj lux",
        category: "Metrajlar",
        type: "meter",
        quantity: 20,
        pricePerUnit: 75000,
        total: 1500000,
        photo:
          "https://images.unsplash.com/photo-1601887370915-c4a9b3b8c7a7?w=400",
        width: "4",
        height: "5",
        area: 20,
      },
    ],
    paymentHistory: [
      {
        id: "dp4",
        amount: 1000000,
        date: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
        sellerId: "22222",
        sellerName: "Aziz Rahimov",
        note: "Dastlabki to'lov",
      },
      {
        id: "dp5",
        amount: 500000,
        date: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
        sellerId: "22222",
        sellerName: "Aziz Rahimov",
        note: "Yakuniy to'lov",
      },
    ],
  },
  {
    id: "d4",
    debtorName: "Ali Karimov",
    orderDetails: "Joynamoz zamonaviy (3x)",
    totalAmount: 360000,
    paidAmount: 360000,
    remainingAmount: 0,
    paymentDeadline: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
    branchId: "b1",
    sellerId: "22222",
    sellerName: "Aziz Rahimov",
    date: new Date(Date.now() - 3024000000).toISOString(), // 35 days ago
    status: "paid",
    orderItems: [
      {
        id: "bi4",
        productId: "p4",
        productName: "Joynamoz zamonaviy",
        category: "Joynamozlar",
        type: "unit",
        quantity: 3,
        pricePerUnit: 120000,
        total: 360000,
        photo:
          "https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=400",
      },
    ],
    paymentHistory: [
      {
        id: "dp6",
        amount: 360000,
        date: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        sellerId: "22222",
        sellerName: "Aziz Rahimov",
      },
    ],
  },
];

const MOCK_STAFF: User[] = [
  {
    id: "u1",
    name: "Aziz Rahimov",
    role: "seller",
    branchId: "b1",
    canAddProducts: true,
  },
  {
    id: "u2",
    name: "Kamola Tursunova",
    role: "seller",
    branchId: "b1",
    canAddProducts: false,
  },
  {
    id: "u3",
    name: "Jasur Aliyev",
    role: "seller",
    branchId: "b2",
    canAddProducts: true,
  },
  {
    id: "u4",
    name: "Dilnoza Karimova",
    role: "seller",
    branchId: "b2",
    canAddProducts: false,
  },
  {
    id: "u5",
    name: "Sardor Umarov",
    role: "seller",
    branchId: "b3",
    canAddProducts: true,
  },
  {
    id: "u6",
    name: "Malika Nazarova",
    role: "seller",
    branchId: "b3",
    canAddProducts: false,
  },
];

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] =
    useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(MOCK_SALES);
  const [expenses, setExpenses] =
    useState<Expense[]>(MOCK_EXPENSES);
  const [debts, setDebts] = useState<Debt[]>(MOCK_DEBTS);
  const [branches] = useState<Branch[]>(MOCK_BRANCHES);
  const [staff, setStaff] = useState<User[]>(MOCK_STAFF);
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    return (saved as Theme) || "light";
  });
  
  // Account switching state
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null);
  const [isAdminViewingAsSeller, setIsAdminViewingAsSeller] = useState(false);

  // Apply theme to document
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const addSale = (sale: Sale) => {
    setSales((prev) => [...prev, sale]);

    // Update product quantity/length
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === sale.productId) {
          if (p.type === "unit" && p.quantity) {
            return {
              ...p,
              quantity: p.quantity - sale.quantity,
            };
          } else if (p.type === "meter" && p.remainingLength) {
            return {
              ...p,
              remainingLength:
                p.remainingLength - sale.quantity,
            };
          }
        }
        return p;
      }),
    );
  };

  const addProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const updateProduct = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, ...updates } : p)),
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const renameCollection = (oldName: string, newName: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.collection === oldName ? { ...p, collection: newName } : p,
      ),
    );
  };

  const deleteCollection = (collectionName: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.collection === collectionName ? { ...p, collection: undefined } : p,
      ),
    );
  };

  const renameSize = (oldSize: string, newSize: string, collectionName?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (collectionName && p.collection !== collectionName) {
          return p;
        }
        return {
          ...p,
          availableSizes: p.availableSizes?.map((size) =>
            size === oldSize ? newSize : size,
          ),
        };
      }),
    );
  };

  const deleteSize = (size: string, collectionName?: string) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (collectionName && p.collection !== collectionName) {
          return p;
        }
        return {
          ...p,
          availableSizes: p.availableSizes?.filter((s) => s !== size),
        };
      }),
    );
  };

  const addExpense = (expense: Expense) => {
    setExpenses((prev) => [...prev, expense]);
  };

  const updateExpense = (
    expenseId: string,
    expense: Expense,
  ) => {
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? expense : e)),
    );
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses((prev) =>
      prev.filter((e) => e.id !== expenseId),
    );
  };

  const addDebt = (debt: Debt) => {
    setDebts((prev) => [...prev, debt]);
  };

  const updateDebt = (debtId: string, debt: Debt) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === debtId ? debt : d)),
    );
  };

  const deleteDebt = (debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
  };

  const makeDebtPayment = (
    debtId: string,
    payment: DebtPayment,
  ) => {
    setDebts((prev) =>
      prev.map((d) => {
        if (d.id === debtId) {
          const currentHistory = d.paymentHistory || [];
          return {
            ...d,
            paidAmount: d.paidAmount + payment.amount,
            remainingAmount:
              d.remainingAmount - payment.amount,
            paymentHistory: [...currentHistory, payment],
            status:
              d.remainingAmount - payment.amount <= 0
                ? "paid"
                : "pending",
          };
        }
        return d;
      }),
    );
  };

  const updateStaffPermission = (
    userId: string,
    canAddProducts: boolean,
  ) => {
    setStaff((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, canAddProducts };
        }
        return u;
      }),
    );
  };

  const [basket, setBasket] = useState<BasketItem[]>([]);

  const addToBasket = (item: BasketItem) => {
    setBasket((prev) => [...prev, item]);
  };

  const removeFromBasket = (id: string) => {
    setBasket((prev) => prev.filter((item) => item.id !== id));
  };

  const updateBasketItem = (
    id: string,
    quantity: number,
    pricePerUnit: number,
  ) => {
    setBasket((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              pricePerUnit,
              total: quantity * pricePerUnit,
            }
          : item,
      ),
    );
  };

  const updateBasketItemFull = (updatedItem: BasketItem) => {
    setBasket((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    );
  };

  const clearBasket = () => {
    setBasket([]);
  };

  const completeOrder = (
    payments: Payment[],
    sellerEnteredTotal: number,
  ) => {
    if (!user) return;

    const orderId = `o${Date.now()}`;
    const calculatedTotal = basket.reduce(
      (sum, item) => sum + item.total,
      0,
    );

    // Calculate total profit: seller entered total - database calculated total
    const totalProfit = sellerEnteredTotal - calculatedTotal;

    // Distribute profit proportionally across items
    basket.forEach((item, index) => {
      const product = products.find(
        (p) => p.id === item.productId,
      );
      if (!product) return;

      // Calculate this item's proportion of total calculated price
      const itemProportion = item.total / calculatedTotal;

      // Distribute profit proportionally
      const itemProfit = totalProfit * itemProportion;

      // Determine payment type for this sale
      const mainPaymentType =
        payments.length > 0 ? payments[0].type : "cash";

      const sale: Sale = {
        id: `s${Date.now()}-${index}`,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        amount: item.total + itemProfit, // Item's share of seller entered total
        paymentType: mainPaymentType,
        branchId: user.branchId || "",
        sellerId: user.id,
        date: new Date().toISOString(),
        orderId: orderId,
        profit: itemProfit,
        type: item.type,
      };

      addSale(sale);
    });

    clearBasket();
  };

  const switchToBranchAccount = (branchId: string) => {
    if (!user || user.role !== "admin") return;

    setOriginalAdminUser(user);
    setIsAdminViewingAsSeller(true);
    setUser({
      id: user.id,
      name: user.name,
      role: "seller",
      branchId: branchId,
      canAddProducts: true,
    });
  };

  const switchBackToAdmin = () => {
    if (!originalAdminUser) return;

    setIsAdminViewingAsSeller(false);
    setUser(originalAdminUser);
    setOriginalAdminUser(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        products,
        sales,
        expenses,
        debts,
        branches,
        basket,
        addToBasket,
        removeFromBasket,
        updateBasketItem,
        updateBasketItemFull,
        clearBasket,
        completeOrder,
        addSale,
        addProduct,
        updateProduct,
        deleteProduct,
        renameCollection,
        deleteCollection,
        renameSize,
        deleteSize,
        addExpense,
        updateExpense,
        deleteExpense,
        addDebt,
        updateDebt,
        deleteDebt,
        makeDebtPayment,
        theme,
        toggleTheme,
        staff,
        updateStaffPermission,
        switchToBranchAccount,
        switchBackToAdmin,
        isAdminViewingAsSeller,
        originalAdminUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}