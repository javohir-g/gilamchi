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

  // Calculate KPIs
  const totalSales = sales.reduce(
    (sum, sale) => sum + sale.amount,
    0,
  );
  const totalProfit = sales.reduce(
    (sum, sale) => sum + (sale.profit || 0),
    0,
  );
  const cashSales = sales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const cardSales = sales
    .filter((s) => s.paymentType === "card")
    .reduce((sum, sale) => sum + sale.amount, 0);
  const transferSales = sales
    .filter((s) => s.paymentType === "transfer")
    .reduce((sum, sale) => sum + sale.amount, 0);

  const expectedCash = cashSales;
  const receivedCash = cashSales * 0.95; // Mock: 95% received
  const difference = receivedCash - expectedCash;

  // Branch data
  const branchData = branches.map((branch) => {
    const branchSales = sales.filter(
      (s) => s.branchId === branch.id,
    );
    const todayTotal = branchSales.reduce(
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
      todaySales: todayTotal,
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
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-card-foreground">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Barcha filiallar
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Date Filter */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPeriod("today")}
            className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
              period === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
            }`}
          >
            Bugun
          </button>
          <button
            onClick={() => setPeriod("week")}
            className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
              period === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
            }`}
          >
            Hafta
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all ${
              period === "month"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
            }`}
          >
            Oy
          </button>
        </div>

        {/* Total Sales Card */}
        <Card
          className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 border-0 cursor-pointer active:scale-[0.98] transition-transform"
          onClick={() =>
            setIsSalesDetailExpanded(!isSalesDetailExpanded)
          }
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-white" />
                <span className="text-sm text-blue-100">
                  Jami savdo
                </span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(totalSales)}
              </div>
              <div className="text-sm text-blue-100 mt-1">
                {sales.length} ta savdodan
              </div>
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="bg-white/20 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              {isSalesDetailExpanded ? (
                <ChevronUp className="h-5 w-5 text-white" />
              ) : (
                <ChevronDown className="h-5 w-5 text-white" />
              )}
            </div>
          </div>
        </Card>

        {/* Payment Breakdown */}
        <AnimatePresence>
          {isSalesDetailExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-4 border border-border bg-card">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-muted-foreground">
                      Naqd
                    </span>
                  </div>
                  <div className="text-xl font-semibold text-card-foreground">
                    {formatCurrency(cashSales)}
                  </div>
                </Card>

                <Card className="p-4 border border-border bg-card">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-muted-foreground">
                      Karta//O'tkazma
                    </span>
                  </div>
                  <div className="text-xl font-semibold text-card-foreground">
                    {formatCurrency(cardSales + transferSales)}
                  </div>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extra Profit */}
        {totalProfit > 0 && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 gap-1">
            <div className="flex items-center space-x-2 mb-2">
              <HandCoins className="h-5 w-5 text-green-700 dark:text-green-300" />
              <span className="text-sm text-green-700 dark:text-green-300">
                Qo'shimcha foyda
              </span>
            </div>
            <div className="text-3xl text-green-600 dark:text-green-400">
              {formatCurrency(totalProfit)}
            </div>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300">
              Standart narxdan yuqori sotuvlar
            </div>
          </Card>
        )}

        {/* Branch Breakdown */}
        <div>
          <h3 className="text-sm text-muted-foreground mb-3 px-1">
            FILIALLAR BO'YICHA
          </h3>
          <div className="space-y-3">
            {branchData.map((branch, index) => (
              <Card
                key={branch.id}
                className="p-4 border border-border bg-card cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                onClick={() =>
                  navigate(`/admin/branch/${branch.id}`)
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="rounded-full p-3"
                      style={{
                        backgroundColor:
                          branchColors[index] + "20",
                      }}
                    >
                      <Building2
                        className="h-5 w-5"
                        style={{ color: branchColors[index] }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-card-foreground">
                        {branch.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Bugungi savdo
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="font-semibold text-card-foreground">
                        {formatCurrency(branch.todaySales)}
                      </div>
                      {branch.profit > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                          +{formatCurrency(branch.profit)}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
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