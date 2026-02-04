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
  debtService,
  expenseService,
  collectionService,
  staffService,
  settingsService
} from "../../services/api";

export type UserRole = "admin" | "seller";
export type ProductType = "unit" | "meter";
export type PaymentType = "cash" | "card" | "transfer" | "debt";
export type Category =
  | "Gilamlar"
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
  code: string;
  name?: string;
  category: Category;
  type: ProductType;
  branchId: string;
  photo: string;
  collection?: string;
  buyPriceUsd?: number;
  isUsdPriced?: boolean;
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
  availableSizes?: any[]; // e.g., [{size: "1×2", quantity: 5}]
  similarity_percentage?: number; // AI search similarity score
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
  profit?: number; // Total profit
  admin_profit?: number;
  seller_profit?: number;
  orderId?: string;
  type: ProductType; // unit or meter
  size?: string; // Track which size was sold
  width?: number;
  length?: number;
  area?: number;
  isNasiya?: boolean;
  exchange_rate?: number;
}

export interface Collection {
  id: string;
  name: string;
  icon?: string;
  price_per_sqm?: number;
  buy_price_per_sqm?: number;
  price_usd_per_sqm?: number;
  price_nasiya_per_sqm?: number;
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
  size?: string; // Selected size for units
  // Carpet-specific fields (for Gilamlar category)
  width?: string; // e.g., "3"
  height?: string; // e.g., "4"
  area?: number; // Calculated area in m² (width × height)
  collection: string;
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
  category: "branch" | "staff";
  branchId: string;
  sellerId: string;
  staffId?: string; // ID of StaffMember
  date: string;
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
  orderId?: string; // Link to the order
}

export interface Branch {
  id: string;
  name: string;
  status: "open" | "closed";
}

export interface StaffMember {
  id: string;
  name: string;
  branchId: string;
  isActive: boolean;
}

export interface Collection {
  id: string;
  name: string;
  icon?: string;
  price_per_sqm?: number;
  buy_price_per_sqm?: number;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  debts: Debt[];
  branches: Branch[];
  staffMembers: StaffMember[];
  collections: Collection[];
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
  renameSize: (oldSize: string, newSize: string, collectionName?: string) => void;
  deleteSize: (size: string, collectionName?: string) => void;
  addCollection: (collection: Partial<Collection>) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  addStaffMember: (data: Partial<StaffMember>) => Promise<void>;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;
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
  fetchData: () => Promise<void>;
  isLoading: boolean;
  addBranch: (name: string) => Promise<void>;
  deleteBranch: (id: string) => Promise<void>;
  exchangeRate: number;
  updateExchangeRate: (rate: number) => Promise<void>;
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
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(12200);
  const [isLoading, setIsLoading] = useState(true);
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

      const fetchSafe = async (fn: () => Promise<any>, setter: (val: any) => void) => {
        try {
          const data = await fn();
          setter(data);
        } catch (e) {
          console.error(`Fetch failed:`, e);
        }
      };

