import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import {
  authService,
  productService,
  branchService,
  salesService,
  debtService
} from "../../services/api";

export type UserRole = "admin" | "seller";
export type ProductType = "unit" | "meter";
export type PaymentType = "cash" | "card" | "transfer";
  | "Joynamozlar"
  | "Metrajlar"
  | "Ovalniy"
  | "Kovrik";
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

// Mock data removed. Using API.

export function AppProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
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

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [productsData, branchesData, salesData, debtsData] = await Promise.all([
        productService.getAll(),
        branchService.getAll(),
        salesService.getAll(),
        debtService.getAll()
      ]);
      setProducts(productsData);
      setBranches(branchesData);
      setSales(salesData);
      setDebts(debtsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await authService.getMe();
          setUser(userData);
          fetchData();
        }
      } catch (error) {
        console.error("Auth check failed", error);
        localStorage.removeItem('token');
      }
    };
    initAuth();
  }, [fetchData]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const addSale = async (sale: Sale) => {
    try {
      await salesService.create(sale);
      await fetchData();
    } catch (error) {
      console.error("Failed to add sale", error);
    }
  };

  const addProduct = async (product: Product) => {
    try {
      await productService.create(product);
      await fetchData();
    } catch (error) {
      console.error("Failed to add product", error);
    }
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

  const addDebt = async (debt: Debt) => {
    try {
      await debtService.create(debt);
      await fetchData();
    } catch (error) {
      console.error("Failed to add debt", error);
    }
  };

  const updateDebt = (debtId: string, debt: Debt) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === debtId ? debt : d)),
    );
  };

  const deleteDebt = (debtId: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== debtId));
  };

  const makeDebtPayment = async (
    debtId: string,
    payment: DebtPayment,
  ) => {
    try {
      await debtService.addPayment(debtId, payment);
      await fetchData();
    } catch (error) {
      console.error("Failed to make debt payment", error);
    }
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

  const completeOrder = async (
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

    const salesPromises = basket.map((item, index) => {
      const product = products.find(
        (p) => p.id === item.productId,
      );
      if (!product) return Promise.resolve();

      // Calculate this item's proportion of total calculated price
      const itemProportion = item.total / calculatedTotal;

      // Distribute profit proportionally
      const itemProfit = totalProfit * itemProportion;

      // Determine payment type for this sale
      const mainPaymentType =
        payments.length > 0 ? payments[0].type : "cash";

      const sale: Sale = {
        id: `s${Date.now()}-${index}`, // ID might be ignored by backend or useful for consistent ID before DB
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

      return addSale(sale);
    });

    await Promise.all(salesPromises);
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