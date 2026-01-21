import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
        weekStart.setDate(today.getDate() - today.getDay());
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
      totalProfit: number;
      salesCount: number;
    }
  >();

  filteredSales.forEach((sale) => {
    const product = products.find((p) => p.id === sale.productId);
    if (!product) return;

    const profit = calculateDirectorProfit(sale);
    const existing = productProfitMap.get(sale.productId);

    if (existing) {
      existing.totalQuantity += sale.quantity;
      existing.totalArea = (existing.totalArea || 0) + (sale.area || 0);
      existing.totalProfit += profit;
      existing.salesCount += 1;
    } else {
      productProfitMap.set(sale.productId, {
        product,
        totalQuantity: sale.quantity,
        totalArea: sale.area,
        totalProfit: profit,
        salesCount: 1,
      });
    }
  });

  const productProfits = Array.from(productProfitMap.values()).sort(
    (a, b) => b.totalProfit - a.totalProfit
  );

  const totalProfit = productProfits.reduce(
    (sum, pp) => sum + pp.totalProfit,
    0
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
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
        <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 border-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-white" />
                <span className="text-sm text-blue-100">Jami foyda</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {formatCurrency(totalProfit)}
              </div>
              <div className="text-sm text-blue-100 mt-1">
                {filteredSales.length} ta savdodan
              </div>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </Card>

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
                          <div className="font-medium text-card-foreground mb-1">
                            {pp.product.name}
                          </div>
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
                            {formatCurrency(pp.totalProfit)}
                          </div>
                          <Badge
                            variant="outline"
                            className="text-xs mt-1 border-blue-500 text-blue-600 dark:text-blue-400"
                          >
                            {percentageOfTotal}%
                          </Badge>
                        </div>
                      </div>

                      {/* Profit Details */}
                      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Xarid narxi (donasiga)
                          </div>
                          <div className="text-sm font-medium text-card-foreground">
                            {formatCurrency(pp.product.buyPrice)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {pp.product.type === "unit" ? "Sotish narxi" : "Sotish (metr)"}
                          </div>
                          <div className="text-sm font-medium text-card-foreground">
                            {formatCurrency(pp.product.type === "unit" ? pp.product.sellPrice : (pp.product.sellPricePerMeter || 0))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            O'rtacha foyda
                          </div>
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(averageProfitPerUnit)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            {pp.product.type === "unit" ? "O'rtacha dona" : "O'rtacha m²"}
                          </div>
                          <div className="text-sm font-medium text-card-foreground">
                            {pp.product.type === "unit"
                              ? `${(pp.totalQuantity / pp.salesCount).toFixed(1)} dona`
                              : `${((pp.totalArea || pp.totalQuantity) / pp.salesCount).toFixed(1)} m²`
                            }
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
                • Direktor uchun umumiy foyda: {formatCurrency(totalProfit)}
              </li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
