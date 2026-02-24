import React, { useState } from "react";
import {
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
import { useApp, Sale } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { BottomNav } from "../shared/BottomNav";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { useNavigate } from "react-router-dom";

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

  // Aggregated Kassa calculations across all branches
  const aggCashSales = periodSales
    .filter(s => s.paymentType === 'cash')
    .reduce((sum, s) => sum + s.amount, 0);

  const aggCardTransferSales = periodSales
    .filter(s => s.paymentType === 'card' || s.paymentType === 'transfer')
    .reduce((sum, s) => sum + s.amount, 0);

  // Filter debt payments across all branches
  const { debts } = useApp();
  const aggDebtPayments = debts.reduce((total, debt) => {
    const payments = (debt.paymentHistory || []).filter(p => {
      const dDate = new Date(p.date);
      return dDate.getTime() >= start.getTime() && dDate.getTime() <= end.getTime();
    });
    return total + payments.reduce((sum, p) => sum + p.amount, 0);
  }, 0);

  const { periodSales, start, end } = { ...getFilteredData() };

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

        {/* Aggregate Kassa Card */}
        <Card className="p-5 bg-gradient-to-br from-indigo-700 to-indigo-800 dark:from-indigo-900 dark:to-slate-900 border-0 shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-24 w-24 text-white" />
          </div>

          <div className="relative z-10 mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-indigo-100/60 uppercase tracking-widest">Umumiy Kassa (Barcha filiallar)</span>
            </div>
            <div className="text-2xl font-black text-white leading-none tracking-tight">
              {formatCurrency((aggCashSales + aggDebtPayments + aggCardTransferSales) * exchangeRate, "UZS")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-white/10">
            <div>
              <div className="text-[9px] text-indigo-100/60 font-bold uppercase mb-1">{t('common.cash')}</div>
              <div className="text-sm font-bold text-white leading-none">
                {formatCurrency((aggCashSales + aggDebtPayments) * exchangeRate, "UZS")}
              </div>
              <div className="text-[8px] text-indigo-100/40 italic mt-1.5 leading-none">Sotuv + Qarz to'lovlari</div>
            </div>

            <div>
              <div className="text-[9px] text-indigo-100/60 font-bold uppercase mb-1">{t('seller.cardAndTransfer')}</div>
              <div className="text-sm font-bold text-blue-100 leading-none">
                {formatCurrency(aggCardTransferSales * exchangeRate, "UZS")}
              </div>
            </div>
          </div>
        </Card>

        {/* Branch Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 px-1 tracking-wider">
            {t('admin.byBranch')}
          </h3>
          <div className="space-y-4">
            {branches.map((branch, index) => {
              const branchSales = periodSales.filter(s => String(s.branchId) === String(branch.id));

              // Branch Kassa calculations
              const bCash = branchSales
                .filter(s => s.paymentType === 'cash')
                .reduce((sum, s) => sum + s.amount, 0);

              const bCard = branchSales
                .filter(s => s.paymentType === 'card' || s.paymentType === 'transfer')
                .reduce((sum, s) => sum + s.amount, 0);

              const bDebtPayments = debts
                .filter(d => String(d.branchId) === String(branch.id))
                .reduce((total, debt) => {
                  const payments = (debt.paymentHistory || []).filter(p => {
                    const dDate = new Date(p.date);
                    return dDate.getTime() >= start.getTime() && dDate.getTime() <= end.getTime();
                  });
                  return total + payments.reduce((sum, p) => sum + p.amount, 0);
                }, 0);

              const branchTotalKassa = (bCash + bCard + bDebtPayments) * exchangeRate;

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
                        <div className="font-bold text-lg text-card-foreground leading-tight">
                          {branch.name}
                        </div>
                        <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                          Kassa: {formatCurrency(branchTotalKassa, "UZS")}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
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