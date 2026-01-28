import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  MapPin,
  Package,
  ChevronRight,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import { Separator } from "../ui/separator";

// Utility to safely extract area from both "2x3" and new size objects
const getSizeStr = (s: any): string => {
  if (typeof s === 'string') return s;
  if (s && typeof s === 'object' && s.size) return s.size;
  return "";
};

const parseSize = (sizeStr: string) => {
  // Handles x, X, ×, Г— and any other weird encodings
  const parts = sizeStr.split(/[^0-9.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      width: parts[0].trim(),
      height: parts[1].trim()
    };
  }
  return null;
};

export const Inventory: React.FC = () => {
  const { products, user, branches, collections } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>("");
  const [selectedWidth, setSelectedWidth] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const isAdmin = user?.role === "admin";
  const filterBranch = isAdmin ? selectedBranch : user?.branchId;

  // Sync collections - select the first one if not set
  useEffect(() => {
    if (collections.length > 0 && !selectedCollection) {
      setSelectedCollection(collections[0].name);
    }
  }, [collections, selectedCollection]);

  // Sync category type - select the first one if not set
  useEffect(() => {
    if (!selectedCategoryType) {
      setSelectedCategoryType("Gilamlar");
    }
  }, [selectedCategoryType]);

  // 1. Get available widths for the selected collection and category
  const availableWidths = useMemo(() => {
    if (!selectedCollection || !selectedCategoryType) return [];

    const targetBranchId = isAdmin ? filterBranch : user?.branchId;
    const relevantProducts = products.filter((p) => {
      const isCorrectBranch = targetBranchId === "all" || String(p.branchId) === String(targetBranchId);
      const matchesCollection = (p.collection || "Kolleksiyasiz") === selectedCollection;

      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory = p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory = p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory = p.category === "Kovrik" && p.type === "unit";
      }

      return isCorrectBranch && matchesCollection && matchesCategory;
    });

    const widthSet = new Set<string>();
    relevantProducts.forEach((p) => {
      if (p.availableSizes && p.availableSizes.length > 0) {
        p.availableSizes.forEach((s: any) => {
          const sStr = getSizeStr(s);
          const parts = parseSize(sStr);
          if (parts) {
            widthSet.add(parts.width);
          }
        });
      } else {
        widthSet.add("O'lchamsiz");
      }
    });

    return Array.from(widthSet).sort((a, b) => parseFloat(a) - parseFloat(b));
  }, [products, user?.branchId, selectedCollection, selectedCategoryType, isAdmin, filterBranch]);

  // Sync width selection
  useEffect(() => {
    if (availableWidths.length > 0 && !selectedWidth) {
      setSelectedWidth(availableWidths[0]);
    } else if (availableWidths.length === 0) {
      setSelectedWidth("");
    }
  }, [availableWidths, selectedWidth]);

  // 2. Get available full sizes (heights) for the selected width
  const availableSizes = useMemo(() => {
    if (!selectedWidth || !selectedCollection || !selectedCategoryType) return [];

    const targetBranchId = isAdmin ? filterBranch : user?.branchId;
    const relevantProducts = products.filter((p) => {
      const isCorrectBranch = targetBranchId === "all" || String(p.branchId) === String(targetBranchId);
      const matchesCollection = (p.collection || "Kolleksiyasiz") === selectedCollection;

      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory = p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory = p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory = p.category === "Kovrik" && p.type === "unit";
      }

      return isCorrectBranch && matchesCollection && matchesCategory;
    });

    const matchingSizes = new Set<string>();
    relevantProducts.forEach((p) => {
      if (selectedWidth === "O'lchamsiz") {
        if (!p.availableSizes || p.availableSizes.length === 0) {
          matchingSizes.add("O'lchamsiz");
        }
      } else if (p.availableSizes) {
        p.availableSizes.forEach((s: any) => {
          const sStr = getSizeStr(s);
          const parts = parseSize(sStr);
          if (parts && parts.width === selectedWidth) {
            matchingSizes.add(sStr);
          }
        });
      }
    });

    return Array.from(matchingSizes).sort((a, b) => {
      const getArea = (s: string) => {
        const parts = parseSize(s);
        if (parts) return parseFloat(parts.width) * parseFloat(parts.height);
        return 0;
      };
      return getArea(a) - getArea(b);
    });
  }, [products, user?.branchId, selectedCollection, selectedWidth, selectedCategoryType, isAdmin, filterBranch]);

  useEffect(() => {
    if (availableSizes.length > 0 && !selectedSize) {
      setSelectedSize(availableSizes[0]);
    } else if (availableSizes.length === 0) {
      setSelectedSize("");
    }
  }, [availableSizes, selectedSize]);

  // 3. Final filtered products
  const filteredProducts = useMemo(() => {
    const targetBranchId = isAdmin ? selectedBranch : user?.branchId;

    return products.filter((p) => {
      const isCorrectBranch = targetBranchId === "all" || String(p.branchId) === String(targetBranchId);
      const matchesSearch = p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.collection?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCollection = !selectedCollection || p.collection === selectedCollection;

      const sizeStrMatch = !selectedSize || (selectedSize === "O'lchamsiz"
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.some(s => getSizeStr(s) === selectedSize));

      let categoryMatch = false;
      if (!selectedCategoryType) categoryMatch = true;
      else if (selectedCategoryType === "Gilamlar") categoryMatch = p.category === "Gilamlar" && p.type === "unit";
      else if (selectedCategoryType === "Metrajlar") categoryMatch = p.category === "Metrajlar" || p.type === "meter";
      else if (selectedCategoryType === "Ovalniy") categoryMatch = p.category === "Ovalniy" && p.type === "unit";
      else if (selectedCategoryType === "Kovrik") categoryMatch = p.category === "Kovrik" && p.type === "unit";

      return isCorrectBranch && matchesSearch && matchesCollection && sizeStrMatch && categoryMatch;
    });
  }, [products, searchQuery, selectedBranch, selectedCollection, selectedSize, selectedCategoryType, user?.branchId, isAdmin]);

  return (
    <div className="flex flex-col h-full bg-background space-y-4 p-4 pb-24 lg:pb-8">
      {/* Header & Search */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Ombor</h1>
          <div className="flex items-center gap-2">
            {isAdmin && branches && (
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Filial tanlang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Barcha filiallar</SelectItem>
                  {branches.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            placeholder="Kolleksiya yoki kod bo'yicha qidirish..."
            className="pl-9 h-11 bg-card border-none shadow-sm focus-visible:ring-1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Filters UI */}
      <div className="flex flex-col gap-6">
        {/* Collections Scroll */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Kolleksiyalar
            </h3>
            <Badge variant="outline" className="font-mono text-[10px] bg-muted/30">
              {collections.length} ta
            </Badge>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-3">
              {collections.map((coll) => (
                <Button
                  key={coll.id}
                  variant={selectedCollection === coll.name ? "default" : "outline"}
                  className={`h-9 px-4 rounded-full transition-all ${selectedCollection === coll.name
                    ? "shadow-md shadow-primary/20 scale-105"
                    : "hover:bg-accent/50 text-muted-foreground"
                    }`}
                  onClick={() => setSelectedCollection(coll.name)}
                >
                  {coll.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Categories Tabs */}
        <div className="space-y-3">
          <h1 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
            <Filter className="h-4 w-4" />
            Kategoriyalar
          </h1>
          <Tabs value={selectedCategoryType} onValueChange={setSelectedCategoryType}>
            <TabsList className="w-full grid grid-cols-4 h-11 bg-card p-1 shadow-sm">
              <TabsTrigger value="Gilamlar" className="rounded-sm text-xs">Gilam</TabsTrigger>
              <TabsTrigger value="Metrajlar" className="rounded-sm text-xs">Metraj</TabsTrigger>
              <TabsTrigger value="Ovalniy" className="rounded-sm text-xs">Oval</TabsTrigger>
              <TabsTrigger value="Kovrik" className="rounded-sm text-xs">Kovrik</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Size Filters Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
              Eni
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {availableWidths.map((w) => (
                <Button
                  key={w}
                  size="sm"
                  variant={selectedWidth === w ? "default" : "outline"}
                  className={`h-10 text-xs font-medium border-none bg-card shadow-sm transition-all ${selectedWidth === w ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50"
                    }`}
                  onClick={() => setSelectedWidth(w)}
                >
                  {w === "O'lchamsiz" ? w : `${w} m`}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 px-1">
              Bo'yi
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {availableSizes.length > 0 ? (
                availableSizes.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={selectedSize === s ? "default" : "outline"}
                    className={`h-14 flex flex-col items-center justify-center border-none bg-card shadow-sm transition-all text-xs ${selectedSize === s ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-accent/50"
                      }`}
                    onClick={() => setSelectedSize(s)}
                  >
                    <span className="font-bold">{s}</span>
                    <span className="text-[9px] opacity-70">O'lcham</span>
                  </Button>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed border-muted-foreground/20 text-muted-foreground">
                  <Package className="h-5 w-5 mb-1 opacity-40" />
                  <span className="text-[10px]">Mavjud emas</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator className="my-2 bg-muted/50" />

      {/* Results Count */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold">Maxsulotlar</h2>
        <Badge className="bg-primary/10 text-primary border-none text-[10px]">
          {filteredProducts.length} ta natija
        </Badge>
      </div>

      {/* Product List */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <Card
            key={p.id}
            className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
            onClick={() => setSelectedProduct(p)}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={p.photo}
                alt={p.code}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center translate-y-4 group-hover:translate-y-0 transition-transform opacity-0 group-hover:opacity-100">
                <Badge className="bg-white/90 text-black border-none text-[10px]">
                  Batafsil
                </Badge>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-sm truncate leading-none">
                    {p.code}
                  </h3>
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {p.type === "meter" ? "Metr" : "Dona"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {p.collection}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[12px] font-bold text-foreground">
                    {p.sellPrice.toLocaleString()} <small className="text-[9px] font-normal opacity-70">so'm</small>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
          <div className="bg-muted p-6 rounded-full">
            <Search className="h-10 w-10 opacity-20" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">Hech narsa topilmadi</p>
            <p className="text-xs opacity-60">Qidiruv kriteriyalarini o'zgartirib ko'ring</p>
          </div>
        </div>
      )}

      {/* Product Details Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none gap-0">
          {selectedProduct && (
            <>
              <div className="relative aspect-video">
                <img
                  src={selectedProduct.photo}
                  alt={selectedProduct.code}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary/90 text-white border-none text-[10px]">
                      {selectedProduct.category}
                    </Badge>
                    <Badge variant="outline" className="text-white border-white/20 text-[10px] bg-white/10 backdrop-blur-sm">
                      {selectedProduct.type === 'unit' ? 'Dona' : 'Metr'}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-bold">{selectedProduct.code}</h2>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-xl space-y-1 border border-muted/50">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Sotish narxi</p>
                    <p className="text-lg font-black text-primary">
                      {selectedProduct.sellPrice.toLocaleString()} <small className="text-[10px] font-normal">so'm</small>
                    </p>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-xl space-y-1 border border-muted/50">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Kolleksiya</p>
                    <p className="text-lg font-black">{selectedProduct.collection || "Yo'q"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-widest">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Zaxira holati
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Package className="h-4 w-4 text-primary" />
                        Jami miqdor
                      </span>
                      <span className="font-bold flex items-center gap-1">
                        {selectedProduct.type === 'unit'
                          ? `${selectedProduct.quantity} dona`
                          : `${selectedProduct.remainingLength} m / ${selectedProduct.totalLength} m`}
                      </span>
                    </div>

                    {selectedProduct.availableSizes && selectedProduct.availableSizes.length > 0 && (
                      <div className="bg-muted/30 rounded-xl p-4 border border-muted/50">
                        <div className="flex items-center gap-2 mb-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          <ChevronRight className="h-3.5 w-3.5" />
                          O'lchamlar bo'yicha
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.availableSizes.map((s: any, i: number) => {
                            const name = getSizeStr(s);
                            const qty = typeof s === 'object' ? s.quantity : null;
                            return (
                              <Badge
                                key={i}
                                variant="outline"
                                className="bg-card/80 border-muted/50 px-3 py-1.5 flex items-center gap-2"
                              >
                                <span className="font-bold text-xs">{name}</span>
                                {qty !== null && (
                                  <>
                                    <Separator orientation="vertical" className="h-3 bg-muted-foreground/30" />
                                    <span className="text-[10px] text-primary font-bold">{qty} dona</span>
                                  </>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[11px] bg-primary/5 text-primary/70 p-3 rounded-lg border border-primary/10">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        Mahsulot <strong>{branches.find((b: any) => b.id === selectedProduct.branchId)?.name || "Noma'lum filial"}</strong>da saqlanmoqda
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-primary/20 hover:bg-primary/5 text-primary font-bold transition-all flex items-center justify-center gap-2 group"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Yopish
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};