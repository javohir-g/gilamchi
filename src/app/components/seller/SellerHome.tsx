import {
  Plus,
  DollarSign,
  Package,
  ChevronDown,
  ChevronUp,
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
  const { user, sales, branches } = useApp();
  const [expandedOrders, setExpandedOrders] = useState<
    Set<string>
  >(new Set());

  const userBranch = branches.find(
    (b) => b.id === user?.branchId,
  );

  // Calculate today's sales for this seller
  const todaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return (
      sale.sellerId === user?.id &&
      saleDate.toDateString() === today.toDateString()
    );
  });

  const totalSalesToday = todaySales.reduce(
    (sum, sale) => sum + sale.amount,
    0,
  );

  // Group sales by orderId
  const orders: Order[] = [];
  const orderMap = new Map<string, Sale[]>();

  todaySales.forEach((sale) => {
    const orderId = sale.orderId || sale.id; // Use sale.id for single-product sales
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, []);
    }
    orderMap.get(orderId)!.push(sale);
  });

  orderMap.forEach((orderSales, orderId) => {
    const totalAmount = orderSales.reduce(
      (sum, s) => sum + s.amount,
      0,
    );
    const paymentTypes = [
      ...new Set(orderSales.map((s) => s.paymentType)),
    ];

    orders.push({
      orderId,
      sales: orderSales,
      totalAmount,
      date: orderSales[0].date,
      paymentTypes: paymentTypes.map((pt) =>
        pt === "cash"
          ? "Naqd"
          : pt === "card"
            ? "Karta"
            : "O'tkazma",
      ),
    });
  });

  // Sort orders by date (newest first)
  orders.sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  // Group by payment type
  const cashTotal = todaySales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, s) => sum + s.amount, 0);
  const cardTotal = todaySales
    .filter((s) => s.paymentType === "card")
    .reduce((sum, s) => sum + s.amount, 0);
  const transferTotal = todaySales
    .filter((s) => s.paymentType === "transfer")
    .reduce((sum, s) => sum + s.amount, 0);

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ").format(amount) + " so'm"
    );
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
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-950 px-4 pb-8 pt-6 text-white shadow-lg">
        <div className="mb-1 text-sm opacity-90">
          Xush kelibsiz!
        </div>
        <h1 className="mb-1 text-2xl">{user?.name}</h1>
      </div>

      {/* Today's Sales Summary */}
      <div className="px-4 -mt-6">
        <Card className="border border-border bg-card p-6 shadow-xl dark:shadow-2xl dark:shadow-blue-900/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 text-sm text-muted-foreground">
                Bugungi savdo
              </div>
              <div className="text-3xl text-card-foreground">
                {formatCurrency(totalSalesToday)}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {todaySales.length} ta mahsulot sotildi
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 p-4">
              <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payment types breakdown removed */}

      {/* Recent Sales */}
      <div className="mt-6 px-4 space-y-6">
        {/* Orders List */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg dark:text-white">
            Barcha buyurtmalar
          </h3>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">
              Bugun hali savdo yo'q
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isExpanded = expandedOrders.has(
                  order.orderId,
                );
                const isMultiProduct = order.sales.length > 1;

                return (
                  <div
                    key={order.orderId}
                    className="rounded-lg border dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
                  >
                    {/* Order Header */}
                    <div
                      className={`p-4 ${isMultiProduct ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" : ""}`}
                      onClick={() =>
                        isMultiProduct &&
                        toggleOrder(order.orderId)
                      }
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="dark:text-white">
                              {isMultiProduct
                                ? `${order.sales.length} ta mahsulot`
                                : order.sales[0].productName}
                            </span>
                          </div>
                          {!isMultiProduct && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Miqdor: {order.sales[0].quantity}{" "}
                              {order.sales[0].type === "unit"
                                ? "dona"
                                : "metr"}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {isMultiProduct && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 dark:text-white" />
                              ) : (
                                <ChevronDown className="h-4 w-4 dark:text-white" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t dark:border-gray-700 pt-2">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(
                            order.date,
                          ).toLocaleTimeString("uz-UZ", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-lg text-blue-600 dark:text-blue-400">
                            {formatCurrency(order.totalAmount)}
                          </div>
                          {(() => {
                            const totalProfit =
                              order.sales.reduce(
                                (sum, sale) =>
                                  sum + (sale.profit || 0),
                                0,
                              );
                            if (totalProfit !== 0) {
                              return (
                                <div
                                  className={`text-xs font-medium ${
                                    totalProfit > 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {totalProfit > 0 ? "+" : ""}
                                  {formatCurrency(totalProfit)}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Product List */}
                    {isMultiProduct && isExpanded && (
                      <div className="bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700 p-4">
                        <div className="space-y-2">
                          {order.sales.map((sale) => (
                            <div
                              key={sale.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex-1">
                                <div className="dark:text-white">
                                  {sale.productName}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400">
                                  {sale.quantity}{" "}
                                  {sale.type === "unit"
                                    ? "dona"
                                    : "metr"}
                                </div>
                              </div>
                              <div className="text-blue-600 dark:text-blue-400">
                                {formatCurrency(sale.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}