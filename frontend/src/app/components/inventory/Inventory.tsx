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
    Lara: "🌺",
    Emili: "",
    Melord: "👑",
    Mashad: "🎨",
    Izmir: "✨",
    Isfahan: "🏛️",
    Prestige: "💎",
    Sultan: "🕌",
  };

  const getCollectionIcon = (name: string) =>
    collectionIcons[name] || "📦";

  // Category Icons and Colors Map
  const categoryConfig: Record<
    CategoryType,
    { icon: string; color: string; bgColor: string }
  > = {
    Gilamlar: {
      icon: "🧵",
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
      icon: "🔶",
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
        p.branchId === targetBranchId;

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Paloslar") {
        matchesCategory = p.category === "Paloslar" && p.type === "unit";
      } else if (selectedCategoryType === "Joynamozlar") {
        matchesCategory = p.category === "Joynamozlar" && p.type === "unit";
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
        p.branchId === targetBranchId;

      let matchesCategory = false;
      if (categoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (categoryType === "Paloslar") {
        matchesCategory = p.category === "Paloslar" && p.type === "unit";
      } else if (categoryType === "Joynamozlar") {
        matchesCategory = p.category === "Joynamozlar" && p.type === "unit";
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
        p.branchId === targetBranchId;
      const matchesCollection = (p.collection || "Kolleksiyasiz") === collectionName;

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Paloslar") {
        matchesCategory = p.category === "Paloslar" && p.type === "unit";
      } else if (selectedCategoryType === "Joynamozlar") {
        matchesCategory = p.category === "Joynamozlar" && p.type === "unit";
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
        p.branchId === targetBranchId;
      const matchesCollection =
        (p.collection || "Kolleksiyasiz") === selectedCollection;

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Paloslar") {
        matchesCategory = p.category === "Paloslar" && p.type === "unit";
      } else if (selectedCategoryType === "Joynamozlar") {
        matchesCategory = p.category === "Joynamozlar" && p.type === "unit";
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

    // Aggregate all available sizes and extract widths
    const widthSet = new Set<string>();
    relevantProducts.forEach((p) => {
      if (p.availableSizes && p.availableSizes.length > 0) {
        p.availableSizes.forEach((s) => {
          const parts = s.split(/×|x/);
          if (parts.length >= 1) {
            widthSet.add(parts[0].trim());
          }
        });
      } else {
        widthSet.add("O'lchamsiz");
      }
    });

    // Sort widths numerically
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
        p.branchId === targetBranchId;
      const matchesCollection =
        (p.collection || "Kolleksiyasiz") === selectedCollection;
      const hasWidth = width === "O'lchamsiz"
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.some(
          (s) =>
            s.startsWith(width + "x") ||
            s.startsWith(width + "×"),
        );

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Paloslar") {
        matchesCategory = p.category === "Paloslar" && p.type === "unit";
      } else if (selectedCategoryType === "Joynamozlar") {
        matchesCategory = p.category === "Joynamozlar" && p.type === "unit";
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
        p.branchId === targetBranchId;
      const matchesCollection =
        (p.collection || "Kolleksiyasiz") === selectedCollection;
      const hasWidth = width === "O'lchamsiz"
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.some(
          (s) =>
            s.startsWith(width + "x") ||
            s.startsWith(width + "×"),
        );

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Paloslar") {
        matchesCategory = p.category === "Paloslar" && p.type === "unit";
      } else if (selectedCategoryType === "Joynamozlar") {
        matchesCategory = p.category === "Joynamozlar" && p.type === "unit";
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
        p.branchId === targetBranchId;
      const matchesCollection =
        (p.collection || "Kolleksiyasiz") === selectedCollection;

      // Category match logic
      let matchesCategory = false;
      if (selectedCategoryType === "Gilamlar") {
        matchesCategory = p.category === "Gilamlar" && p.type === "unit";
      } else if (selectedCategoryType === "Paloslar") {
        matchesCategory = p.category === "Paloslar" && p.type === "unit";
      } else if (selectedCategoryType === "Joynamozlar") {
        matchesCategory = p.category === "Joynamozlar" && p.type === "unit";
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

    // Find sizes that match the selected width
    const matchingSizes = new Set<string>();
    relevantProducts.forEach((p) => {
      if (selectedWidth === "O'lchamsiz") {
        if (!p.availableSizes || p.availableSizes.length === 0) {
          matchingSizes.add("O'lchamsiz");
        }
      } else if (p.availableSizes) {
        p.availableSizes.forEach((s) => {
          const parts = s.split(/×|x/);
          if (
            parts.length === 2 &&
            parts[0].trim() === selectedWidth
          ) {
            matchingSizes.add(s);
          }
        });
      }
    });

    // Sort sizes naturally
    return Array.from(matchingSizes).sort((a, b) => {
      const getArea = (s: string) => {
        const parts = s.split(/×|x/);
        if (parts.length === 2)
          return parseFloat(parts[0]) * parseFloat(parts[1]);
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
        p.branchId === targetBranchId;
      const matchesCollection =
        (p.collection || "Kolleksiyasiz") === selectedCollection;
      const hasSize = size === "O'lchamsiz"
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.includes(size);

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

  // 2. Get available sizes for the selected collection (LEGACY - keeping for compatibility)
  const sizesForCollection = useMemo(() => {
    if (!selectedCollection) return [];

    const targetBranchId = isAdmin
      ? filterBranch
      : user?.branchId;
    const relevantProducts = products.filter(
      (p) =>
        (targetBranchId === "all" ||
          p.branchId === targetBranchId) &&
        (p.collection || "Kolleksiyasiz") === selectedCollection,
    );

    // Aggregate all available sizes
    const allSizes = new Set<string>();
    relevantProducts.forEach((p) => {
      if (p.availableSizes) {
        p.availableSizes.forEach((s) => allSizes.add(s));
      }
    });

    // Sort sizes naturally (e.g. 1x2, 2x3, 3x4)
    return Array.from(allSizes).sort((a, b) => {
      // rough heuristic sorting
      const getArea = (s: string) => {
        const parts = s.split(/×|x/);
        if (parts.length === 2)
          return parseFloat(parts[0]) * parseFloat(parts[1]);
        return 0;
      };
      return getArea(a) - getArea(b);
    });
  }, [
    products,
    user?.branchId,
    selectedCollection,
    isAdmin,
    filterBranch,
  ]);

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

      const matchesCollection = !selectedCollection || (p.collection || "Kolleksiyasiz") === selectedCollection;
      const hasSize = !selectedSize || (selectedSize === "O'lchamsiz"
        ? (!p.availableSizes || p.availableSizes.length === 0)
        : p.availableSizes?.includes(selectedSize));

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

      const matchesSearch = (p.name || "")
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
      // Go back to categories for a simplified view
      setViewMode("categories");
      setSelectedCategoryType(null);
      setSelectedCollection(null);
      setSelectedSize(null);
      setSelectedWidth(null);
      setSizeSearchQuery("");
    } else if (viewMode === "heights") {
      setViewMode("widths");
    } else if (viewMode === "widths") {
      setViewMode("collections");
      setSelectedCollection(null);
      setSelectedWidth(null);
      setSizeSearchQuery("");
    } else if (viewMode === "collections") {
      setViewMode("categories");
      setSelectedCategoryType(null);
    }
  };

  const handleCategorySelect = (category: CategoryType) => {
    setSelectedCategoryType(category);
    // Jump directly to products for a simplified view as requested
    setViewMode("products");
  };

  const handleCollectionSelect = (collection: string) => {
    setSelectedCollection(collection);
    setViewMode("widths");
    setSizeSearchQuery("");
  };

  const handleWidthClick = (width: string) => {
    setSelectedWidth(width);

    // For Metrajlar, go directly to products
    if (selectedCategoryType === "Metrajlar") {
      // Find any size that starts with this width for Metrajlar products
      const matchingSize = sizesForCollection.find((s) =>
        s.startsWith(width),
      );
      if (matchingSize) {
        setSelectedSize(matchingSize);
        setViewMode("products");
      }
    } else {
      // For Gilamlar, Ovalniy, Kovrik, go to heights
      setViewMode("heights");
    }
  };

  const handleHeightSelect = (size: string) => {
    setSelectedSize(size);
    setViewMode("products");
  };

  const handleSizeSelect = (
    size: string,
    type: CategoryType,
  ) => {
    setSelectedSize(size);
    setSelectedCategoryType(type);
    setViewMode("products");
  };

  // --- Admin Action Handlers ---

  const handleMoveClick = (
    product: Product,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation(); // Prevent card click if any
    setProductToMove(product);
    setTargetBranchId(product.branchId);
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
          <SelectTrigger className="h-12 bg-input-background border-border">
            <SelectValue placeholder="Barcha filiallar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              Barcha filiallar
            </SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
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
          const config = categoryConfig[category] || categoryConfig["Gilamlar"] || { icon: "📦", color: "", bgColor: "" };
          return (
            <Card
              key={category}
              className={`cursor-pointer border-2 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${config?.bgColor || "bg-gray-50 border-gray-200"}`}
              onClick={() => handleCategorySelect(category)}
            >
              <div className="p-6 text-center">
                <div className="text-5xl mb-3">
                  {config?.icon || "📦"}
                </div>
                <h3
                  className={`text-lg mb-2 font-semibold ${config?.color || "text-gray-700"}`}
                >
                  {category}
                </h3>
                <div
                  className={`flex items-center justify-center space-x-2 text-sm ${config?.color || "text-gray-500"}`}
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
              className="cursor-pointer border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
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
                {width}x
              </span>
            </div>

            {/* Progress Bar */}
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
            className="cursor-pointer border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] dark:hover:shadow-xl dark:hover:shadow-blue-900/10 p-4"
            onClick={() => handleHeightSelect(size)}
          >
            <div className="mb-3 text-center">
              <span className="text-2xl font-bold text-card-foreground">
                {size}
              </span>
            </div>

            {/* Progress Bar */}
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
      {finalProducts.length === 0 ? (
        <div className="col-span-2 py-12 text-center text-muted-foreground">
          <p>Mahsulot topilmadi</p>
        </div>
      ) : (
        finalProducts.map((product) => {
          // Calculate stock percentage
          let stockPercentage = 0;
          let currentStock = 0;
          let maxStock = 1;

          if (product.type === "unit") {
            currentStock = product.quantity || 0;
            maxStock =
              product.maxQuantity || product.quantity || 1;
            stockPercentage = (currentStock / maxStock) * 100;
          } else {
            currentStock = product.remainingLength || 0;
            maxStock =
              product.totalLength ||
              product.remainingLength ||
              1;
            stockPercentage = (currentStock / maxStock) * 100;
          }

          // Determine progress bar color based on stock level
          let progressColor = "bg-green-500";
          if (stockPercentage <= 25) {
            progressColor = "bg-red-500";
          } else if (stockPercentage <= 50) {
            progressColor = "bg-yellow-500";
          }

          return (
            <Card
              key={product.id}
              className="relative overflow-hidden border border-border bg-card transition-all hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
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
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleEditClick(product, e)
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Tahrirlash
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleMoveClick(product, e)
                        }
                      >
                        <ArrowRightLeft className="mr-2 h-4 w-4" />
                        Ko'chirish
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) =>
                          handleDeleteClick(product, e)
                        }
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        O'chirish
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <div className="flex flex-col">
                <img
                  src={product.photo}
                  alt={product.name}
                  className="w-full aspect-[4/5] object-cover"
                />
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-medium text-card-foreground line-clamp-1">
                    {product.name}
                  </h3>

                  {product.availableSizes &&
                    product.availableSizes.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {product.availableSizes.map((size) => (
                          <Badge
                            key={size}
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0 text-[10px] px-2 py-0 h-5"
                          >
                            {size}
                          </Badge>
                        ))}
                      </div>
                    )}

                  <div className="space-y-2">
                    {/* Stock Info with Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Omborda:
                        </span>
                        <span className="font-medium text-foreground">
                          {product.type === "unit" ? (
                            <>
                              {product.quantity}/
                              {product.maxQuantity ||
                                product.quantity}{" "}
                              dona
                            </>
                          ) : (
                            <>
                              {product.remainingLength}/
                              {product.totalLength ||
                                product.remainingLength}{" "}
                              m
                            </>
                          )}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${progressColor} transition-all duration-300`}
                          style={{
                            width: `${stockPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="text-blue-600 dark:text-blue-400 font-bold">
                      {new Intl.NumberFormat("uz-UZ").format(
                        product.type === "unit"
                          ? product.sellPrice
                          : product.sellPricePerMeter || 0,
                      )}{" "}
                      so'm
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
      {/* Header */}
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
          <h1 className="text-xl text-card-foreground flex-1">
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
                <DropdownMenuItem
                  onClick={() =>
                    navigate("/seller/add-product")
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Mahsulot qo'shish
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate("/admin/manage-collections")
                  }
                >
                  <Package className="mr-2 h-4 w-4" />
                  Kolleksiyalarni boshqarish
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    navigate("/admin/manage-sizes")
                  }
                >
                  <Ruler className="mr-2 h-4 w-4" />
                  O'lchamlarni boshqarish
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

      <Dialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahsulotni ko'chirish</DialogTitle>
            <DialogDescription>
              Mahsulotni boshqa filialga ko'chirish uchun filial tanlang
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              "{productToMove?.name}" mahsulotini qaysi filialga
              ko'chirmoqchisiz?
            </p>
            <Select
              value={targetBranchId}
              onValueChange={setTargetBranchId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filialni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMoveDialogOpen(false)}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleConfirmMove}>
              Tasdiqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mahsulotni o'chirish</DialogTitle>
            <DialogDescription>
              Bu amalni bekor qilish mumkin emas
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              "{productToDelete?.name}" mahsulotini
              o'chirmoqchisiz?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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