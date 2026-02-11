import {
  Home,
  ShoppingCart,
  Package,
  User,
  Receipt,
  DollarSign,
  Wallet,
  CreditCard,
  FileText,
  Calculator,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";

interface BottomNavProps {
  onCheckoutClick?: () => void;
}

export function BottomNav({ onCheckoutClick }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, basket } = useApp();
  const { t } = useLanguage();

  const isAdmin = user?.role === "admin";
  const baseRoute = isAdmin ? "/admin" : "/seller";
  const isOnBasketPage = location.pathname === "/seller/basket";

  const navItems = isAdmin
    ? [
      {
        icon: Home,
        label: t('nav.home'),
        path: "/admin/dashboard",
      },
      {
        icon: Calculator,
        label: t('admin.reports'),
        path: "/admin/hisob",
      },
      {
        icon: ShoppingCart,
        label: t('nav.inventory'),
        path: "/inventory",
      },
      {
        icon: FileText,
        label: t('nav.debts'),
        path: "/admin/debts",
      },
      { icon: User, label: t('nav.profile'), path: "/profile" },
    ]
    : [
      { icon: Home, label: t('nav.home'), path: "/seller/home" },
      {
        icon: Wallet,
        label: t('nav.expenses'),
        path: "/seller/add-expense",
      },
      {
        icon: isOnBasketPage ? CreditCard : ShoppingCart,
        label: isOnBasketPage ? t('seller.checkout') : t('seller.basket'),
        path: isOnBasketPage
          ? "/seller/checkout"
          : "/seller/basket",
        isFloating: true, // Mark this as the floating button
        showBadge: !isOnBasketPage, // Only show badge when not on basket page
      },
      { icon: Package, label: t('nav.inventory'), path: "/inventory" },
      { icon: User, label: t('nav.profile'), path: "/profile" },
    ];

  const isActive = (path: string) =>
    location.pathname.startsWith(path);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* SVG curve background for seller nav with 5 items */}
      {!isAdmin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg
            className="w-full h-full"
            viewBox="0 0 375 65"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0,10 L 0,65 L 375,65 L 375,10 L 265,10 Q 250,10 240,15 Q 230,20 225,30 Q 220,40 210,45 Q 200,50 187.5,50 Q 175,50 165,45 Q 155,40 150,30 Q 145,20 135,15 Q 125,10 110,10 Z"
              className="fill-card/80 dark:fill-card/90 stroke-border/50"
              strokeWidth="1"
            />
          </svg>
          <div className="absolute inset-0 glass opacity-50 dark:opacity-20" style={{ clipPath: "path('M 0,10 L 0,65 L 375,65 L 375,10 L 265,10 Q 250,10 240,15 Q 230,20 225,30 Q 220,40 210,45 Q 200,50 187.5,50 Q 175,50 165,45 Q 155,40 150,30 Q 145,20 135,15 Q 125,10 110,10 Z')" }} />
        </div>
      )}

      {/* Simple background for admin nav */}
      {isAdmin && (
        <div className="absolute top-0 left-0 w-full h-full glass rounded-t-3xl shadow-lg border-t border-border/50" />
      )}

      <div className="flex justify-around items-center relative pt-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          // Special styling for floating button
          if (item.isFloating) {
            return (
              <div
                key={item.path}
                className="flex-1 flex justify-center"
              >
                <button
                  onClick={() => {
                    if (isOnBasketPage && onCheckoutClick) {
                      onCheckoutClick();
                    } else {
                      navigate(item.path);
                    }
                  }}
                  className="absolute -top-6 w-18 h-18 bg-primary rounded-full shadow-lg border-4 border-background flex items-center justify-center transition-transform hover:scale-105 active:scale-95 z-10"
                >
                  <Icon
                    className="h-7 w-7 text-primary-foreground"
                    strokeWidth={2}
                  />
                  {item.showBadge && basket.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold min-w-[22px] h-[22px] rounded-full flex items-center justify-center border-2 border-background">
                      {basket.length}
                    </span>
                  )}
                </button>
              </div>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-1 flex-col items-center space-y-1 py-3 transition-colors relative z-10 ${active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Icon
                className={`h-6 w-6`}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}