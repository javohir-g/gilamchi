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

interface Order {
  orderId: string;
  sales: Sale[];
  totalAmount: number;
  date: string;
  paymentTypes: string[];
}

export function SellerHome() {
  const navigate = useNavigate();
  const { user, sales, branches, isAdminViewingAsSeller } = useApp();
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
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
      <div className="bg-card border-b border-border px-6 py-4 mb-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
              {userBranch?.name || "Filial nomi"}
            </div>
            <h1 className="text-2xl font-bold text-foreground">{user?.name}</h1>
          </div>
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border-0 px-3 py-1 font-semibold">
            Sotuvchi
          </Badge>
        </div>
      </div>

      <div className="px-4 md:px-6 space-y-6 max-w-4xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Total Sales */}
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 border-0 shadow-lg shadow-blue-500/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-white" />
                  <span className="text-sm font-medium text-blue-100">
                    Bugungi savdo
                  </span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {formatCurrency(totalSalesToday)}
                </div>
                <div className="text-sm text-blue-100 mt-1">
                  {todaySales.length} ta savdodan
                </div>
              </div>
              <div className="bg-white/20 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </Card>

          {/* Branch Profit */}
          {(() => {
            const totalBranchProfit = todaySales.reduce(
              (sum, sale) => sum + (sale.seller_profit || 0),
              0,
            );
            if (totalBranchProfit <= 0) return null;
            return (
              <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-700 dark:to-emerald-800 border-0 shadow-lg shadow-emerald-500/20">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <HandCoins className="h-5 w-5 text-white" />
                      <span className="text-sm text-emerald-100">
                        Filial foydasi
                      </span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                      {formatCurrency(totalBranchProfit)}
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-full p-3">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </Card>
            );
          })()}
        </div>

        {/* Recent Sales List */}
        <div>
          <h3 className="text-sm font-bold text-muted-foreground mb-4 px-1 tracking-wider uppercase">
            Barcha buyurtmalar
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
                            {formatCurrency(order.totalAmount)}
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
                                  {formatCurrency(branchProfit)}
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
                                  {formatCurrency(sale.amount)}
                                </div>
                                {sale.seller_profit && sale.seller_profit !== 0 && (
                                  <div
                                    className="text-xs font-semibold mt-0.5"
                                    style={{
                                      color: sale.seller_profit > 0 ? "#22c55e" : "#ef4444",
                                    }}
                                  >
                                    {sale.seller_profit > 0 ? "+" : ""}
                                    {formatCurrency(sale.seller_profit)}
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