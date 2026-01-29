import { BottomNav } from "../shared/BottomNav";
import { useApp } from "../../context/AppContext";
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
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

type DateFilter = "today" | "week" | "month" | "custom";

export function Hisob() {
  const { sales, products, branches } = useApp();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("today");
  const [showCustomDateModal, setShowCustomDateModal] =
    useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

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
        if (!customStartDate || !customEndDate) return sales;
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999); // End of day
        return sales.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= start && saleDate <= end;
        });

      default:
        return sales;
    }
  };

  const filteredSales = getFilteredSales();

  // Calculate director's profit for each sale
  // Director's profit = Total Sale Amount - Total Cost
  const calculateDirectorProfit = (sale: (typeof sales)[0]) => {
    const product = products.find(
      (p) => p.id === sale.productId,
    );
    if (!product) return sale.profit || 0; // Fallback to extra profit if product not found

    let cost = 0;
    if (sale.type === "meter" || product.type === "meter") {
      // For meter products, linear length is the basis for cost (buyPrice is per meter)
      const length = sale.length || sale.quantity || 0;
      cost = (product.buyPrice || 0) * length;
    } else {
      // For unit products (unit quantity)
      cost = (product.buyPrice || 0) * (sale.quantity || 1);
    }

    // Profit = (What customer paid) - (What we paid for it)
    return sale.amount - cost;
  };

  // Total director's profit from all sales
  const totalDirectorProfit = filteredSales.reduce(
    (sum, sale) => sum + calculateDirectorProfit(sale),
    0,
  );

  // Profit breakdown by branch
  const branchProfits = branches.map((branch) => {
    const branchSales = filteredSales.filter(
      (s) => s.branchId === branch.id,
    );
    const profit = branchSales.reduce(
      (sum, sale) => sum + calculateDirectorProfit(sale),
      0,
    );
    const adminProfit = branchSales.reduce(
      (sum, sale) => sum + (sale.admin_profit || 0),
      0,
    );
    const sellerProfit = branchSales.reduce(
      (sum, sale) => sum + (sale.seller_profit || 0),
      0,
    );
    return {
      branchId: branch.id,
      branchName: branch.name,
      profit,
      adminProfit,
      sellerProfit,
      salesCount: branchSales.length,
    };
  });

  // Data for pie chart
  const pieData = branchProfits.map((bp, index) => ({
    name: bp.branchName,
    value: bp.profit,
    color: ["#3b82f6", "#22c55e", "#f59e0b"][index % 3], // blue, green, orange
  }));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const applyCustomDate = () => {
    if (customStartDate && customEndDate) {
      setDateFilter("custom");
      setShowCustomDateModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Filter Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setDateFilter("today")}
              className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${dateFilter === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Bugun
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${dateFilter === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Hafta
            </button>
            <button
              onClick={() => setDateFilter("month")}
              className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${dateFilter === "month"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Oy
            </button>
            <button
              onClick={() => setShowCustomDateModal(true)}
              className={`py-3 px-2 rounded-xl text-sm font-semibold transition-all ${dateFilter === "custom"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Boshqa
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {dateFilter === "custom" &&
          customStartDate &&
          customEndDate && (
            <Card className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-blue-900 dark:text-blue-100">
                    {new Date(
                      customStartDate,
                    ).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "short",
                    })}
                    {" - "}
                    {new Date(
                      customEndDate,
                    ).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <button
                  onClick={() => setShowCustomDateModal(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  O'zgartirish
                </button>
              </div>
            </Card>
          )}

        {/* Total Profit Card */}
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 border-0 shadow-lg shadow-blue-500/20">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-white" />
                <span className="text-sm font-medium text-blue-100">
                  Jami sof foyda
                </span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(totalDirectorProfit)}
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

        {/* Branch Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 px-1 tracking-wider">
            FILIALLAR BO'YICHA
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
                    customStartDate &&
                    customEndDate
                  ) {
                    params.append("start", customStartDate);
                    params.append("end", customEndDate);
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
                          Men: {formatCurrency(bp.adminProfit)}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100">
                          Filial: {formatCurrency(bp.sellerProfit)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="font-bold text-lg text-card-foreground">
                        {formatCurrency(bp.profit)}
                      </div>
                      <Badge
                        variant="outline"
                        className="text-xs font-bold mt-1"
                        style={{
                          borderColor: pieData[index].color,
                          color: pieData[index].color,
                          backgroundColor: pieData[index].color + "10",
                        }}
                      >
                        {totalDirectorProfit > 0
                          ? (
                            (bp.profit /
                              totalDirectorProfit) *
                            100
                          ).toFixed(1)
                          : 0}
                        %
                      </Badge>
                    </div>
                    <ChevronRight className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Pie Chart */}
        {totalDirectorProfit > 0 && (
          <Card className="p-6 border border-border bg-card rounded-2xl">
            <h3 className="mb-4 text-sm font-bold text-muted-foreground tracking-wider">
              FOYDA TAQSIMOTI
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) =>
                    formatCurrency(value)
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Custom Date Modal */}
      {showCustomDateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm bg-card border border-border rounded-3xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-card-foreground">
                  Sana tanlang
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCustomDateModal(false)}
                  className="rounded-full"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center space-x-2 mb-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Boshlanish sanasi</span>
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) =>
                      setCustomStartDate(e.target.value)
                    }
                    className="w-full p-3 border border-border rounded-xl bg-background text-card-foreground outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 mb-2 text-sm font-medium text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Tugash sanasi</span>
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) =>
                      setCustomEndDate(e.target.value)
                    }
                    className="w-full p-3 border border-border rounded-xl bg-background text-card-foreground outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setShowCustomDateModal(false)}
                  className="flex-1 rounded-xl py-6"
                >
                  Bekor qilish
                </Button>
                <Button
                  variant="default"
                  onClick={applyCustomDate}
                  className="flex-1 rounded-xl py-6 bg-blue-600 text-white hover:bg-blue-700"
                  disabled={!customStartDate || !customEndDate}
                >
                  Qo'llash
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
}