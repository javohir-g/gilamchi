import React, { useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Building2,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
const startOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};
import { Card } from "../ui/card";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { BottomNav } from "../shared/BottomNav";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";

export function AdminDashboard() {
  const [period, setPeriod] = useState<
    "today" | "week" | "month" | "custom"
  >("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const navigate = useNavigate();
  const { sales, branches, exchangeRate, expenses } = useApp();
  const { t } = useLanguage();

  // Helper to filter data by period
  const getFilteredData = () => {
    const now = new Date();
    const today = startOfDay(now);
    let start: Date;
    let end: Date = new Date();

    switch (period) {
      case "today":
        start = today;
        break;
      case "week":
        // Start from Monday
        const weekStart = new Date(today);
        const day = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        start = weekStart;
        break;
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "custom":
        if (!dateRange?.from) {
          start = today;
        } else {
          start = startOfDay(dateRange.from);
          if (dateRange.to) {
            end = new Date(dateRange.to);
            end.setHours(23, 59, 59, 999);
          } else {
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
          }
        }
        break;
      default:
        start = today;
    }

    const periodSales = sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate.getTime() >= start.getTime() && saleDate.getTime() <= end.getTime();
    });

    const periodExpenses = expenses.filter((e) => {
      const expDate = new Date(e.date);
      return expDate.getTime() >= start.getTime() && expDate.getTime() <= end.getTime();
    });

    return { periodSales, periodExpenses, start, end };
  };

  const { periodSales, periodExpenses, start, end } = getFilteredData();

  // Calculate KPIs using filtered data
  const totalSales = periodSales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalAdminProfit = periodSales.reduce((sum, sale) => sum + (sale.adminProfit || 0), 0);
  const totalExpenses = periodExpenses.reduce((sum, e) => {
    return sum + (e.isUsd ? e.amount : e.amount / exchangeRate);
  }, 0);
  const netProfit = totalAdminProfit - totalExpenses;

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
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-100" />
                  <span className="text-xs font-medium text-blue-100/80">
                    Sotish (Jami)
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(totalSales, "USD")}
                </div>
              </div>
              <div className="mt-2 text-[10px] text-blue-100/60 font-medium uppercase tracking-wider">
                {period === "today" ? t('common.today') : period === "week" ? t('common.week') : period === "month" ? t('common.month') : t('common.other')}
              </div>
            </div>
          </Card>

          {/* Net Profit */}
          <Card className="p-4 md:p-6 bg-gradient-to-br from-emerald-600 to-emerald-700 dark:from-emerald-800 dark:to-emerald-900 border-0 shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
              <Building2 className="h-24 w-24 text-white" />
            </div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="h-4 w-4 text-emerald-100" />
                  <span className="text-xs font-medium text-emerald-100/80">
                    Sof Foyda
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {formatCurrency(netProfit, "USD")}
                </div>
              </div>
              <div className="mt-2 text-[10px] text-emerald-100/60 font-medium uppercase tracking-wider">
                {period === "today" ? t('common.today') : period === "week" ? t('common.week') : period === "month" ? t('common.month') : t('common.other')}
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
            {branches.map((branch, index) => {
              const branchSales = periodSales.filter(s => String(s.branchId) === String(branch.id));
              const branchAdminProfit = branchSales.reduce((sum, s) => sum + (s.adminProfit || 0), 0);
              const branchSellerProfit = branchSales.reduce((sum, s) => sum + (s.sellerProfit || 0), 0);
              const totalBranchProfit = branchAdminProfit; // Admin dashboard focuses on admin profit as "Total"

              return (
                <Card
                  key={branch.id}
                  onClick={() => navigate(`/admin/branch/${branch.id}?filter=${period}&from=${start.toISOString()}&to=${end.toISOString()}`)}
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
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
                            {t('common.me') || 'Men'}: {formatCurrency(branchAdminProfit)}
                          </div>
                          <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900">
                            {t('common.branch') || 'Filial'}: {formatCurrency(branchSellerProfit)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-lg font-black text-card-foreground">
                          {formatCurrency(branchAdminProfit)}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}