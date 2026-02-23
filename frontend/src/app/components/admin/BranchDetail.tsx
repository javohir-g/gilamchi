import { ArrowLeft, DollarSign, Package, ChevronDown, ChevronUp, User, Clock, CreditCard, Wallet, ReceiptText, Layers, Filter, Download, Tag, Info } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useApp, Sale, Expense, DebtPayment, StaffMember, Product } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { useState } from "react";
import { cn } from "../ui/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { StaffProfitDistribution } from "../shared/StaffProfitDistribution";
import { StatsDrillDownDialog } from "../shared/StatsDrillDownDialog";

export function BranchDetail() {
  const { branchId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { branches, sales, products, expenses, debts, staffMembers, exchangeRate } = useApp();
  const { t } = useLanguage();

  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [nasiyaOnlyFilter, setNasiyaOnlyFilter] = useState<boolean>(false);

  const branch = branches.find((b) => b.id === branchId);

  if (!branch) {
    return <div>{t('messages.branchNotFound')}</div>;
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

  const totalSales = branchSales.reduce(
    (sum, s) => sum + s.amount,
    0,
  );

  const totalExpenses = branchExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );

  const totalAdminProfit = branchSales.reduce(
    (sum, s) => sum + (s.adminProfit || 0),
    0,
  );

  const totalSellerProfit = branchSales.reduce(
    (sum, s) => sum + (s.sellerProfit || 0),
    0,
  );

  const totalBranchExpenses = branchExpenses
    .filter(e => !e.category || e.category === "branch")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalStaffExpenses = branchExpenses
    .filter(e => e.category === "staff")
    .reduce((sum, e) => sum + e.amount, 0);

  // Group sales by order_id or (date + sellerId) for grouping multiple carpets sold to same client
  const groupedSales = branchSales.reduce((acc: any[], sale) => {
    const s = sale as any;
    // Round date to the nearest minute for fallback grouping if order_id is missing
    const dateKey = new Date(sale.date).toISOString().slice(0, 16);
    const groupId = s.orderId || `${dateKey}_${s.sellerId || s.staffId}`;

    const existingGroup = acc.find(g => g.groupId === groupId);

    if (existingGroup) {
      existingGroup.items.push(sale);
      existingGroup.amount += sale.amount;
      existingGroup.adminProfit += (s.adminProfit || s.admin_profit || 0);
      existingGroup.sellerProfit += (s.sellerProfit || s.seller_profit || 0);

      // Update display name for multiple items
      if (existingGroup.items.length === 2) {
        existingGroup.productName = `${existingGroup.items[0].productName}, ${sale.productName}`;
      } else if (existingGroup.items.length > 2) {
        existingGroup.productName = `${existingGroup.items.length} ta mahsulot`;
      }
    } else {
      const s = sale as any;
      acc.push({
        ...sale,
        groupId,
        items: [sale],
        adminProfit: (s.adminProfit || s.admin_profit || 0),
        sellerProfit: (s.sellerProfit || s.seller_profit || 0),
        entryType: "sale" as const
      });
    }
    return acc;
  }, []);

  // Combine sales, expenses, and debt payments for unified history
  const allDebtPayments = branchDebts.flatMap(debt =>
    (debt.paymentHistory || []).map(p => ({
      ...p,
      entryType: "payment" as const,
      debtorName: debt.debtorName,
      debtId: debt.id
    }))
  );

  const unifiedHistory = [
    ...groupedSales,
    ...branchExpenses.map(e => ({ ...e, entryType: "expense" as const })),
    ...allDebtPayments
  ]
    .filter(item => {
      if (sellerFilter !== "all") {
        const itemSellerId = (item as any).sellerId || (item as any).staffId;
        if (itemSellerId !== sellerFilter) return false;
      }
      if (nasiyaOnlyFilter) {
        if (item.entryType !== "sale" || !(item as any).isNasiya) return false;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const exportToCSV = () => {
    const headers = ["Sana", "Tur", "Tavsif/Mahsulot", "Summa (UZS)", "Sotuvchi", "To'lov turi"];
    const rows = unifiedHistory.map(item => {
      const isSale = item.entryType === "sale";
      const isPayment = item.entryType === "payment";
      const isExpense = item.entryType === "expense";

      let typeLabel = isSale ? "Sotuv" : isPayment ? "To'lov" : "Xarajat";
      let desc = "";
      if (isSale) desc = `${(item as any).productName} (${(item as any).quantity})`;
      else if (isPayment) desc = `${(item as any).debtorName} (Qarz)`;
      else desc = (item as any).description;

      const amount = item.amount * (isPayment ? 1 : (isSale ? (item.exchangeRate || exchangeRate) : 1));
      const seller = staffMembers.find(s => s.id === ((item as any).sellerId || (item as any).staffId))?.name || "";
      const paymentType = isSale ? (item as any).paymentType : "";

      return [
        new Date(item.date).toLocaleString("uz-UZ"),
        typeLabel,
        desc,
        amount.toFixed(0),
        seller,
        paymentType
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tarix_${branch?.name}_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // New debts created in the period
  const totalNewDebt = branchDebts
    .filter((debt) => new Date(debt.date) >= startDate)
    .reduce((sum, debt) => sum + debt.totalAmount, 0);

  // Debt payments received in the period
  const totalDebtPaymentsInPeriod = branchDebts.reduce((sum, debt) => {
    const periodPayments = (debt.paymentHistory || []).filter((payment) => {
      return new Date(payment.date) >= startDate;
    });
    return (
      sum +
      periodPayments.reduce((pSum, p) => pSum + p.amount, 0)
    );
  }, 0);

  // Today's specific data for "Bugungi kassa"
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayBranchSales = sales.filter(
    (s) => s.branchId === branchId && new Date(s.date) >= todayStart
  );

  const todayCashSales = todayBranchSales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, s) => sum + s.amount, 0);
  const todayCardTransferSales = todayBranchSales
    .filter((s) => s.paymentType === "card" || s.paymentType === "transfer")
    .reduce((sum, s) => sum + s.amount, 0);

  const todayDebtPaymentsInPeriod = debts.filter(d => d.branchId === branchId).reduce((sum, debt) => {
    const periodPayments = (debt.paymentHistory || []).filter((payment) => {
      return new Date(payment.date) >= todayStart;
    });
    return sum + periodPayments.reduce((pSum, p) => pSum + p.amount, 0);
  }, 0);

  const getLabel = (base: string) => {
    switch (dateFilter) {
      case "week": return t('common.weekLabel') + " " + base.toLowerCase();
      case "month": return t('common.monthLabel') + " " + base.toLowerCase();
      default: return t('common.todayLabel') + " " + base.toLowerCase();
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
            <div className="text-xs text-muted-foreground">
              1$ = {exchangeRate} so'm
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">

        {/* Bugungi Kassa Plaque (Always shows Today) */}
        <Card className="p-4 bg-white dark:bg-gray-800 border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <DollarSign className="h-10 w-10 text-gray-400" />
          </div>

          <div className="relative z-10 mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Bugungi kassa</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {/* KASSA = (Cash Sales * rate) + Debt Payments (UZS) + (Card Sales * rate) */}
              {/* IMPORTANT: Debt payments from fromDebt mapper are ALREADY in UZS */}
              {formatCurrency(
                (todayCashSales * exchangeRate) +
                (todayCardTransferSales * exchangeRate) +
                todayDebtPaymentsInPeriod,
                "UZS"
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">{t('common.cash')}</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                {formatCurrency((todayCashSales * exchangeRate) + todayDebtPaymentsInPeriod, "UZS")}
              </div>
              <div className="text-[8px] text-gray-400 italic mt-1.5 leading-none">{t('seller.salesAndDebt')}</div>
            </div>

            <div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">{t('seller.cardAndTransfer')}</div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none">
                {formatCurrency(todayCardTransferSales * exchangeRate, "UZS")}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Grid 2x2 */}
        <div className="grid grid-cols-2 gap-4">
          <StatsDrillDownDialog
            title={t('admin.myProfit')}
            trigger={
              <Card className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 shadow-lg shadow-indigo-500/20">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-indigo-100 font-bold">
                  {t('admin.myProfit')}
                </div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(totalAdminProfit)}
                </div>
              </Card>
            }
            items={branchSales.map(s => ({ ...s, type: "sale" as const })).filter(s => (s.adminProfit || 0) > 0) as any[]}
          />

          <StatsDrillDownDialog
            title={t('admin.branchProfit')}
            trigger={
              <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg shadow-emerald-500/20">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-emerald-100 font-bold">
                  {t('admin.branchProfit')}
                </div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(totalSellerProfit * exchangeRate, "UZS")}
                </div>
              </Card>
            }
            items={branchSales.map(s => ({ ...s, type: "sale" as const })).filter(s => (s.sellerProfit || 0) > 0) as any[]}
          />

          <StatsDrillDownDialog
            title={t('admin.branchExpenses')}
            trigger={
              <Card className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 border-0 shadow-lg shadow-orange-500/20">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-orange-100 font-bold">
                  {t('admin.branchExpenses')}
                </div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(totalBranchExpenses * exchangeRate, "UZS")}
                </div>
              </Card>
            }
            items={branchExpenses.filter(e => !e.category || e.category === "branch").map(e => ({ ...e, type: "expense" as const })) as any[]}
          />

          <StatsDrillDownDialog
            title={t('admin.staffExpenses')}
            trigger={
              <Card className="p-4 bg-gradient-to-br from-rose-500 to-rose-600 border-0 shadow-lg shadow-rose-500/20">
                <div className="mb-1 text-[10px] uppercase tracking-wider text-rose-100 font-bold">
                  {t('admin.staffExpenses')}
                </div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(totalStaffExpenses * exchangeRate, "UZS")}
                </div>
              </Card>
            }
            items={branchExpenses.filter(e => e.category === "staff").map(e => ({ ...e, type: "expense" as const })) as any[]}
            staffMembers={staffMembers}
          />
        </div>

        <StaffProfitDistribution
          staffMembers={staffMembers}
          branchId={branchId || ""}
          totalSellerProfit={totalSellerProfit * exchangeRate}
          totalBranchExpenses={totalBranchExpenses * exchangeRate}
          branchExpenses={branchExpenses}
        />



        {/* Unified History List */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-lg font-bold dark:text-white tracking-tight">
              {t('admin.operationalHistory')}
            </h3>

            {/* Filters removed per user request */}
          </div>

          {unifiedHistory.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('messages.noOperationsYet')}
            </p>
          ) : (
            <div className="space-y-4">
              {unifiedHistory.map((item: any) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  exchangeRate={exchangeRate}
                  staffMembers={staffMembers}
                  products={products}
                  formatCurrency={formatCurrency}
                  navigate={navigate}
                  debts={debts}
                  t={t}
                />
              ))}
            </div>
          )}
        </Card>
      </div >
    </div >
  );
}

interface HistoryItemProps {
  item: any;
  exchangeRate: number;
  staffMembers: StaffMember[];
  products: Product[];
  formatCurrency: (amount: number, currency?: "USD" | "UZS") => string;
  navigate: (path: string) => void;
  debts: any[];
  t: any;
}

function HistoryItem({ item, exchangeRate, staffMembers, products, formatCurrency, navigate, debts, t }: HistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isSale = item.entryType === "sale";
  const isPayment = item.entryType === "payment";
  const isExpense = item.entryType === "expense";

  const getStatusColor = () => {
    if (isSale) {
      return item.isNasiya
        ? "bg-orange-50/50 dark:bg-orange-950/20 border-orange-200/50 dark:border-orange-800/30 text-orange-600 dark:text-orange-400"
        : "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/30 text-blue-600 dark:text-blue-400";
    }
    if (isPayment) return "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400";
    if (isExpense) return "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-800/30 text-rose-600 dark:text-rose-400";
    return "bg-gray-50/50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400";
  };

  const getIcon = () => {
    if (isSale) return <Package className="h-4 w-4" />;
    if (isPayment) return <Wallet className="h-4 w-4" />;
    if (isExpense) return <ReceiptText className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getTitle = () => {
    if (isSale) {
      const product = products.find(p => p.id === item.productId);
      return (
        <div className="flex flex-col">
          <span className="font-bold text-sm dark:text-white">{product?.collection || t('seller.withoutCollection')}</span>
          <span className="text-xs text-muted-foreground font-normal">{item.productName}</span>
        </div>
      );
    }
    if (isPayment) return (
      <div className="flex flex-col">
        <span className="font-bold text-sm dark:text-white">{item.debtorName}</span>
        <span className="text-xs text-muted-foreground font-normal">{t('debt.payment')}</span>
      </div>
    );
    if (isExpense) return (
      <div className="flex flex-col">
        <span className="font-bold text-sm dark:text-white truncate max-w-[150px]">{item.description}</span>
        <span className="text-xs text-muted-foreground font-normal">{item.category === 'staff' ? t('admin.staffExpenses') : t('admin.branchExpenses')}</span>
      </div>
    );
    return item.description;
  };

  const seller = staffMembers.find(s => s.id === (item.sellerId || item.staffId));

  // Sale groups might have multiple products
  const saleItems = isSale ? (item.items || [item]) : [];

  // For payment, find remaining debt
  const debt = isPayment ? debts.find(d => d.id === item.debtId) : null;

  return (
    <div
      onClick={() => {
        setIsExpanded(!isExpanded);
      }}
      className={cn(
        "rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden",
        getStatusColor(),
        isExpanded ? "shadow-md scale-[1.01]" : "hover:shadow-sm"
      )}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={cn("p-2.5 rounded-xl",
            isSale ? "bg-blue-100 dark:bg-blue-900/50" :
              isPayment ? "bg-emerald-100 dark:bg-emerald-900/50" :
                "bg-rose-100 dark:bg-rose-900/50"
          )}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            {getTitle()}
          </div>
        </div>

        <div className="text-right flex flex-col items-end shrink-0">
          <div className={cn(
            "text-base font-black leading-none mb-1",
            isSale || isPayment ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          )}>
            {isSale || isPayment ? "+" : "-"}{
              formatCurrency(
                item.amount * (isPayment ? 1 : (isSale ? (item.exchangeRate || exchangeRate) : exchangeRate)),
                "UZS"
              )
            }
          </div>
          <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(item.date).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="ml-2 text-muted-foreground shrink-0">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-inherit/30 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid grid-cols-2 gap-3">
            {/* Common Fields */}
            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t('common.date')}</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold dark:text-gray-200">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {new Date(item.date).toLocaleDateString("uz-UZ")}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t('nav.staff')}</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold dark:text-gray-200">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {seller?.name || t('common.unknown')}
              </div>
            </div>

            {isSale && (
              <div className="col-span-2 space-y-4">
                {saleItems.map((sItem: any, idx: number) => {
                  const sProduct = products.find(p => p.id === sItem.productId);
                  return (
                    <div key={idx} className={cn(
                      "p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/30 dark:bg-indigo-900/10",
                      idx > 0 && "mt-2"
                    )}>
                      <div className="flex items-center gap-3 mb-3 border-b border-indigo-100/50 dark:border-indigo-900/20 pb-2">
                        {sProduct?.photo ? (
                          <img src={sProduct.photo} alt="" className="h-10 w-10 object-cover rounded-lg shadow-sm" />
                        ) : (
                          <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-indigo-400" />
                          </div>
                        )}
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider leading-none mb-1">
                            {sProduct?.collection || t('seller.withoutCollection')}
                          </span>
                          <span className="text-xs font-bold dark:text-white truncate">{sItem.productName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className="text-muted-foreground uppercase font-bold tracking-tight opacity-70">{t('product.size')} / {t('seller.area')}</span>
                          <div className="font-bold dark:text-gray-200">
                            {sItem.type === "unit"
                              ? `${sItem.quantity} ${t('common.unit')} ${sItem.size ? `(${sItem.size})` : ''}`
                              : `${(sItem.area || sItem.quantity).toFixed(1)} m² ${sItem.width ? `(${sItem.width}x${((sItem.area || sItem.quantity) / (sItem.width || 1)).toFixed(1)})` : ''}`}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className="text-muted-foreground uppercase font-bold tracking-tight opacity-70">{t('common.payment')}</span>
                          <div className="flex items-center gap-1 font-bold dark:text-gray-200">
                            <span className="uppercase">{sItem.paymentType === 'cash' ? t('common.cash') : sItem.paymentType === 'card' ? t('common.card') : t('common.transfer')}</span>
                            {sItem.isNasiya && <Badge className="bg-orange-100 text-orange-600 border-orange-200 text-[7px] h-3 px-1 py-0">{t('seller.nasiyaSale')}</Badge>}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className="text-indigo-500 font-black uppercase tracking-tight">{t('product.buyPrice')}</span>
                          <div className="font-black text-indigo-600 dark:text-indigo-400">
                            {formatCurrency(sProduct?.buyPriceUsd || 0, "USD")}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 text-[10px]">
                          <span className="text-emerald-500 font-black uppercase tracking-tight">{t('admin.actualProfit')}</span>
                          <div className="font-black text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(sItem.adminProfit || sItem.admin_profit || 0, "USD")}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="text-[10px] bg-slate-100 dark:bg-slate-800/50 p-2 rounded-lg flex items-center justify-end">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] uppercase font-bold text-indigo-500">{t('common.adminShort')} JAMI</span>
                      <span className="text-xs font-black text-indigo-600">{formatCurrency(item.adminProfit, "USD")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isPayment && (
              <>
                <div className="col-span-2 flex flex-col gap-1 p-2 bg-emerald-100/30 dark:bg-emerald-900/10 rounded-xl mb-1">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t('common.filterByNasiya')} ({t('common.debts')})</span>
                  <div className="flex justify-between items-center">
                    <span className="text-xs dark:text-gray-400">{t('debt.remainingDebt')}:</span>
                    <span className="text-sm font-black text-emerald-600 truncate">{formatCurrency(debt?.remainingAmount || 0, "UZS")}</span>
                  </div>
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t('expense.description')}</span>
                  <div className="text-xs font-semibold dark:text-gray-200 italic">
                    {item.note || t('messages.noData')}
                  </div>
                </div>
              </>
            )}

            {isExpense && (
              <div className="col-span-2 flex flex-col gap-1">
                <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{t('expense.description')}</span>
                <div className="text-xs font-semibold dark:text-gray-200">
                  {item.description}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
