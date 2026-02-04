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
  const { user, sales, branches, isAdminViewingAsSeller, exchangeRate } = useApp();
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const userBranch = branches.find((b) => b.id === user?.branchId);

  // Robust date check for "today"
  const isToday = (dateStr: string) => {
    const saleDate = new Date(dateStr);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  };

  // Filter today's sales
  const todaySales = sales.filter((sale: Sale) => {
    const isOurSale = isAdminViewingAsSeller
      ? String(sale.branchId).toLowerCase() === String(user?.branchId).toLowerCase()
      : true;

    if (!isOurSale) return false;
    return isToday(sale.date);
  });

  const totalSalesToday = todaySales.reduce(
    (sum: number, sale: Sale) => sum + sale.amount,
    0,
  );

  const cashSalesToday = todaySales
    .filter(s => s.paymentType === 'cash')
    .reduce((sum, s) => sum + s.amount, 0);

  const cardAndTransferSalesToday = todaySales
    .filter(s => s.paymentType === 'card' || s.paymentType === 'transfer')
    .reduce((sum, s) => sum + s.amount, 0);

  // Calculate today's branch expenses
  const todayBranchExpenses = useApp().expenses
    .filter(e =>
      e.branchId === userBranch?.id &&
      isToday(e.date) &&
      (!e.category || e.category === "branch")
    )
    .reduce((sum, e) => sum + e.amount, 0);

  // Group sales by orderId
  const orders: Order[] = [];
  const orderMap = new Map<string, Sale[]>();

  todaySales.forEach((sale) => {
    const orderId = sale.orderId || sale.id;
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, []);
    }
    orderMap.get(orderId)!.push(sale);
  });

  orderMap.forEach((orderSales, orderId) => {
    const totalAmount = orderSales.reduce((sum, s) => sum + s.amount, 0);
    const paymentTypes = [...new Set(orderSales.map((s) => s.paymentType))];

    orders.push({
      orderId,
      sales: orderSales,
      totalAmount,
      date: orderSales[0].date,
      paymentTypes: paymentTypes.map((pt) =>
        pt === "cash" ? "Naqd" : pt === "card" ? "Karta" : "O'tkazma",
      ),
    });
  });

  // Sort orders by date (newest first)
  orders.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

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
      <div className="bg-card border-b border-border px-4 py-3 mb-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5 opacity-70">
              {userBranch?.name || "Filial nomi"}
            </div>
            <h1 className="text-xl font-bold text-foreground">{user?.name}</h1>
          </div>
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-0 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight">
            Sotuvchi
          </Badge>
        </div>
      </div>

      <div className="px-3 md:px-6 space-y-4 max-w-4xl mx-auto">
        {/* Stats Grid */}
        <div className="space-y-4">
          {/* Main Kassa Card */}
          <Card className="relative overflow-hidden border-0 bg-card shadow-xl p-5 group flex flex-col gap-5">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
              <DollarSign className="h-20 w-20 text-blue-500" />
            </div>

            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              KASSA (BUGUN)
            </h3>

            <div className="flex flex-col gap-4 relative z-10">
              <div className="space-y-1 pb-4 border-b border-border/50">
                <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Naqd</div>
                <div className="text-xl font-black text-foreground tracking-tight">
                  {formatCurrency(cashSalesToday * exchangeRate)}
                </div>
                <div className="flex items-center gap-1 opacity-50">
                  <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                  <span className="text-[8px] italic font-medium">Sotuv + Qarz</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">Karta / O'tkazma</div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
                  {formatCurrency(cardAndTransferSalesToday * exchangeRate)}
                </div>
              </div>
            </div>

            <div className="mt-2 pt-4 border-t border-border/50 flex justify-between items-center group-hover:border-blue-500/20 transition-colors">
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Jami tushum:</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalSalesToday * exchangeRate)}
              </span>
            </div>
          </Card>

          {/* Branch Profit Row */}
          {(() => {
            const totalBranchProfit = todaySales.reduce(
              (sum, sale) => sum + (sale.seller_profit || 0),
              0,
            );
            return (
              <Dialog>
                <DialogTrigger asChild>
                  <Card className={`p-4 bg-card border border-border shadow-sm flex items-center justify-between cursor-pointer hover:bg-secondary/20 transition-all active:scale-[0.99] ${totalBranchProfit <= 0 ? 'opacity-50' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-500/10 p-2 rounded-xl">
                        <HandCoins className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Filial foydasi</div>
                        <div className="text-base font-black text-foreground">{formatCurrency(totalBranchProfit * exchangeRate)}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-lg">Sof foyda</div>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Foyda taqsimoti</DialogTitle>
                  </DialogHeader>
                  <StaffProfitDistribution
                    staffMembers={useApp().staffMembers}
                    branchId={userBranch?.id || ""}
                    totalSellerProfit={totalBranchProfit * exchangeRate}
                    totalBranchExpenses={todayBranchExpenses * exchangeRate}
                    branchExpenses={useApp().expenses.filter(e => e.branchId === userBranch?.id && isToday(e.date))}
                  />
                </DialogContent>
              </Dialog>
            );
          })()}
        </div>

        {/* Recent Sales List */}
        <div>
          <h3 className="text-[10px] font-black text-muted-foreground mb-3 px-1 tracking-[0.2em] uppercase opacity-50">
            BUYURTMALAR (BUGUN)
          </h3>

          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card className="p-12 text-center text-muted-foreground bg-card rounded-2xl border border-border">
                Bugun hali savdo yo'q
              </Card>
            ) : (
              orders.map((order) => {
                const isExpanded = expandedOrders.has(order.orderId);
                const isMultiProduct = order.sales.length > 1;

                return (
                  <Card
                    key={order.orderId}
                    className="p-0 border border-border bg-card overflow-hidden hover:shadow-md transition-shadow rounded-2xl"
                  >
                    {/* Order Header */}
                    <div
                      className={`p-4 ${isMultiProduct ? "cursor-pointer" : ""}`}
                      onClick={() => isMultiProduct && toggleOrder(order.orderId)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <div className="bg-blue-500/10 p-2 rounded-xl">
                              <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-bold text-lg text-foreground">
                              {isMultiProduct
                                ? `${order.sales.length} ta mahsulot`
                                : order.sales[0].productName}
                            </span>
                          </div>
                          {!isMultiProduct && (
                            <div className="text-sm text-muted-foreground ml-13">
                              {order.sales[0].quantity}{" "}
                              {order.sales[0].type === "unit" ? "dona" : "metr"}
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
                              (sum, sale) => sum + (sale.seller_profit || 0),
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
                          {order.sales.map((sale) => (
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
                                  {sale.type === "unit" ? "dona" : "metr"}
                                  {sale.area && ` • ${sale.area.toFixed(2)} m²`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-foreground font-bold">
                                  {formatCurrency(sale.amount * exchangeRate)}
                                </div>
                                {sale.seller_profit && sale.seller_profit !== 0 && (
                                  <div
                                    className="text-xs font-semibold mt-0.5"
                                    style={{
                                      color: sale.seller_profit > 0 ? "#22c55e" : "#ef4444",
                                    }}
                                  >
                                    {sale.seller_profit > 0 ? "+" : ""}
                                    {formatCurrency(sale.seller_profit * exchangeRate)}
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