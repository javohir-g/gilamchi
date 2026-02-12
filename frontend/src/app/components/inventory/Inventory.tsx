import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ArrowRight,
  Package,
  MoreVertical,
  Edit,
  ArrowRightLeft,
  Trash2,
  Settings,
  Ruler,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  useApp,
  Product,
  Category,
} from "../../context/AppContext";
import { BottomNav } from "../shared/BottomNav";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

type ViewMode =
  | "categories"
  | "collections"
  | "widths"
  | "heights"
  | "products";
type CategoryType =
  | "Gilamlar"
  | "Metrajlar"
  | "Ovalniy"
  | "Kovrik";

// Utility to safely extract size string from both string and object formats
// Utility to safely extract size string from both string and object formats
const getSizeStr = (s: any): string => {
  if (typeof s === 'string') return s;
  if (typeof s === 'number') return String(s);
  if (s && typeof s === 'object' && s.size) return String(s.size);
  return "";
};

// Robust size parsing handling various encodings of the multiplication sign
const parseSize = (sizeStr: any) => {
  if (!sizeStr || typeof sizeStr !== 'string') return null;
  const parts = sizeStr.split(/[^0-9.]+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      width: parts[0].trim(),
      height: parts[1].trim()
    };
  }
  return null;
};

export function Inventory() {
  const navigate = useNavigate();
  const {
    products,
    branches,
    user,
    updateProduct,
    deleteProduct,
    collections,
  } = useApp();
  const { t } = useLanguage();

  // Admin / General State
  const [filterBranch, setFilterBranch] = useState("all");

  // Seller Workflow State
  const [viewMode, setViewMode] =
    useState<ViewMode>("categories");
  const [selectedCollection, setSelectedCollection] = useState<
    string | null
  >(null);
  const [selectedWidth, setSelectedWidth] = useState<
    string | null
  >(null);
  const [selectedSize, setSelectedSize] = useState<
    string | null
  >(null);
  const [selectedCategoryType, setSelectedCategoryType] =
    useState<CategoryType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sizeSearchQuery, setSizeSearchQuery] = useState("");

  // Admin Actions State
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [productToMove, setProductToMove] =
    useState<Product | null>(null);
  const [targetBranchId, setTargetBranchId] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);
  const [productToDelete, setProductToDelete] =
    useState<Product | null>(null);

  const isAdmin = user?.role === "admin";

  // Collection Icons Map
  const collectionIcons: Record<string, string> = {
    Lara: "🏺",
    Emili: "🌸",
    Melord: "🤴",
    Mashad: "🎨",
    Izmir: "✈️",
    Isfahan: "🕌",
    Prestige: "💎",
    Sultan: "👳",
  };

  const getCollectionIcon = (name: string) =>
    collectionIcons[name] || "📦";

  // Category Icons and Colors Map
  const categoryConfig: Record<
    CategoryType,
    { icon: string; color: string; bgColor: string }
  > = {
    Gilamlar: {
      icon: "🧶",
      color: "text-blue-700 dark:text-blue-400",
      bgColor:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
    Metrajlar: {
      icon: "📏",
      color: "text-blue-700 dark:text-blue-400",
      bgColor:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
    Ovalniy: {
      icon: "⭕",
      color: "text-blue-700 dark:text-blue-400",
      bgColor:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
    Kovrik: {
      icon: "🟦",
      color: "text-blue-700 dark:text-blue-400",
      bgColor:
        "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
  };

  // --- Unified Logic ---

  // 1. Get unique collections filtered by category
  const filteredCollectionNames = useMemo(() => {
    if (!selectedCategoryType) return [];

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    const relevantProducts = products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);

      // Category match logic
      const matchesCategory = p.category === selectedCategoryType || (selectedCategoryType === "Metrajlar" && p.type === "meter");

      return isCorrectBranch && matchesCategory;
    });

    const uniqueCollections = Array.from(
      new Set(
        relevantProducts
          .map((p) => p.collection || "Kolleksiyasiz")
      ),
    ) as string[];
    return uniqueCollections.sort((a, b) => {
      if (a === "Kolleksiyasiz") return 1;
      if (b === "Kolleksiyasiz") return -1;
      return a.localeCompare(b);
    });
  }, [
    products,
    user?.branchId,
    isAdmin,
    filterBranch,
    selectedCategoryType,
  ]);

  // Helper to count items in a category
  const getCategoryCount = (categoryType: CategoryType) => {
    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    return products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);

      const matchesCategory = p.category === categoryType || (categoryType === "Metrajlar" && p.type === "meter");

      return isCorrectBranch && matchesCategory;
    }).length;
  };

  // Helper to count items in a collection
  const getCollectionCount = (collectionName: string) => {
    if (!selectedCategoryType) return 0;

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    return products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);
      const matchesCollection = (p.collection || t('seller.withoutCollection')) === collectionName;

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

      return (
        isCorrectBranch && matchesCollection && matchesCategory
      );
    }).length;
  };

  // 2. Get available widths for the selected collection and category
  const widthsForCollection = useMemo(() => {
    if (!selectedCollection || !selectedCategoryType) return [];

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    const relevantProducts = products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);
      const matchesCollection =
        (p.collection || t('seller.withoutCollection')) === selectedCollection;

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

      return (
        isCorrectBranch && matchesCollection && matchesCategory
      );
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
        widthSet.add(t('seller.withoutSize'));
      }
    });

    return Array.from(widthSet).sort((a, b) => {
      return parseFloat(a) - parseFloat(b);
    });
  }, [
    products,
    user?.branchId,
    selectedCollection,
    selectedCategoryType,
    isAdmin,
    filterBranch,
  ]);

  // Helper to get product count for a specific width
  const getProductCountForWidth = (width: string) => {
    if (!selectedCollection || !selectedCategoryType) return 0;

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    return products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);
      const matchesCollection =
        (p.collection || t('seller.withoutCollection')) === selectedCollection;

      const hasWidth = width === t('seller.withoutSize')
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.some(
          (s: any) => {
            const parts = parseSize(getSizeStr(s));
            return parts && parts.width === width;
          }
        );

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

      return (
        isCorrectBranch &&
        matchesCollection &&
        hasWidth &&
        matchesCategory
      );
    }).length;
  };

  // Helper to get total quantity for a specific width
  const getTotalQuantityForWidth = (width: string) => {
    if (!selectedCollection || !selectedCategoryType) return 0;

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    const matchingProducts = products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);
      const matchesCollection =
        (p.collection || t('seller.withoutCollection')) === selectedCollection;

      const hasWidth = width === t('seller.withoutSize')
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.some(
          (s: any) => {
            const parts = parseSize(getSizeStr(s));
            return parts && parts.width === width;
          }
        );

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

      return (
        isCorrectBranch &&
        matchesCollection &&
        hasWidth &&
        matchesCategory
      );
    });

    return matchingProducts.reduce((total, p) => {
      if (p.type === "unit") {
        return total + (p.quantity || 0);
      } else {
        return total + (p.remainingLength || 0);
      }
    }, 0);
  };

  // 3. Get available heights for the selected width and category type
  const heightsForWidth = useMemo(() => {
    if (!selectedWidth || !selectedCategoryType) return [];

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    const relevantProducts = products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);
      const matchesCollection =
        (p.collection || t('seller.withoutCollection')) === selectedCollection;

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

      return (
        isCorrectBranch && matchesCollection && matchesCategory
      );
    });

    const matchingSizes = new Set<string>();
    relevantProducts.forEach((p) => {
      if (selectedWidth === t('seller.withoutSize')) {
        if (!p.availableSizes || p.availableSizes.length === 0) {
          matchingSizes.add(t('seller.withoutSize'));
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
  }, [
    products,
    user?.branchId,
    selectedCollection,
    selectedWidth,
    selectedCategoryType,
    isAdmin,
    filterBranch,
  ]);

  // Helper to get total quantity for a specific size (height)
  const getTotalQuantityForSize = (size: string) => {
    if (!selectedCollection || !selectedCategoryType) return 0;

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    const matchingProducts = products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);
      const matchesCollection =
        (p.collection || t('seller.withoutCollection')) === selectedCollection;
      const hasSize = size === t('seller.withoutSize')
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.some(s => getSizeStr(s) === size);

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

      return (
        isCorrectBranch &&
        matchesCollection &&
        hasSize &&
        matchesCategory
      );
    });

    return matchingProducts.reduce((total, p) => {
      if (p.type === "unit") {
        return total + (p.quantity || 0);
      } else {
        return total + (p.remainingLength || 0);
      }
    }, 0);
  };

  // 4. Get final products based on selection
  const finalProducts = useMemo(() => {
    if (!selectedCategoryType) return [];

    return products.filter((p) => {
      const targetBranchId = isAdmin
        ? filterBranch
        : user?.branchId;
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);

      const matchesCollection = !selectedCollection || String(p.collection || t('seller.withoutCollection')) === selectedCollection;
      const hasSize = !selectedSize || (selectedSize === t('seller.withoutSize')
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.some(s => getSizeStr(s) === selectedSize));

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (selectedCategoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (selectedCategoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

      const matchesSearch = String(p.code || "")
        .toLowerCase()
        .includes(sizeSearchQuery.toLowerCase());

      return (
        isCorrectBranch &&
        matchesCollection &&
        hasSize &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [
    products,
    user?.branchId,
    selectedCollection,
    selectedSize,
    selectedCategoryType,
    isAdmin,
    filterBranch,
    sizeSearchQuery,
  ]);

  // --- Navigation Handlers ---

  const handleBack = () => {
    if (viewMode === "products") {
      setViewMode("categories");
      setSelectedCategoryType(null);
      setSelectedCollection(null);
      setSelectedWidth(null);
      setSelectedSize(null);
    } else if (viewMode === "heights") {
      setViewMode("widths");
    } else if (viewMode === "widths") {
      setViewMode("collections");
      setSelectedWidth(null);
    } else if (viewMode === "collections") {
      setViewMode("categories");
      setSelectedCollection(null);
    }
  };

  const handleCategorySelect = (category: CategoryType) => {
    setSelectedCategoryType(category);
    setSelectedCollection(null);
    setSelectedWidth(null);
    setSelectedSize(null);
    setViewMode("products");
  };

  const handleCollectionSelect = (collection: string) => {
    setSelectedCollection(collection);
    setViewMode("widths");
    setSizeSearchQuery("");
  };

  const handleWidthClick = (width: string) => {
    setSelectedWidth(width);
    if (selectedCategoryType === "Metrajlar") {
      // Find the first matching size for metraj
      const matchingSizes = products.filter(p =>
        (p.collection || "Kolleksiyasiz") === selectedCollection &&
        p.availableSizes?.some(s => {
          const parts = parseSize(getSizeStr(s));
          return parts && parts.width === width;
        })
      ).flatMap(p => p.availableSizes || []);

      const distinctSize = matchingSizes.find(s => {
        const parts = parseSize(getSizeStr(s));
        return parts && parts.width === width;
      });

      if (distinctSize) {
        setSelectedSize(getSizeStr(distinctSize));
        setViewMode("products");
      } else if (width === t('seller.withoutSize')) {
        setSelectedSize(t('seller.withoutSize'));
        setViewMode("products");
      }
    } else {
      setViewMode("heights");
    }
  };

  const handleHeightSelect = (size: string) => {
    setSelectedSize(size);
    setViewMode("products");
  };

  // --- Admin Action Handlers ---

  const handleMoveClick = (
    product: Product,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setProductToMove(product);
    setTargetBranchId(String(product.branchId));
    setMoveDialogOpen(true);
  };

  const handleConfirmMove = async () => {
    if (productToMove && targetBranchId) {
      try {
        await updateProduct(productToMove.id, {
          branchId: targetBranchId,
        });
        toast.success(t('messages.productMoved'));
        setMoveDialogOpen(false);
        setProductToMove(null);
      } catch (error) {
        toast.error(t('messages.moveError'));
      }
    }
  };

  const handleEditClick = (
    product: Product,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    navigate(`/seller/edit-product/${product.id}`);
  };

  const handleDeleteClick = (
    product: Product,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  // --- Render Functions ---

  const renderCategories = () => (
    <div className="p-4 space-y-4">
      {isAdmin && (
        <Select
          value={filterBranch}
          onValueChange={setFilterBranch}
        >
          <SelectTrigger className="h-12 bg-card border-border">
            <SelectValue placeholder={t('seller.allBranches')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('seller.allBranches')}
            </SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="grid grid-cols-2 gap-3">
        {(
          [
            "Gilamlar",
            "Metrajlar",
            "Ovalniy",
            "Kovrik",
          ] as CategoryType[]
        ).map((category) => {
          const count = getCategoryCount(category);
          const config = categoryConfig[category];
          return (
            <Card
              key={category}
              className={`cursor-pointer border-2 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${config.bgColor}`}
              onClick={() => handleCategorySelect(category)}
            >
              <div className="p-6 text-center">
                <div className="text-5xl mb-3">
                  {config.icon}
                </div>
                <h3
                  className={`text-lg mb-2 font-semibold ${config.color}`}
                >
                  {category}
                </h3>
                <div
                  className={`flex items-center justify-center space-x-2 text-sm ${config.color}`}
                >
                  <Package className="h-4 w-4" />
                  <span>{count} {t('product.unit')}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderCollections = () => (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {filteredCollectionNames.map((collection) => {
          const count = getCollectionCount(collection);
          return (
            <Card
              key={collection}
              className="cursor-pointer border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => handleCollectionSelect(collection)}
            >
              <div className="p-6 text-center">
                <div className="text-5xl mb-3">
                  {getCollectionIcon(collection)}
                </div>
                <h3 className="text-lg mb-2 text-card-foreground font-medium">
                  {collection}
                </h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{count} {t('product.unit')}</span>
                </div>
              </div>
            </Card>
          );
        })}
        {filteredCollectionNames.length === 0 && (
          <div className="col-span-2 text-center py-10 text-gray-500">
            {t('messages.noResults')}
          </div>
        )}
      </div>
    </div>
  );

  const renderWidths = () => (
    <div className="grid grid-cols-2 gap-3 p-4">
      {widthsForCollection.map((width) => {
        const totalQuantity = getTotalQuantityForWidth(width);
        const maxQuantity = Math.max(
          ...widthsForCollection.map((w) =>
            getTotalQuantityForWidth(w),
          ),
          1,
        );
        const percentage = (totalQuantity / maxQuantity) * 100;

        return (
          <Card
            key={width}
            className="p-4 bg-card border border-border shadow-sm cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleWidthClick(width)}
          >
            <div className="mb-3 text-center">
              <span className="text-3xl font-bold text-card-foreground">
                {width === t('seller.withoutSize') ? width : `${width}x`}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('product.remaining')}</span>
                <span className="font-semibold text-card-foreground">
                  {totalQuantity}{" "}
                  {selectedCategoryType === "Metrajlar"
                    ? "m"
                    : t('product.unit')}
                </span>
              </div>
              <Progress value={percentage} />
            </div>
          </Card>
        );
      })}
      {widthsForCollection.length === 0 && (
        <div className="col-span-2 text-center py-10 text-gray-500">
          {t('messages.noResults')}
        </div>
      )}
    </div>
  );

  const renderHeights = () => (
    <div className="grid grid-cols-2 gap-3 p-4">
      {heightsForWidth.map((size) => {
        const totalQuantity = getTotalQuantityForSize(size);
        const maxQuantity = Math.max(
          ...heightsForWidth.map((s) =>
            getTotalQuantityForSize(s),
          ),
          1,
        );
        const percentage = (totalQuantity / maxQuantity) * 100;

        return (
          <Card
            key={size}
            className="cursor-pointer border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] p-4"
            onClick={() => handleHeightSelect(size)}
          >
            <div className="mb-3 text-center">
              <span className="text-2xl font-bold text-card-foreground">
                {size}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('product.remaining')}</span>
                <span className="font-semibold text-card-foreground">
                  {totalQuantity} {t('product.unit')}
                </span>
              </div>
              <Progress value={percentage} />
            </div>
          </Card>
        );
      })}
      {heightsForWidth.length === 0 && (
        <div className="col-span-2 text-center py-10 text-gray-500">
          {t('messages.noResults')}
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="flex flex-col">
      {/* 1. Collections Filter Bar - Sticky */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border p-3 overflow-x-auto whitespace-nowrap scrollbar-hide flex gap-2">
        <Button
          variant={selectedCollection === null ? "default" : "outline"}
          size="sm"
          className="rounded-full px-4 h-9 font-medium"
          onClick={() => setSelectedCollection(null)}
        >
          {t('common.all')}
        </Button>
        {filteredCollectionNames.map((c) => (
          <Button
            key={c}
            variant={selectedCollection === c ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4 h-9 font-medium whitespace-nowrap"
            onClick={() => setSelectedCollection(c === selectedCollection ? null : c)}
          >
            {getCollectionIcon(c)} {c}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 pb-24">
        <div className="col-span-2 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('seller.searchPlaceholder')}
              className="pl-9 h-11 rounded-xl"
              value={sizeSearchQuery}
              onChange={(e) => setSizeSearchQuery(e.target.value)}
            />
          </div>
        </div>
        {finalProducts.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-muted-foreground">
            <p>{t('messages.noResults')}</p>
          </div>
        ) : (
          finalProducts.map((product) => {
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
                className="relative flex flex-col h-full overflow-hidden border border-border bg-card transition-all hover:shadow-lg"
              >
                {(isAdmin || (user?.canAddProducts && String(product.branchId) === String(user?.branchId))) && (
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEditClick(product, e)}>
                          <Edit className="mr-2 h-4 w-4" /> {t('common.edit')}
                        </DropdownMenuItem>
                        {isAdmin && (
                          <DropdownMenuItem onClick={(e) => handleMoveClick(product, e)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" /> {t('profile.move')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => handleDeleteClick(product, e)}>
                          <Trash2 className="mr-2 h-4 w-4" /> {t('common.delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}

                <div className="flex flex-col h-full">
                  <div className="aspect-[4/5] relative overflow-hidden">
                    <img
                      src={product.photo}
                      alt={product.code}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-card-foreground line-clamp-1">
                        {product.code}
                      </h3>

                      {product.type === 'meter' && product.availableSizes && product.availableSizes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {product.availableSizes.map((s: any, idx: number) => {
                            const sizeStr = typeof s === 'string' ? s : s.size;
                            const [w, l] = sizeStr.split('x').map(parseFloat);

                            return (
                              <div
                                key={idx}
                                className="flex flex-col items-center justify-center min-w-[50px] p-1 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10"
                              >
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-tight">
                                  {w}m
                                </span>
                                <span className="text-[8px] text-muted-foreground font-medium">
                                  {l.toFixed(1)}m
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        product.availableSizes && product.availableSizes.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {product.availableSizes.map((s: any, i: number) => {
                              const sStr = getSizeStr(s);
                              const qty = typeof s === 'object' ? s.quantity : null;
                              return (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-[10px] px-2 py-0 h-5"
                                >
                                  {sStr} {qty !== null && `(${qty})`}
                                </Badge>
                              );
                            })}
                          </div>
                        )
                      )}

                      {(() => {
                        const col = collections.find((c: any) => c.name === product.collection);
                        const rate = col?.price_per_sqm || col?.price_usd_per_sqm;
                        if (rate && (product.category === "Gilamlar" || product.category === "Metrajlar")) {
                          return (
                            <div className="text-xs font-semibold text-green-600 dark:text-green-400 pt-1 border-t border-border/50 mt-1">
                              ${rate}/m²
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{t('product.inStock')}:</span>
                          <span className="font-medium text-foreground">
                            {product.type === "unit" ? (
                              <>{product.quantity} {t('product.unit')}</>
                            ) : (
                              <>{product.remainingLength}/{product.totalLength} {t('common.meter_short')}</>
                            )}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${progressColor} transition-all duration-300`}
                            style={{ width: `${stockPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {new Intl.NumberFormat("uz-UZ").format(product.sellPrice)} {t('common.currency')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="p-4 flex items-center gap-3">
          {viewMode !== "categories" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="-ml-2"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}
          <h1 className="text-xl text-card-foreground flex-1 font-bold">
            {viewMode === "categories"
              ? t('product.categories')
              : viewMode === "collections"
                ? (selectedCategoryType ? t(`product.${selectedCategoryType.toLowerCase()}` as any) : "")
                : viewMode === "widths"
                  ? `${selectedCollection} - ${t('seller.widths')}`
                  : viewMode === "heights"
                    ? `${selectedWidth}x - ${t('seller.heights')}`
                    : (selectedCollection && selectedSize)
                      ? `${selectedCollection} (${selectedSize})`
                      : (selectedCollection)
                        ? selectedCollection
                        : (selectedCategoryType ? t(`product.${selectedCategoryType.toLowerCase()}` as any) : "")}
          </h1>
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-gray-600 dark:text-gray-400"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/seller/add-product")}>
                  <Plus className="mr-2 h-4 w-4" /> {t('seller.addProduct')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/manage-collections")}>
                  <Package className="mr-2 h-4 w-4" /> {t('admin.collections')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/manage-sizes")}>
                  <Ruler className="mr-2 h-4 w-4" /> {t('admin.sizes')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {user?.canAddProducts && !isAdmin && (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => navigate("/seller/add-product")}
              className="text-blue-600 dark:text-blue-400"
            >
              <Plus className="h-6 w-6" />
            </Button>
          )}
        </div>
      </div>

      {viewMode === "categories" && renderCategories()}
      {viewMode === "collections" && renderCollections()}
      {viewMode === "widths" && renderWidths()}
      {viewMode === "heights" && renderHeights()}
      {viewMode === "products" && renderProducts()}

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.move')}</DialogTitle>
            <DialogDescription>
              {t('messages.selectBranchToMove')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              "{productToMove?.code}" mahsulotini qaysi filialga ko'chirmoqchisiz?
            </p>
            <Select value={targetBranchId} onValueChange={setTargetBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Filialni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleConfirmMove}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('common.delete')}</DialogTitle>
            <DialogDescription>{t('messages.confirmDeleteProduct')}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              "{productToDelete?.code}" mahsulotini o'chirmoqchisiz?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={async () => {
                if (productToDelete) {
                  try {
                    setIsDeleting(true);
                    await deleteProduct(productToDelete.id);
                    toast.success(t('messages.deleteSuccess'));
                    setDeleteDialogOpen(false);
                    setProductToDelete(null);
                  } catch (error) {
                    toast.error(t('messages.error'));
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
            >
              {t('common.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}