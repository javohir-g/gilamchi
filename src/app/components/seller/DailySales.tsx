import { useState } from "react";
import {
  ArrowLeft,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useApp, Sale } from "../../context/AppContext";
import { BottomNav } from "../shared/BottomNav";

interface Order {
  orderId: string;
  sales: Sale[];
  totalAmount: number;
  date: string;
  paymentTypes: string[];
}

export function DailySales() {
  const navigate = useNavigate();
  const { user, sales } = useApp();
  const [expandedOrders, setExpandedOrders] = useState<
    Set<string>
  >(new Set());

  // Filter today's sales for this seller
  const todaySales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const today = new Date();
    return (
      sale.sellerId === user?.id &&
      saleDate.toDateString() === today.toDateString()
    );
  });

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

  const totalAmount = todaySales.reduce(
    (sum, sale) => sum + sale.amount,
    0,
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/seller/home")}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-xl dark:text-white">
            Bugungi savdolarim
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Total Summary */}
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-1 text-sm text-blue-700 dark:text-blue-300">
                Jami summa
              </div>
              <div className="text-3xl text-blue-900 dark:text-blue-100">
                {formatCurrency(totalAmount)}
              </div>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                {orders.length} ta buyurtma
              </div>
            </div>
            <div className="rounded-full bg-blue-200 dark:bg-blue-800 p-4">
              <DollarSign className="h-10 w-10 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </Card>

        {/* Payment Breakdown */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg dark:text-white">
            To'lov turlari bo'yicha
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-900 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <span className="dark:text-white">
                  Naqd pul
                </span>
              </div>
              <span className="dark:text-white">
                {formatCurrency(cashTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                <span className="dark:text-white">Karta</span>
              </div>
              <span className="dark:text-white">
                {formatCurrency(cardTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-purple-50 dark:bg-purple-900 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-4 w-4 rounded-full bg-purple-500"></div>
                <span className="dark:text-white">
                  O'tkazma
                </span>
              </div>
              <span className="dark:text-white">
                {formatCurrency(transferTotal)}
              </span>
            </div>
          </div>
        </Card>

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
                    className="rounded-lg border dark:border-gray-700 overflow-hidden"
                  >
                    {/* Order Header */}
                    <div
                      className={`p-4 ${isMultiProduct ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750" : ""}`}
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
                          {order.paymentTypes.map((pt, idx) => (
                            <Badge
                              key={idx}
                              variant={
                                pt === "Naqd"
                                  ? "default"
                                  : pt === "Karta"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={`text-xs ${pt === "Naqd" ? "bg-green-600 hover:bg-green-700" : ""}`}
                            >
                              {pt}
                            </Badge>
                          ))}
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
                        <div className="text-lg text-blue-600 dark:text-blue-400">
                          {formatCurrency(order.totalAmount)}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Product List */}
                    {isMultiProduct && isExpanded && (
                      <div className="bg-gray-50 dark:bg-gray-750 border-t dark:border-gray-700 p-4">
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