      await Promise.all([
        fetchSafe(() => productService.getAll(), setProducts),
        fetchSafe(() => branchService.getAll(), setBranches),
        fetchSafe(() => salesService.getAll(), setSales),
        fetchSafe(() => debtService.getAll(), setDebts),
        fetchSafe(() => expenseService.getAll(), setExpenses),
        fetchSafe(() => collectionService.getAll(), setCollections),
        fetchSafe(() => staffService.getAll(), setStaffMembers),
        fetchSafe(() => settingsService.get(), (data) => setExchangeRate(data.exchange_rate))
      ]);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setIsLoading(false);
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
      } finally {
        setIsLoading(false);
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
    // Оптимистичное обновление UI - добавляем товар мгновенно
    const optimisticProduct = {
      ...product,
      id: product.id || `temp-${Date.now()}`, // Временный ID если не указан
    };

    // Мгновенно добавляем в локальное состояние
    setProducts((prev) => [...prev, optimisticProduct]);

    try {
      // Отправляем на сервер в фоне
      const savedProduct = await productService.create(product);

      // Обновляем с реальными данными от сервера
      setProducts((prev) =>
        prev.map((p) => (p.id === optimisticProduct.id ? savedProduct : p))
      );
    } catch (error) {
      // Если ошибка - удаляем оптимистичный товар
      setProducts((prev) =>
        prev.filter((p) => p.id !== optimisticProduct.id)
      );
      console.error("Failed to add product", error);
      throw error;
    }
  };

  const updateProduct = async (
    productId: string,
    updates: Partial<Product>,
  ) => {
    try {
      const updatedProduct = await productService.update(
        productId,
        updates,
      );
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? updatedProduct : p,
        ),
      );
      return updatedProduct;
    } catch (error: any) {
      console.error("Failed to update product:", error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await productService.delete(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (error: any) {
      console.error("Failed to delete product:", error);
      throw error;
    }
  };

  const renameCollection = (oldName: string, newName: string) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.collection === oldName ? { ...p, collection: newName } : p,
      ),
    );
  };

  const addCollection = async (collection: Partial<Collection>) => {
    try {
      await collectionService.create(collection);
      await fetchData();
    } catch (error) {
      console.error("Failed to add collection", error);
      throw error;
    }
  };

  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      await collectionService.update(id, updates);
      await fetchData();
    } catch (error) {
      console.error("Failed to update collection", error);
      throw error;
    }
  };

  const deleteCollection = async (id: string) => {
    try {
      await collectionService.delete(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete collection", error);
      throw error;
    }
  };

  const addStaffMember = async (data: Partial<StaffMember>) => {
    try {
      await staffService.create(data);
      await fetchData();
    } catch (error) {
      console.error("Failed to add staff member", error);
      throw error;
    }
  };

  const updateStaffMember = async (id: string, updates: Partial<StaffMember>) => {
    try {
      await staffService.update(id, updates);
      await fetchData();
    } catch (error) {
      console.error("Failed to update staff member", error);
      throw error;
    }
  };

  const deleteStaffMember = async (id: string) => {
    try {
      await staffService.delete(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete staff member", error);
      throw error;
    }
  };

  const deleteCollectionLegacy = (collectionName: string) => {
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

  const addExpense = async (expense: Expense) => {
    try {
      await expenseService.create(expense);
      await fetchData();
    } catch (error) {
      console.error("Failed to add expense", error);
      throw error;
    }
  };

  const updateExpense = async (
    expenseId: string,
    expense: Expense,
  ) => {
    // Currently no update endpoint, just local state
    setExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? expense : e)),
    );
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      await expenseService.delete(expenseId);
      setExpenses((prev) =>
        prev.filter((e) => e.id !== expenseId),
      );
    } catch (error) {
      console.error("Failed to delete expense", error);
      throw error;
    }
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

  const addBranch = async (name: string) => {
    try {
      await branchService.create({ name });
      await fetchData();
    } catch (error) {
      console.error("Failed to add branch", error);
      throw error;
    }
  };

  const deleteBranch = async (id: string) => {
    try {
      await branchService.delete(id);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete branch", error);
      throw error;
    }
  };

  const updateExchangeRate = async (rate: number) => {
    try {
      await settingsService.update({ exchange_rate: rate });
      setExchangeRate(rate);
    } catch (error) {
      console.error("Failed to update exchange rate", error);
      throw error;
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
    isNasiya: boolean = false
  ): Promise<string> => {
    if (!user) return "";

    const orderId = `o${Date.now()}`;
    const calculatedTotal = basket.reduce(
      (sum, item) => {
        if (!isNasiya) return sum + item.total;

        const collection = collections.find(c => c.name === item.collection);
        if (!collection || !collection.price_nasiya_per_sqm) return sum + item.total;

        if (item.area) return sum + (collection.price_nasiya_per_sqm * item.area);
        return sum + (collection.price_nasiya_per_sqm * item.quantity);
      },
      0,
    );

    // Calculate total profit: seller entered total - database calculated total
    // Note: calculatedTotal here is the BASE price (either Oddiy or Nasiya)
    const totalProfit = sellerEnteredTotal - calculatedTotal;

    // Determine payment distribution
    let remainingCash = payments.find(p => p.type === "cash")?.amount || 0;
    let remainingCard = payments.find(p => p.type === "card")?.amount || 0;
    let remainingTransfer = payments.find(p => p.type === "transfer")?.amount || 0;
    let remainingDebt = payments.find(p => p.type === "debt")?.amount || 0;

    const salesPromises = basket.map((item, index) => {
      const product = products.find(
        (p) => p.id === item.productId,
      );
      if (!product) return Promise.resolve();

      // Calculate base price for this item (either normal sell price or nasiya price)
      let itemBaseTotal = item.total;
      if (isNasiya) {
        const collection = collections.find(c => c.name === item.collection);
        if (collection && collection.price_nasiya_per_sqm) {
          if (item.area) itemBaseTotal = collection.price_nasiya_per_sqm * item.area;
          else itemBaseTotal = collection.price_nasiya_per_sqm * item.quantity;
        }
      }

      // Calculate this item's proportion of total calculated price
      const itemProportion = itemBaseTotal / calculatedTotal;

      // Distribute seller markup proportionally
      const itemProfit = totalProfit * itemProportion;

      // Calculate this item's total with markup
      const itemTotalWithMarkup = itemBaseTotal + itemProfit;

      // Determine payment type for this sale based on remaining amounts
      let paymentType: PaymentType = "cash";

      if (remainingCash >= itemTotalWithMarkup) {
        paymentType = "cash";
        remainingCash -= itemTotalWithMarkup;
      } else if (remainingCash > 0) {
        paymentType = "cash";
        remainingCash = 0;
      } else if (remainingCard >= itemTotalWithMarkup) {
        paymentType = "card";
        remainingCard -= itemTotalWithMarkup;
      } else if (remainingCard > 0) {
        paymentType = "card";
        remainingCard = 0;
      } else if (remainingTransfer >= itemTotalWithMarkup) {
        paymentType = "transfer";
        remainingTransfer -= itemTotalWithMarkup;
      } else if (remainingTransfer > 0) {
        paymentType = "transfer";
        remainingTransfer = 0;
      } else {
        paymentType = "debt";
        remainingDebt -= itemTotalWithMarkup;
      }

      // Map dimensions and area
      let width = item.width ? parseFloat(item.width) : undefined;
      let length = item.height ? parseFloat(item.height) : (item.type === 'meter' ? item.quantity : undefined);
      let area = item.area;

      if (item.type === 'meter' && !width && product.width) {
        width = product.width;
      }

      if (!area && width && length) {
        area = width * length;
      }

      const sale: any = {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        amount: itemTotalWithMarkup,
        paymentType: paymentType,
        branchId: user.branchId || "",
        sellerId: user.id,
        date: new Date().toISOString(),
        orderId: orderId,
        profit: itemProfit,
        type: item.type,
        width,
        length,
        area,
        isNasiya: isNasiya
      };

      return addSale(sale);
    });

    await Promise.all(salesPromises);
    clearBasket();
    return orderId;
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
        collections,
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
        renameSize,
        deleteSize,
        addCollection,
        updateCollection,
        deleteCollection,
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
        fetchData,
        isLoading,
        addBranch,
        deleteBranch,
        staffMembers,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        exchangeRate,
        updateExchangeRate,
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