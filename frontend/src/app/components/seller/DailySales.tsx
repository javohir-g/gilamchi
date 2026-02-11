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
import { useLanguage } from "../../context/LanguageContext";
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
  const { user, sales, isAdminViewingAsSeller, exchangeRate } = useApp();
  const { t } = useLanguage();
  const [expandedOrders, setExpandedOrders] = useState<
    Set<string>
  >(new Set());

  // Robust date check for "today"
  const isToday = (dateStr: string) => {
    const saleDate = new Date(dateStr);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  };

  // Filter today's sales
  const todaySales = sales.filter((sale: Sale) => {
    // If we are an admin viewing as a seller, we MUST filter by the selected branch.
    // Real sellers already got a filtered list from the API.
    const isOurSale = isAdminViewingAsSeller
      ? String(sale.branchId).toLowerCase() === String(user?.branchId).toLowerCase()
      : true;

    if (!isOurSale) return false;

    return isToday(sale.date);
  });

  // Group sales by orderId
  const orders: Order[] = [];
  const orderMap = new Map<string, Sale[]>();

  todaySales.forEach((sale: Sale) => {
    const orderId = sale.orderId || sale.id; // Use sale.id for single-product sales
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, []);
    }
    orderMap.get(orderId)!.push(sale);
  });

  orderMap.forEach((orderSales, orderId) => {
    const totalAmount = orderSales.reduce(
      (sum: number, s: Sale) => sum + s.amount,
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
          ? t('common.cash')
          : pt === "card"
            ? t('common.card')
            : t('common.transfer'),
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

  const totalBranchProfit = todaySales.reduce(
    (sum, sale) => sum + (sale.seller_profit || 0),
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
            {t('seller.myDailySales')}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Total Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-1 text-sm text-blue-700 dark:text-blue-300">
                  {t('common.total')}
                </div>
                <div className="text-3xl text-blue-900 dark:text-blue-100">
                  {formatCurrency(totalAmount * exchangeRate)}
                </div>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  {t('seller.orderCount', { count: orders.length })}
                </div>
              </div>
              <div className="rounded-full bg-blue-200 dark:bg-blue-800 p-4">
                <DollarSign className="h-10 w-10 text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </Card>

          {totalBranchProfit > 0 && (
            <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="mb-1 text-sm text-emerald-700 dark:text-emerald-300">
                    {t('common.profit')}
                  </div>
                  <div className="text-3xl text-emerald-900 dark:text-emerald-100">
                    {formatCurrency(totalBranchProfit * exchangeRate)}
                  </div>
                </div>
                <div className="rounded-full bg-emerald-200 dark:bg-emerald-800 p-4">
                  <DollarSign className="h-10 w-10 text-emerald-700 dark:text-emerald-300" />
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Orders List */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg dark:text-white">
            {t('seller.allOrders')}
          </h3>
          {orders.length === 0 ? (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">
              {t('messages.noSalesToday')}
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
                            <span className="dark:text-white flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              {isMultiProduct
                                ? t('seller.productCount', { count: order.sales.length })
                                : order.sales[0].productName}
                            </span>
                          </div>
                          {!isMultiProduct && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {t('seller.quantity')}: {order.sales[0].type === "unit"
                                ? `${order.sales[0].quantity} ${t('common.unit')}`
                                : `${(order.sales[0].area || order.sales[0].quantity).toFixed(1)} m²`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {order.paymentTypes.map((pt, idx) => (
                            <Badge
                              key={idx}
                              variant={
                                pt === t('common.cash')
                                  ? "default"
                                  : pt === t('common.card')
                                    ? "secondary"
                                    : "outline"
                              }
                              className={`text-xs ${pt === t('common.cash') ? "bg-green-600 hover:bg-green-700" : ""}`}
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
                        <div className="text-right">
                          <div className="text-lg text-blue-600 dark:text-blue-400">
                            {formatCurrency(order.totalAmount * exchangeRate)}
                          </div>
                          {(() => {
                            const branchProfit = order.sales.reduce(
                              (sum, sale) => sum + (sale.seller_profit || 0),
                              0,
                            );
                            if (branchProfit > 0) {
                              return (
                                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  +{formatCurrency(branchProfit * exchangeRate)}
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
                                  {sale.type === "unit"
                                    ? `${sale.quantity} ${t('common.unit')}`
                                    : `${(sale.area || sale.quantity).toFixed(1)} m²`}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-blue-600 dark:text-blue-400">
                                  {formatCurrency(sale.amount * exchangeRate)}
                                </div>
                                {sale.seller_profit && sale.seller_profit > 0 && (
                                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    +{formatCurrency(sale.seller_profit * exchangeRate)}
                                  </div>
                                )}
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