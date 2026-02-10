import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AppProvider, useApp } from './context/AppContext';
import { LoginScreen } from './components/auth/LoginScreen';
import { SellerHome } from './components/seller/SellerHome';
import { SellProduct } from './components/seller/SellProduct';
import { SellProductDetail } from './components/seller/SellProductDetail';
import { AddProduct } from './components/seller/AddProduct';
import { AddExpense } from './components/seller/AddExpense';
import { DailySales } from './components/seller/DailySales';
import { Basket } from './components/seller/Basket';
import { Checkout } from './components/seller/Checkout';
import { CreateDebt } from './components/seller/CreateDebt';
import { Debts } from './components/seller/Debts';
import { DebtDetails } from './components/seller/DebtDetails';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminDebts } from './components/admin/AdminDebts';
import { Hisob } from './components/admin/Hisob';
import { BranchDetail } from './components/admin/BranchDetail';
import { BranchProfitDetail } from './components/admin/BranchProfitDetail';
import { CashClosure } from './components/admin/CashClosure';
import { ManageStaffMembers } from './components/admin/ManageStaffMembers';
import { ManageCollections } from './components/admin/ManageCollections';
import { ManageSizes } from './components/admin/ManageSizes';
import { Inventory } from './components/inventory/Inventory';
import { Profile } from './components/Profile';


function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'admin' | 'seller' }) {
  try {
    const { user, isLoading } = useApp();

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/seller/home';
      return <Navigate to={redirectPath} replace />;
    }

    return <>{children}</>;
  } catch (error) {
    // During hot reload, context might be temporarily unavailable
    return null;
  }
}

function AppRoutes() {
  try {
    const { user, isLoading } = useApp();

    // Safety check during hot reload or initial load
    if (isLoading || user === undefined) {
      return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      );
    }

    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />

        {/* Seller Routes */}
        <Route
          path="/seller/home"
          element={
            <ProtectedRoute allowedRole="seller">
              <SellerHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/sell"
          element={
            <ProtectedRoute allowedRole="seller">
              <SellProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/sell/:productId"
          element={
            <ProtectedRoute allowedRole="seller">
              <SellProductDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/add-product"
          element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/edit-product/:id"
          element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/add-expense"
          element={
            <ProtectedRoute allowedRole="seller">
              <AddExpense />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/daily-sales"
          element={
            <ProtectedRoute allowedRole="seller">
              <DailySales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/basket"
          element={
            <ProtectedRoute allowedRole="seller">
              <Basket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/checkout"
          element={
            <ProtectedRoute allowedRole="seller">
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/create-debt"
          element={
            <ProtectedRoute allowedRole="seller">
              <CreateDebt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/debts"
          element={
            <ProtectedRoute allowedRole="seller">
              <Debts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/seller/debt/:id"
          element={
            <ProtectedRoute allowedRole="seller">
              <DebtDetails />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/debts"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDebts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/debt/:id"
          element={
            <ProtectedRoute allowedRole="admin">
              <DebtDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branch/:branchId"
          element={
            <ProtectedRoute allowedRole="admin">
              <BranchDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/branch-profit/:branchId"
          element={
            <ProtectedRoute allowedRole="admin">
              <BranchProfitDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/cash-closure"
          element={
            <ProtectedRoute allowedRole="admin">
              <CashClosure />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-staff-members"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageStaffMembers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-collections"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageCollections />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-sizes"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageSizes />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/hisob"
          element={
            <ProtectedRoute allowedRole="admin">
              <Hisob />
            </ProtectedRoute>
          }
        />

        {/* Shared Routes */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Default Route */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/seller/home'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  } catch (error) {
    // During hot reload, context might be temporarily unavailable
    return null;
  }
}

function AppContent() {
  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <AppRoutes />
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  // Capture start_param before routing potentially strips it
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const startParam = params.get('start_param');
    if (startParam) {
      sessionStorage.setItem('start_param', startParam);
      // Clean up URL to avoid pollution, optional but good practice
      // window.history.replaceState({}, document.title, window.location.pathname); 
      // Actually, let's keep it for now for debug visibility
    }
  }

  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}