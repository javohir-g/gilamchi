import { useState, useEffect } from "react";
import { ChevronLeft, Package, LayoutGrid, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { getImageUrl } from "../../../services/api";

export default function WarehouseReport() {
    const navigate = useNavigate();
    const { products, branches, collections: ctxCollections } = useApp();
    const { t } = useLanguage();

    // States
    const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || "");
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedBranchId && branches.length > 0) {
            setSelectedBranchId(branches[0].id);
        }
    }, [branches, selectedBranchId]);

    // Collection Icons Map
    const collectionIcons: Record<string, string> = {
        Lara: "🌺",
        Emili: "🌸",
        Melord: "👑",
        Mashad: "🎨",
        Izmir: "✨",
        Isfahan: "🏛️",
        Prestige: "💎",
        Sultan: "🕌",
    };

    const getCollectionIcon = (name: string) => collectionIcons[name] || "📦";

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

    const getSizeStr = (s: any): string => {
        if (typeof s === 'string') return s;
        if (typeof s === 'number') return String(s);
        if (s && typeof s === 'object' && s.size) return String(s.size);
        return "";
    };

    // Calculate data for current view
    const branchProducts = products.filter((p) => p.branchId === selectedBranchId);

    const branchStockValue = branchProducts.reduce((sum, p) => {
        if (p.type === "meter") {
            return sum + (p.buyPrice || 0) * (p.remainingLength || 0);
        } else {
            const qty = p.availableSizes
                ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
                : (p.quantity || 0);
            return sum + (p.buyPrice || 0) * qty;
        }
    }, 0);

    const collectionBreakdown = branchProducts.reduce((acc, p) => {
        const collName = p.collection || t('seller.withoutCollection');
        let stockValue = 0;
        let potentialProfit = 0;

        if (p.type === "meter") {
            const qty = p.remainingLength || 0;
            stockValue = (p.buyPrice || 0) * qty;
            const margin = (p.sellPricePerMeter || 0) - (p.buyPrice || 0);
            potentialProfit = margin * qty;
        } else {
            const qty = p.availableSizes
                ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
                : (p.quantity || 0);
            stockValue = (p.buyPrice || 0) * qty;
            const margin = (p.sellPrice || 0) - (p.buyPrice || 0);
            potentialProfit = margin * qty;
        }

        if (!acc[collName]) {
            acc[collName] = { stockValue: 0, potentialProfit: 0 };
        }
        acc[collName].stockValue += stockValue;
        acc[collName].potentialProfit += potentialProfit;
        return acc;
    }, {} as Record<string, { stockValue: number; potentialProfit: number }>);

    const collections = Object.entries(collectionBreakdown)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.stockValue - a.stockValue);

    // Products for specific collection
    const filteredProducts = selectedCollection
        ? branchProducts.filter(p => (p.collection || t('seller.withoutCollection')) === selectedCollection)
        : [];

    const totalStockValue = branches.reduce((sum, branch) => {
        const bp = products.filter(p => p.branchId === branch.id);
        return sum + bp.reduce((s, p) => {
            if (p.type === "meter") {
                return s + (p.buyPrice || 0) * (p.remainingLength || 0);
            } else {
                const qty = p.availableSizes
                    ? p.availableSizes.reduce((sz_sum: number, sz: any) => sz_sum + (sz.quantity || 0), 0)
                    : (p.quantity || 0);
                return s + (p.buyPrice || 0) * qty;
            }
        }, 0);
    }, 0);

    const branchPotentialProfit = branchProducts.reduce((sum, p) => {
        let potentialProfit = 0;
        if (p.type === "meter") {
            const qty = p.remainingLength || 0;
            const margin = (p.sellPricePerMeter || 0) - (p.buyPrice || 0);
            potentialProfit = margin * qty;
        } else {
            const qty = p.availableSizes
                ? p.availableSizes.reduce((s: number, sz: any) => s + (sz.quantity || 0), 0)
                : (p.quantity || 0);
            const margin = (p.sellPrice || 0) - (p.buyPrice || 0);
            potentialProfit = margin * qty;
        }
        return sum + potentialProfit;
    }, 0);

    return (
        <div className="min-h-screen bg-background pb-28">
            {/* Header matching ManageCollections.tsx style */}
            <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
                <div className="p-4 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => selectedCollection ? setSelectedCollection(null) : navigate("/admin/hisob")}
                        className="-ml-2"
                    >
                        {selectedCollection ? <ArrowLeft className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-xl text-card-foreground font-bold">
                            {selectedCollection || t('admin.stockValue')}
                        </h1>
                        {!selectedCollection && (
                            <p className="text-xs text-muted-foreground">
                                {t('common.total')}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(totalStockValue)}</span>
                            </p>
                        )}
                        {selectedCollection && (
                            <p className="text-xs text-muted-foreground">{branches.find(b => b.id === selectedBranchId)?.name}</p>
                        )}
                    </div>
                </div>

                {/* Branch Selection Tabs - matching ManageCollections design */}
                {!selectedCollection && branches.length > 0 && (
                    <div className="px-4 pb-2">
                        <Tabs
                            value={selectedBranchId}
                            onValueChange={setSelectedBranchId}
                            className="w-full"
                        >
                            <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${branches.length}, 1fr)` }}>
                                {branches.map(branch => (
                                    <TabsTrigger key={branch.id} value={branch.id} className="text-xs sm:text-sm">
                                        {branch.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-4">
                {!selectedCollection ? (
                    // COLLECTION LIST VIEW
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <div className="text-sm font-bold opacity-60 uppercase tracking-widest flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600"></span>
                                {branches.find(b => b.id === selectedBranchId)?.name}
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="text-sm font-black text-indigo-600 leading-none">
                                    {formatCurrency(branchStockValue)}
                                </div>
                                <div className="text-[11px] font-bold text-emerald-600 mt-1 leading-none">
                                    {formatCurrency(branchPotentialProfit)}
                                </div>
                            </div>
                        </div>

                        {collections.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>{t('messages.noData')}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {collections.map((col, idx) => (
                                    <Card
                                        key={idx}
                                        className="border border-border bg-card shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all active:scale-[0.98]"
                                        onClick={() => setSelectedCollection(col.name)}
                                    >
                                        <div className="p-4 flex items-center gap-4">
                                            <div className="text-4xl">{getCollectionIcon(col.name)}</div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-card-foreground">
                                                    {col.name}
                                                </h3>
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                                    {formatCurrency(col.stockValue)}
                                                </div>
                                                <div className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 leading-none">
                                                    {formatCurrency(col.potentialProfit)}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // PRODUCT LIST VIEW (Drill-down Style matched with Inventory.tsx)
                    <div className="grid grid-cols-2 gap-3 pb-8 animate-in fade-in slide-in-from-right-4 duration-300">
                        {filteredProducts.map((product) => {
                            let stockPercentage = 0;
                            let currentStock = 0;
                            let maxStock = 1;

                            if (product.type === "unit") {
                                currentStock = product.quantity || 0;
                                maxStock = product.maxQuantity || product.quantity || 1;
                                stockPercentage = (currentStock / maxStock) * 100;
                            } else {
                                currentStock = product.remainingLength || 0;
                                maxStock = product.totalLength || product.remainingLength || 1;
                                stockPercentage = (currentStock / maxStock) * 100;
                            }

                            let progressColor = "bg-green-500";
                            if (stockPercentage <= 25) progressColor = "bg-red-500";
                            else if (stockPercentage <= 50) progressColor = "bg-yellow-500";

                            return (
                                <Card
                                    key={product.id}
                                    className="flex flex-col h-full overflow-hidden border border-border bg-card transition-all hover:shadow-md"
                                >
                                    <div className="aspect-[4/5] relative overflow-hidden bg-muted">
                                        <img
                                            src={getImageUrl(product.photo)}
                                            alt={product.code}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                                        <div className="space-y-1.5">
                                            <h3 className="text-[12px] font-bold text-foreground line-clamp-1">
                                                {product.artikul || product.code}
                                            </h3>

                                            {product.availableSizes && product.availableSizes.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {product.availableSizes.map((s: any, i: number) => (
                                                        <Badge
                                                            key={i}
                                                            variant="secondary"
                                                            className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-[9px] px-1.5 py-0 h-4"
                                                        >
                                                            {getSizeStr(s)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-[10px]">
                                                    <span className="text-muted-foreground">{t('product.inStock')}:</span>
                                                    <span className="font-bold text-foreground">
                                                        {product.type === "unit" ? (
                                                            <>{product.quantity} {t('product.unit')}</>
                                                        ) : (
                                                            <>{product.remainingLength} {t('common.meter_short')}</>
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${progressColor} transition-all duration-300`}
                                                        style={{ width: `${stockPercentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-border/50">
                                            {(() => {
                                                const col = ctxCollections.find((c: any) => c.name === product.collection);
                                                const rate = col?.price_per_sqm || col?.price_usd_per_sqm;
                                                const stockValue = product.type === 'unit'
                                                    ? (product.buyPrice || 0) * (product.availableSizes?.reduce((sum: number, sz: any) => sum + (sz.quantity || 0), 0) || 0)
                                                    : (product.buyPrice || 0) * (product.remainingLength || 0);

                                                return (
                                                    <div className="flex flex-col">
                                                        {rate && (product.category === "Gilamlar" || product.category === "Metrajlar") && (
                                                            <div className="text-[9px] font-bold text-muted-foreground mb-0.5">
                                                                ${rate}/m²
                                                            </div>
                                                        )}
                                                        <div className="text-indigo-600 dark:text-indigo-400 font-black text-[12px]">
                                                            {formatCurrency(stockValue)}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-2 text-center py-12 text-muted-foreground">
                                <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p>{t('messages.noData')}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
