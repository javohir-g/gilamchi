import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, TrendingUp, Package, DollarSign } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

export function BranchProfitDetail() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [searchParams] = useSearchParams();
  const { sales, products, branches } = useApp();
  const { t } = useLanguage();

  const branch = branches.find((b) => b.id === branchId);

  if (!branch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">{t('messages.branchNotFound')}</p>
          <Button
            onClick={() => navigate("/admin/hisob")}
            className="mt-4"
          >
            {t('common.back')}
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
    return sale.adminProfit || 0;
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
      totalAdminProfit: number;
      totalSellerProfit: number;
      salesCount: number;
    }
  >();

  filteredSales.forEach((sale) => {
    const product = products.find((p) => p.id === sale.productId);
    if (!product) return;

    const profit = calculateDirectorProfit(sale);
    const sellerProfit = sale.sellerProfit || 0;
    const existing = productProfitMap.get(sale.productId);

    if (existing) {
      existing.totalQuantity += sale.quantity;
      existing.totalArea = (existing.totalArea || 0) + (sale.area || 0);
      existing.totalAmount += sale.amount;
      existing.totalProfit += profit;
      existing.totalAdminProfit += (sale.adminProfit || 0);
      existing.totalSellerProfit += sellerProfit;
      existing.salesCount += 1;
    } else {
      productProfitMap.set(sale.productId, {
        product,
        totalQuantity: sale.quantity,
        totalArea: sale.area,
        totalAmount: sale.amount,
        totalProfit: profit,
        totalAdminProfit: (sale.adminProfit || 0),
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
    (sum, sale) => sum + (sale.adminProfit || 0),
    0
  );

  const totalSellerProfit = filteredSales.reduce(
    (sum, sale) => sum + (sale.sellerProfit || 0),
    0
  );

  // 1. Total Stock Value for this branch (Buy Price)
  const branchProducts = products.filter(p => p.branchId === branchId);
  const totalStockValue = branchProducts.reduce((sum, p) => {
    if (p.type === "meter") {
      return sum + (p.buyPrice || 0) * (p.remainingLength || 0);
    } else {
      const qty = p.availableSizes
        ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
        : (p.quantity || 0);
      return sum + (p.buyPrice || 0) * qty;
    }
  }, 0);

  // 2. Total Potential Profit for this branch (Markup if all sold)
  const totalPotentialProfit = branchProducts.reduce((sum, p) => {
    if (p.type === "meter") {
      const margin = (p.sellPricePerMeter || 0) - (p.buyPrice || 0);
      return sum + margin * (p.remainingLength || 0);
    } else {
      const margin = (p.sellPrice || 0) - (p.buyPrice || 0);
      const qty = p.availableSizes
        ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
        : (p.quantity || 0);
      return sum + margin * qty;
    }
  }, 0);

  // 3. Sold Stock Cost for this branch in selected period
  const soldStockCost = filteredSales.reduce((sum, sale) => {
    const product = products.find(p => p.id === sale.productId);
    if (!product) return sum;
    let cost = 0;
    if (sale.type === "meter" || product.type === "meter") {
      cost = (product.buyPrice || 0) * (sale.length || sale.quantity || 0);
    } else {
      cost = (product.buyPrice || 0) * (sale.quantity || 1);
    }
    return sum + cost;
  }, 0);

  const formatCurrency = (amount: number, currency: "USD" | "UZS" = "USD") => {
    if (currency === "UZS") {
      return new Intl.NumberFormat("uz-UZ", {
        style: "currency",
        currency: "UZS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount));
    }
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
        return t('common.today');
      case "week":
        return t('common.week');
      case "month":
        return t('common.month');
      case "custom":
        if (customStart && customEnd) {
          const start = new Date(customStart).toLocaleDateString("uz-UZ");
          const end = new Date(customEnd).toLocaleDateString("uz-UZ");
          return `${start} - ${end}`;
        }
        return t('common.selectedDate');
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
        {/* Financial Summary Grid (Same as Hisob.tsx) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Stock Value */}
          <Card className="p-4 bg-gradient-to-br from-indigo-500 to-indigo-600 border-0 shadow-lg shadow-indigo-500/20 text-white">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-indigo-100 uppercase tracking-wider">
                {t('admin.stockValue')}
              </span>
              <div className="text-xl md:text-2xl font-bold truncate">
                {formatCurrency(totalStockValue)}
              </div>
            </div>
          </Card>

          {/* Card 3: Sold Stock Cost */}
          <Card className="p-4 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 shadow-sm">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                {t('admin.soldStockCost')}
              </span>
              <div className="text-xl md:text-2xl font-bold dark:text-white truncate">
                {formatCurrency(soldStockCost)}
              </div>
            </div>
          </Card>

          {/* Card 2: Potential Profit */}
          <Card className="p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 border-0 shadow-lg shadow-emerald-500/20 text-white">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
                {t('admin.potentialProfit')}
              </span>
              <div className="text-xl md:text-2xl font-bold truncate">
                {formatCurrency(totalPotentialProfit)}
              </div>
            </div>
          </Card>

          {/* Card 4: Actual Profit */}
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 shadow-sm">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {t('admin.actualProfit')}
              </span>
              <div className="text-xl md:text-2xl font-bold dark:text-white truncate">
                {formatCurrency(totalAdminProfit)}
              </div>
            </div>
          </Card>
        </div>

        {/* Info Card with details */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{t('common.summary')}:</p>
              <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                {t('admin.branchProfit')}: {formatCurrency(totalSellerProfit)}
              </Badge>
            </div>
            <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-200">
              <li>• {t('messages.summaryProductsSold').replace('{count}', productProfits.length.toString())}</li>
              <li>• {t('messages.summarySalesCount').replace('{count}', filteredSales.length.toString())}</li>
              <li>• {t('messages.summaryProfitCalc').replace('{total}', formatCurrency(totalAdminProfit + totalSellerProfit)).replace('{admin}', formatCurrency(totalAdminProfit)).replace('{seller}', formatCurrency(totalSellerProfit))}</li>
            </ul>
          </div>
        </Card>



        {/* Detailed Sales History */}
        <div>
          <h3 className="text-sm text-muted-foreground mb-3 px-1 uppercase">
            {t('seller.recentSales')}
          </h3>
          <div className="space-y-3">
            {filteredSales.slice(0, 50).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((sale) => {
              const saleProduct = products.find(p => p.id === sale.productId);
              return (
                <Card key={sale.id} className="p-4 border border-border bg-card">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-medium text-card-foreground">{sale.productName}</div>
                      <div className="text-[10px] text-muted-foreground mt-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full w-fit">
                        {new Date(sale.date).toLocaleString("uz-UZ")}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold mb-0.5">
                        {t('admin.actualProfit')}
                      </div>
                      <div className="font-black text-lg text-blue-600 dark:text-blue-400 leading-none">
                        {formatCurrency(sale.adminProfit || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                    <div className="space-y-0.5">
                      <div className="text-[9px] text-muted-foreground uppercase">{t('admin.stockValue')}</div>
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {formatCurrency(saleProduct?.buyPrice || 0)}
                      </div>
                    </div>
                    <div className="space-y-0.5 text-center">
                      <div className="text-[9px] text-muted-foreground uppercase">{t('admin.branchProfit')}</div>
                      <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                        {formatCurrency(sale.sellerProfit || 0)}
                      </div>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <div className="text-[9px] text-muted-foreground uppercase">{t('seller.soldPrice')}</div>
                      <div className="text-xs font-bold text-card-foreground">
                        {formatCurrency(sale.amount)}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
