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
  } = useApp();

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
  const collections = useMemo(() => {
    if (!selectedCategoryType) return [];

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    const relevantProducts = products.filter((p) => {
      const isCorrectBranch =
        targetBranchId === "all" ||
        String(p.branchId) === String(targetBranchId);

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

      let matchesCategory = false;
      if (categoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (categoryType === "Metrajlar") {
        matchesCategory =
          p.category === "Metrajlar" || p.type === "meter";
      } else if (categoryType === "Ovalniy") {
        matchesCategory =
          p.category === "Ovalniy" && p.type === "unit";
      } else if (categoryType === "Kovrik") {
        matchesCategory =
          p.category === "Kovrik" && p.type === "unit";
      }

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
      const matchesCollection = (p.collection || "Kolleksiyasiz") === collectionName;

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
        (p.collection || "Kolleksiyasiz") === selectedCollection;

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
        widthSet.add("O'lchamsiz");
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
        (p.collection || "Kolleksiyasiz") === selectedCollection;

      const hasWidth = width === "O'lchamsiz"
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
        (p.collection || "Kolleksiyasiz") === selectedCollection;

      const hasWidth = width === "O'lchamsiz"
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
        (p.collection || "Kolleksiyasiz") === selectedCollection;

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
        (p.collection || "Kolleksiyasiz") === selectedCollection;
      const hasSize = size === "O'lchamsiz"
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

      const matchesCollection = !selectedCollection || String(p.collection || "Kolleksiyasiz") === selectedCollection;
      const hasSize = !selectedSize || (selectedSize === "O'lchamsiz"
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
      setViewMode(selectedCategoryType === "Metrajlar" ? "widths" : "heights");
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
    setViewMode("collections");
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
      } else if (width === "O'lchamsiz") {
        setSelectedSize("O'lchamsiz");
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
        toast.success("Mahsulot ko'chirildi");
        setMoveDialogOpen(false);
        setProductToMove(null);
      } catch (error) {
        toast.error("Ko'chirishda xatolik yuz berdi");
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
            <SelectValue placeholder="Barcha filiallar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Barcha filiallar
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
                  <span>{count} dona</span>
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
        {collections.map((collection) => {
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
                  <span>{count} dona</span>
                </div>
              </div>
            </Card>
          );
        })}
        {collections.length === 0 && (
          <div className="col-span-2 text-center py-10 text-gray-500">
            Hech qanday kolleksiya topilmadi
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
                {width === "O'lchamsiz" ? width : `${width}x`}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Qoldiq</span>
                <span className="font-semibold text-card-foreground">
                  {totalQuantity}{" "}
                  {selectedCategoryType === "Metrajlar"
                    ? "m"
                    : "dona"}
                </span>
              </div>
              <Progress value={percentage} />
            </div>
          </Card>
        );
      })}
      {widthsForCollection.length === 0 && (
        <div className="col-span-2 text-center py-10 text-gray-500">
          Kenglik topilmadi
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
                <span>Qoldiq</span>
                <span className="font-semibold text-card-foreground">
                  {totalQuantity} dona
                </span>
              </div>
              <Progress value={percentage} />
            </div>
          </Card>
        );
      })}
      {heightsForWidth.length === 0 && (
        <div className="col-span-2 text-center py-10 text-gray-500">
          Balandlik topilmadi
        </div>
      )}
    </div>
  );

  const renderProducts = () => (
    <div className="grid grid-cols-2 gap-3 p-4">
      <div className="col-span-2 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Kod bo'yicha qidirish..."
            className="pl-9"
            value={sizeSearchQuery}
            onChange={(e) => setSizeSearchQuery(e.target.value)}
          />
        </div>
      </div>
      {finalProducts.length === 0 ? (
        <div className="col-span-2 py-12 text-center text-muted-foreground">
          <p>Mahsulot topilmadi</p>
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
              className="relative overflow-hidden border border-border bg-card transition-all hover:shadow-lg"
            >
              {isAdmin && (
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
                        <Edit className="mr-2 h-4 w-4" /> Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleMoveClick(product, e)}>
                        <ArrowRightLeft className="mr-2 h-4 w-4" /> Ko'chirish
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleDeleteClick(product, e)}>
                        <Trash2 className="mr-2 h-4 w-4" /> O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="flex flex-col">
                <img
                  src={product.photo}
                  alt={product.code}
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-medium text-card-foreground line-clamp-1">
                    {product.code}
                  </h3>

                  {product.availableSizes && product.availableSizes.length > 0 && (
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
                  )}

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Omborda:</span>
                        <span className="font-medium text-foreground">
                          {product.type === "unit" ? (
                            <>{product.quantity} dona</>
                          ) : (
                            <>{product.remainingLength}/{product.totalLength} m</>
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
                      {new Intl.NumberFormat("uz-UZ").format(product.sellPrice)} so'm
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      )}
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
              ? "Kategoriyalar"
              : viewMode === "collections"
                ? selectedCategoryType
                : viewMode === "widths"
                  ? `${selectedCollection} - Eni`
                  : viewMode === "heights"
                    ? `${selectedWidth}x - Balandligi`
                    : (selectedCollection && selectedSize)
                      ? `${selectedCollection} (${selectedSize})`
                      : (selectedCollection)
                        ? selectedCollection
                        : selectedCategoryType}
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
                  <Plus className="mr-2 h-4 w-4" /> Mahsulot qo'shish
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/manage-collections")}>
                  <Package className="mr-2 h-4 w-4" /> Kolleksiyalarni boshqarish
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/admin/manage-sizes")}>
                  <Ruler className="mr-2 h-4 w-4" /> O'lchamlarni boshqarish
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {user?.canAddProducts && (
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
            <DialogTitle>Mahsulotni ko'chirish</DialogTitle>
            <DialogDescription>
              Mahsulotni boshqa filialga ko'chirish uchun filial tanlang
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
              Bekor qilish
            </Button>
            <Button onClick={handleConfirmMove}>Tasdiqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahsulotni o'chirish</DialogTitle>
            <DialogDescription>Bu amalni bekor qilish mumkin emas</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              "{productToDelete?.code}" mahsulotini o'chirmoqchisiz?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Bekor qilish
            </Button>
            <Button
              disabled={isDeleting}
              onClick={async () => {
                if (productToDelete) {
                  try {
                    setIsDeleting(true);
                    await deleteProduct(productToDelete.id);
                    toast.success("Mahsulot o'chirildi");
                    setDeleteDialogOpen(false);
                    setProductToDelete(null);
                  } catch (error) {
                    toast.error("O'chirishda xatolik yuz berdi");
                  } finally {
                    setIsDeleting(false);
                  }
                }
              }}
            >
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}