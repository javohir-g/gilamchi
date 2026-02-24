import {
  Plus,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  HandCoins,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
const startOfDay = (date: Date) => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};
import { DateRange } from "react-day-picker";
import { useApp, Sale } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { BottomNav } from "../shared/BottomNav";
import { DatePickerWithRange } from "../ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { StaffProfitDistribution } from "../shared/StaffProfitDistribution";

interface Order {
  orderId: string;
  sales: Sale[];
  totalAmount: number;
  date: string;
  paymentTypes: string[];
}

export function SellerHome() {
  const navigate = useNavigate();
  const { user, sales, products, branches, isAdminViewingAsSeller, exchangeRate, expenses, debts, staffMembers } = useApp();

  // Получить название коллекции по productId
  const getCollection = (productId: string, fallback: string) => {
    const product = products.find(p => p.id === productId);
    return product?.collection || fallback;
  };

  // Формирует строку размера: "3x5", "2x4" из width/length, или берёт поле size
  const getSizeLabel = (sale: any): string | null => {
    if (sale.width != null && sale.length != null && sale.length > 0) {
      const w = parseFloat(sale.width.toFixed(2)).toString().replace(/\.?0+$/, '');
      const l = parseFloat(sale.length.toFixed(2)).toString().replace(/\.?0+$/, '');
      return `${w}x${l}`;
    }
    if (sale.size) return sale.size;
    return null;
  };

  const { t } = useLanguage();

  const [filterType, setFilterType] = useState<"today" | "week" | "month" | "custom">("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const userBranch = branches.find((b) => b.id === user?.branchId);

  // Filter based on period and branch
  const getFilteredData = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const filterByDate = (dateStr: string) => {
      const d = new Date(dateStr);
      switch (filterType) {
        case "today":
          return d.getTime() >= today.getTime();
        case "week":
          const weekStart = new Date(today);
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setHours(0, 0, 0, 0);
          weekStart.setDate(diff);
          return d.getTime() >= weekStart.getTime();
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return d.getTime() >= monthStart.getTime();
        case "custom":
          if (!dateRange?.from) return true;
          const start = startOfDay(dateRange.from);
          const end = dateRange.to ? new Date(dateRange.to) : new Date(start);
          end.setHours(23, 59, 59, 999);
          return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
        default:
          return true;
      }
    };

    const filteredSales = sales.filter((s: Sale) => {
      const isOurBranch = isAdminViewingAsSeller
        ? String(s.branchId).toLowerCase() === String(user?.branchId).toLowerCase()
        : true;
      return isOurBranch && filterByDate(s.date);
    });

    const filteredExpenses = expenses.filter(e =>
      e.branchId === userBranch?.id &&
      filterByDate(e.date) &&
      (!e.category || e.category === "branch")
    );

    return { filteredSales, filteredExpenses, filterByDate };
  };

  const { filteredSales, filteredExpenses, filterByDate } = getFilteredData();

  // Kassa calculations
  const cashSales = filteredSales
    .filter(s => s.paymentType === 'cash')
    .reduce((sum, s) => sum + s.amount, 0);

  const cardTransferSales = filteredSales
    .filter(s => s.paymentType === 'card' || s.paymentType === 'transfer')
    .reduce((sum, s) => sum + s.amount, 0);

  const debtPayments = sales
    .filter(s => {
      const isOurBranch = isAdminViewingAsSeller
        ? String(s.branchId).toLowerCase() === String(user?.branchId).toLowerCase()
        : true;
      return isOurBranch && (s as any).type === 'debt_payment' && filterByDate(s.date);
    })
    .reduce((sum, s) => sum + s.amount, 0);

  const totalPeriodExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Group operations
  const operations: any[] = [];
  const orderMap = new Map<string, Sale[]>();

  filteredSales.forEach((sale: Sale) => {
    const orderId = sale.orderId || sale.id;
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, []);
    }
    orderMap.get(orderId)!.push(sale);
  });

  orderMap.forEach((orderSales, orderId) => {
    const totalAmount = orderSales.reduce((sum, s) => sum + s.amount, 0);
    const paymentTypes = [...new Set(orderSales.map((s) => s.paymentType))];
    const isNasiya = orderSales.some(s => s.isNasiya);

    operations.push({
      id: orderId,
      opType: 'order',
      sales: orderSales,
      totalAmount,
      date: orderSales[0].date,
      paymentTypes: paymentTypes.map((pt) =>
        pt === "cash" ? t('common.cash') : pt === "card" ? t('common.card') : t('common.transfer'),
      ),
      isNasiya
    });
  });

  debts.forEach(debt => {
    debt.paymentHistory?.forEach(payment => {
      const isOurBranch = isAdminViewingAsSeller
        ? String(debt.branchId).toLowerCase() === String(user?.branchId).toLowerCase()
        : true;

      if (isOurBranch && filterByDate(payment.date)) {
        operations.push({
          id: payment.id,
          opType: 'payment',
          amount: payment.amount,
          date: payment.date,
          debtorName: debt.debtorName,
          debtId: debt.id,
          note: payment.note
        });
      }
    });
  });

  operations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number, currency: "USD" | "UZS" = "UZS") => {
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

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header - Sticky like DailySales */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="px-4 py-4 flex justify-between items-center">
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
              {userBranch?.name || t('common.branch')}
            </div>
            <h1 className="text-xl font-black text-foreground">{user?.fullName || user?.name}</h1>
          </div>
          <Badge className="bg-blue-600/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600/20 border-0 px-3 py-1 font-bold text-[10px] uppercase">
            {t('common.seller')}
          </Badge>
        </div>

        {/* Date Filters */}
        <div className="px-4 pb-4">
          <div className="flex gap-2 w-full overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setFilterType("today")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${filterType === "today"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.today')}
            </button>
            <button
              onClick={() => setFilterType("week")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${filterType === "week"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.week')}
            </button>
            <button
              onClick={() => setFilterType("month")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${filterType === "month"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.month')}
            </button>
            <button
              onClick={() => setFilterType("custom")}
              className={`flex-1 min-w-[70px] py-3 px-3 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${filterType === "custom"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-card text-foreground border border-border hover:border-blue-300 dark:hover:border-blue-700"
                }`}
            >
              {t('common.other')}
            </button>
          </div>

          {filterType === "custom" && (
            <div className="mt-4 flex justify-center animate-in slide-in-from-top-2 fade-in">
              <DatePickerWithRange
                date={dateRange}
                setDate={setDateRange}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-3 max-w-4xl mx-auto">
        {/* Kassa Card (Matching Admin Dashboard style) */}
        <Card className="p-5 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-800 dark:to-indigo-900 border-0 shadow-lg shadow-indigo-500/20 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-20 w-20 text-white" />
          </div>

          <div className="relative z-10 mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-indigo-100/80 uppercase tracking-widest">{t('seller.cashRegister')}</span>
            </div>
            <div className="text-2xl font-black text-white leading-none tracking-tight">
              {formatCurrency((cashSales + debtPayments + cardTransferSales) * exchangeRate, "UZS")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-white/10">
            <div>
              <div className="text-[9px] text-indigo-100/60 font-bold uppercase mb-1">{t('common.cash')}</div>
              <div className="text-sm font-bold text-white leading-none">
                {formatCurrency((cashSales + debtPayments) * exchangeRate, "UZS")}
              </div>
              <div className="text-[8px] text-indigo-100/40 italic mt-1.5 leading-none">{t('seller.salesAndDebt')}</div>
            </div>

            <div>
              <div className="text-[9px] text-indigo-100/60 font-bold uppercase mb-1">{t('seller.cardAndTransfer')}</div>
              <div className="text-sm font-bold text-blue-100 leading-none">
                {formatCurrency(cardTransferSales * exchangeRate, "UZS")}
              </div>
            </div>
          </div>
        </Card>

        {/* Branch Profit Card */}
        {(() => {
          const totalBranchProfit = filteredSales.reduce(
            (sum, sale) => sum + (sale.sellerProfit || 0),
            0,
          );
          if (totalBranchProfit <= 0) return null;
          return (
            <Dialog>
              <DialogTrigger asChild>
                <Card className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-700 dark:to-emerald-800 border-0 shadow-md cursor-pointer hover:opacity-90 transition-opacity">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HandCoins className="h-4 w-4 text-emerald-100" />
                      <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                        {t('admin.branch')} {t('common.profit')}
                      </span>
                    </div>
                    <div className="text-lg font-black text-white">
                      {formatCurrency(totalBranchProfit * exchangeRate)}
                    </div>
                  </div>
                </Card>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('admin.profitDistribution')}</DialogTitle>
                </DialogHeader>
                <StaffProfitDistribution
                  staffMembers={staffMembers}
                  branchId={userBranch?.id || ""}
                  totalSellerProfit={totalBranchProfit * exchangeRate}
                  totalBranchExpenses={totalPeriodExpenses * exchangeRate}
                  branchExpenses={filteredExpenses}
                />
              </DialogContent>
            </Dialog>
          );
        })()}

        {/* Recent Sales List */}
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 px-1 tracking-wider uppercase">
            {t('seller.allOrders')}
          </h3>

          <div className="space-y-3">
            {operations.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
                {t('messages.noSalesPeriod')}
              </Card>
            ) : (
              operations.map((op) => {
                if (op.opType === 'payment') {
                  // Render Debt Payment Card
                  return (
                    <Card
                      key={op.id}
                      className="p-4 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 overflow-hidden hover:shadow-md transition-shadow rounded-2xl cursor-pointer"
                      onClick={() => navigate(`/seller/debts`)} // Navigate to debts to see details
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500/10 p-2 rounded-xl">
                            <HandCoins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-bold text-foreground">
                              {t('debt.payment')}: {op.debtorName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(op.date).toLocaleTimeString("uz-UZ", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {op.note && ` • ${op.note}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(op.amount * exchangeRate)}
                          </div>
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-emerald-500 border-emerald-200">
                            {t('debt.paid')}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  );
                }

                // Render Order Card
                const order = op;
                const isExpanded = expandedOrders.has(order.id);
                const isMultiProduct = order.sales.length > 1;

                return (
                  <Card
                    key={order.id}
                    className={`p-0 border border-border overflow-hidden hover:shadow-md transition-shadow rounded-2xl ${order.isNasiya
                      ? "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-900/30"
                      : "bg-card"
                      }`}
                  >
                    {/* Order Header */}
                    <div
                      className={`p-4 ${isMultiProduct ? "cursor-pointer" : ""}`}
                      onClick={() => isMultiProduct && toggleOrder(order.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className={order.isNasiya ? "bg-orange-500/10 p-2 rounded-xl" : "bg-blue-500/10 p-2 rounded-xl"}>
                              {order.isNasiya ? (
                                <HandCoins className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              ) : (
                                <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-lg text-foreground leading-tight">
                                {isMultiProduct
                                  ? t('seller.productsCount').replace('{count}', order.sales.length.toString())
                                  : getCollection(order.sales[0].productId, order.sales[0].productName)}
                              </span>
                              {order.isNasiya && (
                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter">
                                  {t('seller.nasiyaSale')}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isMultiProduct && (
                            <div className="text-sm text-muted-foreground pl-12 flex flex-wrap gap-x-2 gap-y-0.5">
                              {getSizeLabel(order.sales[0]) && (
                                <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[12px] font-bold tracking-wide">
                                  {getSizeLabel(order.sales[0])}
                                </span>
                              )}
                              {order.sales[0].area != null && order.sales[0].area > 0 && (
                                <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                                  {order.sales[0].area.toFixed(2)} м²
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isMultiProduct && (
                            <div className="text-muted-foreground">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border/50 pt-3 mt-2">
                        <div className="text-xs font-bold text-muted-foreground bg-secondary/50 px-2 py-1 rounded-lg">
                          {new Date(order.date).toLocaleDateString("uz-UZ", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}{" "}
                          {new Date(order.date).toLocaleTimeString("uz-UZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-xl font-bold text-foreground">
                            {formatCurrency(order.totalAmount * exchangeRate)}
                          </div>
                          {(() => {
                            const branchProfit = order.sales.reduce(
                              (sum: number, sale: any) => sum + (sale.sellerProfit || 0),
                              0,
                            );
                            if (branchProfit !== 0) {
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-xs font-bold mt-1 px-2 py-0.5 rounded-full"
                                  style={{
                                    borderColor: branchProfit > 0 ? "#22c55e" : "#ef4444",
                                    color: branchProfit > 0 ? "#22c55e" : "#ef4444",
                                    backgroundColor: branchProfit > 0 ? "#22c55e10" : "#ef444410",
                                  }}
                                >
                                  {branchProfit > 0 ? "+" : ""}
                                  {formatCurrency(branchProfit * exchangeRate)}
                                </Badge>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Product List */}
                    {isMultiProduct && isExpanded && (
                      <div className="bg-secondary/10 border-t border-border p-4">
                        <div className="space-y-3">
                          {order.sales.map((sale: any) => (
                            <div
                              key={sale.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex-1">
                                <div className="text-foreground font-bold">
                                  {getCollection(sale.productId, sale.productName)}
                                </div>
                                <div className="text-muted-foreground text-xs flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                                  {getSizeLabel(sale) && (
                                    <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md text-[12px] font-bold tracking-wide">
                                      {getSizeLabel(sale)}
                                    </span>
                                  )}
                                  {sale.area != null && sale.area > 0 && (
                                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                                      {sale.area.toFixed(2)} м²
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-foreground font-bold">
                                  {formatCurrency(sale.amount * exchangeRate)}
                                </div>
                                {sale.sellerProfit && sale.sellerProfit !== 0 && (
                                  <div
                                    className="text-xs font-semibold mt-0.5"
                                    style={{
                                      color: sale.sellerProfit > 0 ? "#22c55e" : "#ef4444",
                                    }}
                                  >
                                    {sale.sellerProfit > 0 ? "+" : ""}
                                    {formatCurrency(sale.sellerProfit * exchangeRate)}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}