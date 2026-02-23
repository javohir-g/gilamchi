import { BottomNav } from "../shared/BottomNav";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  TrendingUp,
  Building2,
  DollarSign,
  Calendar,
  X,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";

type DateFilter = "today" | "week" | "month" | "custom";

export function Hisob() {
  const { sales, products, branches, fetchData, debts } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Periodic refresh for live updates
  useEffect(() => {
    fetchData(); // Fetch on mount
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  // Filter sales by date
  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    switch (dateFilter) {
      case "today":
        return sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= today;
        });

      case "week":
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
        const monthStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          1,
        );
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

  // Conservative Profit Calculation Logic (Cost-First Recognition)
  // Logic: Profit is only recognized AFTER the total purchase cost of the items in an order is covered by payments.

  // 1. Group all data by Order
  const getConservativeProfit = (targetSales = sales, targetDebts = debts) => {
    // We need ALL sales and ALL debts to calculate cumulative flow, even if filtering for a small period
    const orderData = new Map<string, {
      totalCost: number;
      potentialProfit: number;
      payments: { amount: number; date: Date }[];
    }>();

    // Group Sales by Order to find Cost and Potential Profit
    targetSales.forEach(sale => {
      const orderId = sale.orderId || sale.id;
      if (!orderData.has(orderId)) {
        orderData.set(orderId, { totalCost: 0, potentialProfit: 0, payments: [] });
      }
      const data = orderData.get(orderId)!;

      const product = products.find(p => p.id === sale.productId);
      if (product) {
        let cost = 0;
        if (sale.type === "meter" || product.type === "meter") {
          cost = (product.buyPrice || 0) * (sale.length || sale.quantity || 0);
        } else {
          cost = (product.buyPrice || 0) * (sale.quantity || 1);
        }
        data.totalCost += cost;
        data.potentialProfit += sale.adminProfit || 0;
      }

      // If it's NOT a Nasiya sale, the payment happens immediately
      if (!sale.isNasiya) {
        data.payments.push({ amount: sale.amount, date: new Date(sale.date) });
      }
    });

    // Add Debt Initial Payments and Payment History
    targetDebts.forEach(debt => {
      const orderId = debt.orderId;
      if (!orderId || !orderData.has(orderId)) return;
      const data = orderData.get(orderId)!;

      // Initial Payment
      if (debt.initialPayment > 0) {
        data.payments.push({ amount: debt.initialPayment, date: new Date(debt.date) });
      }

      // Subsequent Payments
      debt.paymentHistory?.forEach(p => {
        data.payments.push({ amount: p.amount, date: new Date(p.date) });
      });
    });

    // Calculate profit recognized within the filtered range
    let totalRecognizedProfit = 0;

    // Filter boundaries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let filterStart = new Date(0); // Default to beginning of time
    let filterEnd = new Date(today.getTime() + 86400000); // Default to end of today

    if (dateFilter === "week") {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      filterStart = new Date(today);
      filterStart.setDate(diff);
      filterStart.setHours(0, 0, 0, 0);
    } else if (dateFilter === "month") {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateFilter === "custom" && dateRange?.from) {
      filterStart = new Date(dateRange.from);
      filterStart.setHours(0, 0, 0, 0);
      filterEnd = dateRange.to ? new Date(dateRange.to) : new Date(filterStart);
      filterEnd.setHours(23, 59, 59, 999);
    } else if (dateFilter === "today") {
      filterStart = today;
    }

    orderData.forEach(data => {
      // Sort payments by date to calculate cumulative flow
      const sortedPayments = [...data.payments].sort((a, b) => a.date.getTime() - b.date.getTime());

      let cumulativePaidPrior = 0;
      let cumulativePaidAfter = 0;

      sortedPayments.forEach(p => {
        if (p.date < filterStart) {
          cumulativePaidPrior += p.amount;
        }
        if (p.date <= filterEnd) {
          cumulativePaidAfter += p.amount;
        }
      });

      // Recognized Profit = max(0, totalPaid - totalCost), capped at potentialProfit
      const recognizedPrior = Math.min(data.potentialProfit, Math.max(0, cumulativePaidPrior - data.totalCost));
      const recognizedAfter = Math.min(data.potentialProfit, Math.max(0, cumulativePaidAfter - data.totalCost));

      totalRecognizedProfit += (recognizedAfter - recognizedPrior);
    });

    return totalRecognizedProfit;
  };

  const totalDirectorProfit = getConservativeProfit();

  // 1. Total Stock Value (Buy Price) - Current value in warehouse
  const totalStockValue = products.reduce((sum, p) => {
    if (p.type === "meter") {
      return sum + (p.buyPrice || 0) * (p.remainingLength || 0);
    } else {
      const qty = p.availableSizes
        ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
        : (p.quantity || 0);
      return sum + (p.buyPrice || 0) * qty;
    }
  }, 0);

  // 2. Total Potential Profit (Markup if all sold)
  const totalPotentialProfit = products.reduce((sum, p) => {
    if (p.type === "meter") {
      const margin = (p.sellPricePerMeter || 0) - (p.buyPrice || 0);
      return sum + margin * (p.remainingLength || 0);
    } else {
      const margin = (p.sellPrice || 0) - (p.buyPrice || 0);
      const qty = p.availableSizes
        ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
        : (p.quantity || 0);
      return sum + margin * qty;
    }
  }, 0);

  // 3. Sold Stock Cost (Buy Price of items sold in period)
  const soldStockCost = filteredSales.reduce((sum, sale) => {
    const product = products.find(p => p.id === sale.productId);
    if (!product) return sum;
    let cost = 0;
    if (sale.type === "meter" || product.type === "meter") {
      cost = (product.buyPrice || 0) * (sale.length || sale.quantity || 0);
    } else {
      cost = (product.buyPrice || 0) * (sale.quantity || 1);
    }
    return sum + cost;
  }, 0);

  // Profit breakdown by branch (using the same conservative logic)
  const branchProfits = branches.map((branch) => {
    const branchSales = sales.filter(s => s.branchId === branch.id);
    const branchDebts = debts.filter(d => d.branchId === branch.id);

    // We pass filtered sets to calculate branch-specific recognized profit
    const profit = getConservativeProfit(branchSales, branchDebts);

    // For specific UI cards, we still count sales in period
    const salesInPeriod = filteredSales.filter(s => s.branchId === branch.id);

    // Calculate branch stock
    const branchStockValue = products
      .filter((p) => p.branchId === branch.id)
      .reduce((sum, p) => {
        if (p.type === "meter") {
          return sum + (p.buyPrice || 0) * (p.remainingLength || 0);
        } else {
          const qty = p.availableSizes
            ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
            : (p.quantity || 0);
          return sum + (p.buyPrice || 0) * qty;
        }
      }, 0);

    return {
      branchId: branch.id,
      branchName: branch.name,
      profit,
      adminProfit: profit, // In conservative mode, "Mening foydam" IS the recognized profit
      sellerProfit: salesInPeriod.reduce((sum, s) => sum + (s.sellerProfit || 0), 0),
      salesCount: salesInPeriod.length,
      stockValue: branchStockValue,
    };
  });

  // Data for pie chart
  const pieData = branchProfits.map((bp, index) => ({
    name: bp.branchName,
    value: Math.max(0, bp.profit),
    color: ["#3b82f6", "#22c55e", "#f59e0b"][index % 3], // blue, green, orange
  }));

  const formatCurrency = (amount: number, currency: "USD" | "UZS" = "USD") => {
    if (currency === "UZS") {
      return new Intl.NumberFormat("uz-UZ", {
        style: "currency",
        currency: "UZS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount));
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Filter Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 w-full overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setDateFilter("today")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.today')}
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.week')}
            </button>
            <button
              onClick={() => setDateFilter("month")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "month"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.month')}
            </button>
            <button
              onClick={() => setDateFilter("custom")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "custom"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.other')}
            </button>
          </div>

          {dateFilter === "custom" && (
            <div className="mt-4 flex justify-center animate-in slide-in-from-top-2 fade-in">
              <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full sm:w-auto" />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

        {/* Financial Summary Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Stock Value */}
          <Card
            className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 shadow-lg shadow-indigo-500/20 text-white cursor-pointer hover:shadow-indigo-500/40 transition-shadow"
            onClick={() => navigate("/admin/warehouse-report")}
          >
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
                {t('admin.stockValue')}
              </span>
              <div className="text-xl md:text-2xl font-bold truncate">
                {formatCurrency(totalStockValue)}
              </div>
            </div>
          </Card>

          {/* Card 3: Sold Stock Cost (Linked to Card 1) */}
          <Card className="p-4 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 shadow-sm">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {t('admin.soldStockCost')}
              </span>
              <div className="text-xl md:text-2xl font-bold dark:text-white truncate">
                {formatCurrency(soldStockCost)}
              </div>
            </div>
          </Card>

          {/* Card 2: Potential Profit */}
          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg shadow-emerald-500/20 text-white">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
                {t('admin.potentialProfit')}
              </span>
              <div className="text-xl md:text-2xl font-bold truncate">
                {formatCurrency(totalPotentialProfit)}
              </div>
            </div>
          </Card>

          {/* Card 4: Actual Profit (Linked to Card 2) */}
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 shadow-sm">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {t('admin.actualProfit')}
              </span>
              <div className="text-xl md:text-2xl font-bold dark:text-white truncate">
                {formatCurrency(totalDirectorProfit)}
              </div>
            </div>
          </Card>
        </div>

        {/* Branch Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 px-1 tracking-wider uppercase">
            {t('admin.byBranch')}
          </h3>
          <div className="space-y-4">
            {branchProfits.map((bp, index) => (
              <Card
                key={bp.branchId}
                className="p-4 border border-border bg-card cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() => {
                  const params = new URLSearchParams({
                    filter: dateFilter,
                  });
                  if (
                    dateFilter === "custom" &&
                    dateRange?.from
                  ) {
                    params.append("start", dateRange.from.toISOString());
                    if (dateRange.to) {
                      params.append("end", dateRange.to.toISOString());
                    }
                  }
                  navigate(
                    `/admin/branch-profit/${bp.branchId}?${params.toString()}`,
                  );
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="rounded-full p-3"
                      style={{
                        backgroundColor:
                          pieData[index].color + "20",
                      }}
                    >
                      <Building2
                        className="h-6 w-6"
                        style={{ color: pieData[index].color }}
                      />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-card-foreground">
                        {bp.branchName}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 border-blue-100">
                          {t('common.me')}: {formatCurrency(bp.adminProfit)}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100">
                          {t('common.branch')}: {formatCurrency(bp.sellerProfit)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="font-bold text-lg text-card-foreground">
                      {formatCurrency(bp.profit)}
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

      </div>


      <BottomNav />
    </div >
  );
}