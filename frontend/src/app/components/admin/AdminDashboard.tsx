import { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  ChevronRight,
  HandCoins,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useApp, Sale } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { BottomNav } from "../shared/BottomNav";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";

export function AdminDashboard() {
  const [period, setPeriod] = useState<
    "today" | "week" | "month" | "custom"
  >("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSalesDetailExpanded, setIsSalesDetailExpanded] =
    useState(false);
  const navigate = useNavigate();
  const { sales, branches, debts, exchangeRate } = useApp();
  const { t } = useLanguage();

  // Helper to filter sales by period
  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= today;
        });
      case "week":
        // Start from Monday
        const weekStart = new Date(today);
        const day = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= weekStart;
        });
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= monthStart;
        });
      case "custom":
        if (!dateRange?.from) return sales;
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
        to.setHours(23, 59, 59, 999);
        return sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= from && saleDate <= to;
        });
      default:
        return sales;
    }
  };

  const filteredSales = getFilteredSales();

  // Calculate KPIs using ONLY TODAY's sales, as requested
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaySalesData = sales.filter((sale) => new Date(sale.date) >= todayStart);

  const totalSales = todaySalesData.reduce(
    (sum, sale) => sum + sale.amount,
    0,
  );
  const totalSellerProfit = todaySalesData.reduce(
    (acc: number, sale: Sale) => acc + (sale.sellerProfit || 0),
    0
  );

  const formatCurrency = (amount: number, currency: "USD" | "UZS" = "USD") => {
    if (currency === "UZS") {
      return new Intl.NumberFormat("uz-UZ", {
        style: "currency",
        currency: "UZS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const branchColors = ["#3b82f6", "#22c55e", "#f59e0b"]; // blue, green, orange
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Filter Section */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10 shadow-sm mb-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 w-full overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setPeriod("today")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${period === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.today')}
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${period === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.week')}
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${period === "month"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.month')}
            </button>
            <button
              onClick={() => setPeriod("custom")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${period === "custom"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.other')}
            </button>
          </div>

          {period === "custom" && (
            <div className="mt-4 flex justify-center animate-in slide-in-from-top-2 fade-in">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full sm:w-auto" />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-3 max-w-7xl mx-auto">
        {/* Stats Grid - 2x2 Layout */}
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {/* Total Sales */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 border-0 shadow-lg shadow-blue-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
              <DollarSign className="h-24 w-24 text-white" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-100" />
                  <span className="text-xs md:text-sm font-medium text-blue-100/80">
                    Bugungi jami savdo
                  </span>
                </div>
                <div className="text-xl md:text-3xl font-bold text-white tracking-tight">
                  {formatCurrency(totalSales, "USD")}
                </div>
              </div>
              <div className="mt-2 text-[10px] md:text-xs text-blue-100/60 font-medium uppercase tracking-wider">
                {t('common.today')}
              </div>
            </div>
          </Card>

          {/* Branch Profits */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 border-0 shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
              <Building2 className="h-24 w-24 text-white" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-4 w-4 md:h-5 md:w-5 text-emerald-100" />
                  <span className="text-xs md:text-sm font-medium text-emerald-100/80">
                    Bugungi foyda (Filiallar)
                  </span>
                </div>
                <div className="text-xl md:text-3xl font-bold text-white tracking-tight">
                  {formatCurrency(totalSellerProfit * exchangeRate, "UZS")}
                </div>
              </div>
              <div className="mt-2 text-[10px] md:text-xs text-emerald-100/60 font-medium uppercase tracking-wider">
                {t('common.today')}
              </div>
            </div>
          </Card>
        </div>

        {/* Branch Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 px-1 tracking-wider">
            {t('admin.byBranch')}
          </h3>
          <div className="space-y-4">
            {branches.map((branch, index) => (
              <Card
                key={branch.id}
                onClick={() => navigate(`/admin/branch/${branch.id}?filter=${period}`)}
                className="p-4 border border-border bg-card cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="rounded-full p-3"
                      style={{
                        backgroundColor: branchColors[index % branchColors.length] + "20",
                      }}
                    >
                      <Building2
                        className="h-6 w-6"
                        style={{ color: branchColors[index % branchColors.length] }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-card-foreground">
                        {branch.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}