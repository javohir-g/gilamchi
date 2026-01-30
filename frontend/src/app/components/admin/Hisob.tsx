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
import { DatePickerWithRange } from "../ui/date-range-picker";
import { DateRange } from "react-day-picker";

type DateFilter = "today" | "week" | "month" | "custom";

export function Hisob() {
  const { sales, products, branches } = useApp();
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] =
    useState<DateFilter>("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

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


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Filter Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <button
              onClick={() => setDateFilter("today")}
              className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Bugun
            </button>
            <button
              onClick={() => setDateFilter("week")}
              className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Hafta
            </button>
            <button
              onClick={() => setDateFilter("month")}
              className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "month"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Oy
            </button>
            <button
              onClick={() => setDateFilter("custom")}
              className={`py-3 px-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${dateFilter === "custom"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-card-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              Boshqa
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


      <BottomNav />
    </div>
  );
}