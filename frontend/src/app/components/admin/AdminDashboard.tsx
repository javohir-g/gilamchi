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
import { useApp } from "../../context/AppContext";
import { BottomNav } from "../shared/BottomNav";

export function AdminDashboard() {
  const [period, setPeriod] = useState<
    "today" | "week" | "month"
  >("today");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSalesDetailExpanded, setIsSalesDetailExpanded] =
    useState(false);
  const navigate = useNavigate();
  const { sales, branches, debts } = useApp();

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
      default:
        return sales;
    }
  };

  const filteredSales = getFilteredSales();

  // Calculate KPIs using filtered sales
  const totalSales = filteredSales.reduce(
    (sum, sale) => sum + sale.amount,
    0,
  );
  const totalProfit = filteredSales.reduce(
    (sum, sale) => sum + (sale.profit || 0),
    0,
  );
  const cashSales = filteredSales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const cardSales = filteredSales
    .filter((s) => s.paymentType === "card")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const transferSales = filteredSales
    .filter((s) => s.paymentType === "transfer")
    .reduce((sum, sale) => sum + sale.amount, 0);

  const expectedCash = cashSales;
  const receivedCash = cashSales * 0.95; // Mock: 95% received
  const difference = receivedCash - expectedCash;

  // Branch data based on filtered sales
  const branchData = branches.map((branch) => {
    const branchSales = filteredSales.filter(
      (s) => s.branchId === branch.id,
    );
    const periodTotal = branchSales.reduce(
      (sum, sale) => sum + sale.amount,
      0,
    );
    const cashTotal = branchSales
      .filter((s) => s.paymentType === "cash")
      .reduce((sum, sale) => sum + sale.amount, 0);
    const branchProfit = branchSales.reduce(
      (sum, sale) => sum + (sale.profit || 0),
      0,
    );

    return {
      ...branch,
      todaySales: periodTotal, // Re-using property name but it's period-based now
      cashAmount: cashTotal,
      profit: branchProfit,
    };
  });

  // Debt statistics
  const pendingDebts = debts.filter(
    (d) => d.status === "pending",
  );
  const overdueDebts = debts.filter((d) => {
    if (d.status === "paid") return false;
    return new Date(d.paymentDeadline) < new Date();
  });
  const totalDebtAmount = pendingDebts.reduce(
    (sum, d) => sum + d.remainingAmount,
    0,
  );

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ").format(amount) + " so'm"
    );
  };

  const branchColors = ["#3b82f6", "#22c55e", "#f59e0b"]; // blue, green, orange
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Filter Section */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setPeriod("today")}
              className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${period === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Bugun
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${period === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Hafta
            </button>
            <button
              onClick={() => setPeriod("month")}
              className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${period === "month"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Oy
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Sales */}
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 border-0 shadow-lg shadow-blue-500/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-white" />
                  <span className="text-sm font-medium text-blue-100">
                    Jami savdo
                  </span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(totalSales)}
                </div>
                <div className="text-sm text-blue-100 mt-1">
                  {filteredSales.length} ta savdodan
                </div>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Extra Profit */}
          {totalProfit > 0 && (
            <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-700 dark:to-emerald-800 border-0 shadow-lg shadow-emerald-500/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <HandCoins className="h-5 w-5 text-white" />
                    <span className="text-sm text-emerald-100">
                      Qo'shimcha foyda
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(totalProfit)}
                  </div>
                </div>
                <div className="bg-white/20 rounded-full p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Branch Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 px-1 tracking-wider">
            FILIALLAR BO'YICHA
          </h3>
          <div className="space-y-4">
            {branchData.map((branch, index) => (
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
                      <div className="text-sm text-muted-foreground">
                        Savdolar hisoboti
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-bold text-lg text-card-foreground">
                        {formatCurrency(branch.todaySales)}
                      </div>
                      {branch.profit > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs font-bold mt-1"
                          style={{
                            borderColor: "#22c55e",
                            color: "#22c55e",
                            backgroundColor: "#22c55e10",
                          }}
                        >
                          +{formatCurrency(branch.profit)}
                        </Badge>
                      )}
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
    </div>
  );
}