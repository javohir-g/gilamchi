import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, TrendingUp, Package, DollarSign } from "lucide-react";

export function BranchProfitDetail() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [searchParams] = useSearchParams();
  const { sales, products, branches } = useApp();

  const branch = branches.find((b) => b.id === branchId);

  if (!branch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">Filial topilmadi</p>
          <Button
            onClick={() => navigate("/admin/hisob")}
            className="mt-4"
          >
            Orqaga
          </Button>
        </Card>
      </div>
    );
  }

  // Get date filter from URL params
  const dateFilter = searchParams.get("filter") || "today";
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  // Filter sales by date and branch
  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let filtered = sales.filter((s) => s.branchId === branchId);

    switch (dateFilter) {
      case "today":
        return filtered.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= today;
        });

      case "week":
        const weekStart = new Date(today);
        const day = today.getDay(); // 0 (Sun) to 6 (Sat)
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        weekStart.setHours(0, 0, 0, 0);
        return filtered.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= weekStart;
        });

      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return filtered.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= monthStart;
        });

      case "custom":
        if (!customStart || !customEnd) return filtered;
        const start = new Date(customStart);
        const end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
        return filtered.filter((sale) => {
          const saleDate = new Date(sale.date);
          return saleDate >= start && saleDate <= end;
        });

      default:
        return filtered;
    }
  };

  const filteredSales = getFilteredSales();

  // Calculate director's profit for each sale
  // Director's profit = Total Sale Amount - Total Cost
  const calculateDirectorProfit = (sale: typeof sales[0]) => {
    const product = products.find((p) => p.id === sale.productId);
    if (!product) return sale.profit || 0;

    let cost = 0;
    if (sale.type === "meter" || product.type === "meter") {
      // For meter products, linear length is the basis for cost (buyPrice is per meter)
      const length = sale.length || sale.quantity || 0;
      cost = (product.buyPrice || 0) * length;
    } else {
      // For unit products (unit quantity)
      cost = (product.buyPrice || 0) * (sale.quantity || 1);
    }

    return sale.amount - cost;
  };

  // Group sales by product
  const productProfitMap = new Map<
    string,
    {
      product: typeof products[0];
      totalQuantity: number;
      totalArea?: number;
      totalAmount: number;
      totalProfit: number;
      totalSellerProfit: number;
      salesCount: number;
    }
  >();

  filteredSales.forEach((sale) => {
    const product = products.find((p) => p.id === sale.productId);
    if (!product) return;

    const profit = calculateDirectorProfit(sale);
    const sellerProfit = sale.seller_profit || 0;
    const existing = productProfitMap.get(sale.productId);

    if (existing) {
      existing.totalQuantity += sale.quantity;
      existing.totalArea = (existing.totalArea || 0) + (sale.area || 0);
      existing.totalAmount += sale.amount;
      existing.totalProfit += profit;
      existing.totalSellerProfit += sellerProfit;
      existing.salesCount += 1;
    } else {
      productProfitMap.set(sale.productId, {
        product,
        totalQuantity: sale.quantity,
        totalArea: sale.area,
        totalAmount: sale.amount,
        totalProfit: profit,
        totalSellerProfit: sellerProfit,
        salesCount: 1,
      });
    }
  });

  const productProfits = Array.from(productProfitMap.values()).sort(
    (a, b) => b.totalSellerProfit - a.totalSellerProfit
  );

  const totalProfit = productProfits.reduce(
    (sum, pp) => sum + pp.totalProfit,
    0
  );

  const totalAdminProfit = filteredSales.reduce(
    (sum, sale) => sum + (sale.admin_profit || 0),
    0
  );

  const totalSellerProfit = filteredSales.reduce(
    (sum, sale) => sum + (sale.seller_profit || 0),
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getDateRangeText = () => {
    switch (dateFilter) {
      case "today":
        return "Bugun";
      case "week":
        return "Bu hafta";
      case "month":
        return "Bu oy";
      case "custom":
        if (customStart && customEnd) {
          const start = new Date(customStart).toLocaleDateString("uz-UZ");
          const end = new Date(customEnd).toLocaleDateString("uz-UZ");
          return `${start} - ${end}`;
        }
        return "Tanlangan sana";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin/hisob")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">
                {branch.name}
              </h1>
              <p className="text-sm text-muted-foreground">{getDateRangeText()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Total Profit Card */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 border-0">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-4 w-4 text-white" />
                <span className="text-xs text-blue-100">Mening foydam</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(totalAdminProfit)}
              </div>
            </div>
          </Card>
          <Card className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-700 dark:to-emerald-800 border-0">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-4 w-4 text-white" />
                <span className="text-xs text-emerald-100">Filiallar foydasi</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(totalSellerProfit)}
              </div>
            </div>
          </Card>
        </div>

        {/* Products Breakdown */}
        <div>
          <h3 className="text-sm text-muted-foreground mb-3 px-1">
            MAHSULOTLAR BO'YICHA FOYDA
          </h3>

          {productProfits.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Bu davrda savdo amalga oshirilmagan
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {productProfits.map((pp) => {
                const averageProfitPerUnit = pp.totalProfit / (pp.totalArea || pp.totalQuantity || 1);
                const percentageOfTotal =
                  totalProfit > 0
                    ? ((pp.totalProfit / totalProfit) * 100).toFixed(1)
                    : 0;

                return (
                  <Card
                    key={pp.product.id}
                    className="p-4 border border-border bg-card"
                  >
                    <div className="space-y-3">
                      {/* Product Name & Total */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            to={`/seller/edit-product/${pp.product.id}`}
                            className="font-medium text-card-foreground mb-1 hover:underline hover:text-blue-600 block w-fit"
                          >
                            {pp.product.name}
                          </Link>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Package className="h-3.5 w-3.5" />
                            <span>
                              {pp.product.type === "unit"
                                ? `${pp.totalQuantity} dona`
                                : `${(pp.totalArea || pp.totalQuantity).toFixed(1)} m²`
                              } sotildi
                            </span>
                            <span>•</span>
                            <span>{pp.salesCount} ta savdo</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-card-foreground">
                            {formatCurrency(pp.totalSellerProfit)}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-[10px] mt-1 border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50"
                          >
                            Filial foydasi
                          </Badge>
                        </div>
                      </div>

                      {/* Profit Details */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Завод нархи
                          </div>
                          <div className="text-sm font-medium text-card-foreground">
                            {formatCurrency(pp.product.buyPrice)}
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-xs text-muted-foreground">
                            Касса нархи
                          </div>
                          <div className="text-sm font-medium text-card-foreground">
                            {formatCurrency(pp.product.type === "unit" ? pp.product.sellPrice : (pp.product.sellPricePerMeter || 0))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Сотилган нархи (о'рт)
                          </div>
                          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {formatCurrency(pp.totalAmount / (pp.totalArea || pp.totalQuantity || 1))}
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-xs text-muted-foreground">
                            O'rtacha foyda
                          </div>
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(averageProfitPerUnit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary Card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-2">Xulosa:</p>
            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-200">
              <li>• Jami {productProfits.length} xil mahsulot sotildi</li>
              <li>• Jami {filteredSales.length} ta savdo amalga oshirildi</li>
              <li>
                • Umumiy foyda: {formatCurrency(totalProfit)} (Mening: {formatCurrency(totalAdminProfit)}, Filiallar: {formatCurrency(totalSellerProfit)})
              </li>
            </ul>
          </div>
        </Card>

        {/* Detailed Sales History */}
        <div>
          <h3 className="text-sm text-muted-foreground mb-3 px-1">
            YAQINDAGI SAVDOLAR
          </h3>
          <div className="space-y-3">
            {filteredSales.slice(0, 50).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((sale) => (
              <Card key={sale.id} className="p-4 border border-border bg-card">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium text-card-foreground">{sale.productName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sale.date).toLocaleString("uz-UZ")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(sale.amount)}
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-100">
                      +{formatCurrency(sale.seller_profit || 0)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-muted-foreground">
                    Men: <span className="text-blue-600">{formatCurrency(sale.admin_profit || 0)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Filial: <span className="text-emerald-600">{formatCurrency(sale.seller_profit || 0)}</span>
                  </span>
                  <span className="text-muted-foreground">
                    To'lov: <span className="font-medium uppercase">{sale.paymentType}</span>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
