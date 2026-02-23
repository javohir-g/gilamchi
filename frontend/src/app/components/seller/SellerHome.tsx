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
import { useApp, Sale } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { BottomNav } from "../shared/BottomNav";
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
  const { user, sales, branches, isAdminViewingAsSeller, exchangeRate, expenses, debts, staffMembers } = useApp();
  const { t } = useLanguage();

  const [filterType, setFilterType] = useState<"today" | "week" | "month" | "custom">("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
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
          return d >= today;
        case "week":
          const weekStart = new Date(today);
          const day = today.getDay();
          const diff = today.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          weekStart.setHours(0, 0, 0, 0);
          return d >= weekStart;
        case "month":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          return d >= monthStart;
        case "custom":
          if (!customStart || !customEnd) return true;
          const start = new Date(customStart);
          const end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
          return d >= start && d <= end;
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
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {userBranch?.name || t('common.branch')}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{user?.fullName || user?.name}</h1>
          </div>
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-0 px-3 py-1 font-semibold">
            {t('common.seller')}
          </Badge>
        </div>

        {/* Date Filters */}
        <div className="px-6 pb-4">
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3">
            {[
              { id: "today", label: t('common.today') },
              { id: "week", label: t('common.week') },
              { id: "month", label: t('common.month') },
              { id: "custom", label: t('common.other') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id as any)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${filterType === tab.id
                    ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {filterType === "custom" && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2 mb-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-10 px-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-10 px-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-900 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-3 max-w-4xl mx-auto">
        {/* Kassa Card (Refined Compact Layout) */}
        <Card className="p-4 bg-white dark:bg-gray-800 border-0 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <DollarSign className="h-10 w-10 text-gray-400" />
          </div>

          <div className="relative z-10 mb-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{t('seller.cashRegister')}</span>
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
              {formatCurrency((cashSales + debtPayments + cardTransferSales) * exchangeRate, "UZS")}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">{t('common.cash')}</div>
              <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                {formatCurrency((cashSales + debtPayments) * exchangeRate, "UZS")}
              </div>
              <div className="text-[8px] text-gray-400 italic mt-1.5 leading-none">{t('seller.salesAndDebt')}</div>
            </div>

            <div>
              <div className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">{t('seller.cardAndTransfer')}</div>
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none">
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
                                  : order.sales[0].productName}
                              </span>
                              {order.isNasiya && (
                                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-tighter">
                                  {t('seller.nasiyaSale')}
                                </span>
                              )}
                            </div>
                          </div>
                          {!isMultiProduct && (
                            <div className="text-sm text-muted-foreground ml-13">
                              {order.sales[0].quantity}{" "}
                              {order.sales[0].type === "unit" ? t('common.unit') : t('common.meter')}
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
                                  {sale.productName}
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  {sale.quantity}{" "}
                                  {sale.type === "unit" ? t('common.unit') : t('common.meter')}
                                  {sale.area && ` • ${sale.area.toFixed(2)} m²`}
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