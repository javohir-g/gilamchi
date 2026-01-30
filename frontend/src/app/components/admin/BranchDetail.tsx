import { ArrowLeft, DollarSign, Package } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useApp } from "../../context/AppContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StaffProfitDistribution } from "../shared/StaffProfitDistribution";

export function BranchDetail() {
  const { branchId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { branches, sales, products, expenses, debts, staffMembers } = useApp();

  const branch = branches.find((b) => b.id === branchId);

  if (!branch) {
    return <div>Filial topilmadi</div>;
  }

  // Get date filter from URL params
  const dateFilter = (searchParams.get("filter") || "today") as "today" | "week" | "month";

  // Filter sales, expenses, and debts by period and branch
  const getFilteredData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let startDate = today;
    if (dateFilter === "week") {
      const day = today.getDay(); // 0 (Sun) to 6 (Sat)
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(today);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateFilter === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const branchSales = sales.filter(
      (s) => s.branchId === branchId && new Date(s.date) >= startDate
    );
    const branchExpenses = expenses.filter(
      (e) => e.branchId === branchId && new Date(e.date) >= startDate
    );
    const branchDebts = debts.filter(
      (d) => d.branchId === branchId
    );

    return { branchSales, branchExpenses, branchDebts, startDate };
  };

  const { branchSales, branchExpenses, branchDebts, startDate } = getFilteredData();

  // Sales breakdown by payment type
  const cashSales = branchSales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, s) => sum + s.amount, 0);
  const cardTransferSales = branchSales
    .filter((s) => s.paymentType === "card" || s.paymentType === "transfer")
    .reduce((sum, s) => sum + s.amount, 0);

  const paymentData = [
    { name: "Naqd", value: cashSales, color: "#22c55e" },
    { name: "Karta/O'tkazma", value: cardTransferSales, color: "#3b82f6" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalSales = branchSales.reduce(
    (sum, s) => sum + s.amount,
    0,
  );

  const totalExpenses = branchExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );

  const totalAdminProfit = branchSales.reduce(
    (sum, s) => sum + (s.admin_profit || 0),
    0,
  );

  const totalSellerProfit = branchSales.reduce(
    (sum, s) => sum + (s.seller_profit || 0),
    0,
  );

  const totalBranchExpenses = branchExpenses
    .filter(e => !e.category || e.category === "branch")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalStaffExpenses = branchExpenses
    .filter(e => e.category === "staff")
    .reduce((sum, e) => sum + e.amount, 0);

  // Combine sales and expenses for unified history
  const unifiedHistory = [
    ...branchSales.map(s => ({ ...s, entryType: "sale" as const })),
    ...branchExpenses.map(e => ({ ...e, entryType: "expense" as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // New debts created in the period
  const totalNewDebt = branchDebts
    .filter((debt) => new Date(debt.date) >= startDate)
    .reduce((sum, debt) => sum + debt.totalAmount, 0);

  // Debt payments received in the period
  const totalDebtPaymentsInPeriod = branchDebts.reduce((sum, debt) => {
    const periodPayments = debt.paymentHistory.filter((payment) => {
      return new Date(payment.date) >= startDate;
    });
    return (
      sum +
      periodPayments.reduce((pSum, p) => pSum + p.amount, 0)
    );
  }, 0);

  const getLabel = (base: string) => {
    switch (dateFilter) {
      case "week": return "Haftalik " + base.toLowerCase();
      case "month": return "Oylik " + base.toLowerCase();
      default: return "Bugungi " + base.toLowerCase();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl dark:text-white">
              {branch.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">


        {/* Stats Grid 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 shadow-lg shadow-indigo-500/20">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-indigo-100 font-bold">
              Mening foydam
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(totalAdminProfit)}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg shadow-emerald-500/20">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-emerald-100 font-bold">
              Filial foydasi
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(totalSellerProfit)}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-lg shadow-orange-500/20">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-orange-100 font-bold">
              Filial xarajatlari
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(totalBranchExpenses)}
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 border-0 shadow-lg shadow-rose-500/20">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-rose-100 font-bold">
              Sotuvchilar xarajati
            </div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(totalStaffExpenses)}
            </div>
          </Card>
        </div>

        <StaffProfitDistribution
          staffMembers={staffMembers}
          branchId={branchId || ""}
          totalSellerProfit={totalSellerProfit}
          totalBranchExpenses={totalBranchExpenses}
          branchExpenses={branchExpenses}
        />

        {/* Unified History List */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg font-bold dark:text-white tracking-tight">
            AMAL HARAKATLAR TARIXI
          </h3>
          {unifiedHistory.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              Hali harakatlar yo'q
            </p>
          ) : (
            <div className="space-y-4">
              {unifiedHistory.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start justify-between rounded-xl border p-4 transition-all hover:shadow-sm ${item.entryType === "sale"
                    ? "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700"
                    : "bg-orange-50/30 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50"
                    }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${item.entryType === "sale"
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
                        }`}>
                        {item.entryType === "sale" ? <Package className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-bold dark:text-white">
                          {item.entryType === "sale" ? (item as any).productName : (item as any).description}
                        </div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                          {new Date(item.date).toLocaleDateString("uz-UZ")} • {new Date(item.date).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    {item.entryType === "sale" && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {(item as any).type === "unit"
                            ? `${(item as any).quantity} dona`
                            : `${((item as any).area || (item as any).quantity).toFixed(1)} m²`}
                          {" "} • {" "}
                          <span className="font-medium uppercase">{(item as any).paymentType}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-[10px]">
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            MEN: {formatCurrency((item as any).admin_profit || 0)}
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            FILIAL: {formatCurrency((item as any).seller_profit || 0)}
                          </span>
                        </div>
                      </div>
                    )}

                    {item.entryType === "expense" && (
                      <div className="mt-1 flex gap-1">
                        <Badge variant="outline" className="text-[9px] uppercase border-orange-200 text-orange-600 bg-orange-50/50">
                          {(item as any).category === "staff" ? "Sotuvchi xarajati" : "Filial xarajati"}
                        </Badge>
                        {(item as any).category === "staff" && (item as any).staffId && (
                          <Badge variant="outline" className="text-[9px] uppercase border-blue-200 text-blue-600 bg-blue-50/50">
                            {staffMembers.find(s => s.id === (item as any).staffId)?.name || "Noma'lum"}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-black ${item.entryType === "sale" ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
                      }`}>
                      {item.entryType === "sale" ? "+" : "-"}{formatCurrency(item.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div >
    </div >
  );
}