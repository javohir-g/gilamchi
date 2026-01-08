import { useState } from "react";
import {
  Search,
  Camera,
  ArrowLeft,
  Package,
  Grid3x3,
  ShoppingCart,
  Plus,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useApp, Product } from "../../context/AppContext";
import { BottomNav } from "../shared/BottomNav";
import { AddToBasketModal } from "./AddToBasketModal";
import type { Category } from "../../context/AppContext";
import { toast } from "sonner";

export function SellProduct() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<
    string | null
  >(null);
  const navigate = useNavigate();
  const { products, user, basket, addToBasket } = useApp();

  const categories: {
    name: Category;
    label: string;
    icon: string;
  }[] = [
    { name: "Gilamlar", label: "Gilamlar", icon: "🧵" },
    { name: "Metrajlar", label: "Metrajlar", icon: "📏" },
    { name: "Paloslar", label: "Paloslar", icon: "🧶" },
    { name: "Joynamozlar", label: "Joynamozlar", icon: "🕌" },
    { name: "Ovalniy", label: "Ovalniy", icon: "⭕" },
    { name: "Kovrik", label: "Kovrik", icon: "🔲" },
  ];

  // Collections for Gilamlar category
  const collections = [
    { name: "Lara", icon: "🌺" },
    { name: "Emili", icon: "🌸" },
    { name: "Melord", icon: "👑" },
    { name: "Mashad", icon: "🎨" },
    { name: "Izmir", icon: "✨" },
    { name: "Isfahan", icon: "🏛️" },
    { name: "Prestige", icon: "💎" },
    { name: "Sultan", icon: "🕌" },
  ];

  // Collections for Metrajlar category
  const metrajCollections = [
    { name: "Lara", icon: "🌺" },
    { name: "Emili", icon: "🌸" },
    { name: "Melord", icon: "👑" },
    { name: "Mashad", icon: "🎨" },
    { name: "Izmir", icon: "✨" },
    { name: "Isfahan", icon: "🏛️" },
    { name: "Prestige", icon: "💎" },
    { name: "Sultan", icon: "🕌" },
  ];

  // Filter products by branch, category, and search
  const filteredProducts = products.filter((product) => {
    const matchesBranch = product.branchId === user?.branchId;
    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;
    const matchesCollection =
      (selectedCategory === "Gilamlar" || selectedCategory === "Metrajlar") && selectedCollection
        ? product.collection === selectedCollection
        : true;
    const matchesSearch =
      product.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      product.category
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return (
      matchesBranch &&
      matchesCategory &&
      matchesCollection &&
      matchesSearch
    );
  });

  // Count products per category for the current branch
  const getCategoryCount = (categoryName: Category) => {
    return products.filter(
      (p) =>
        p.branchId === user?.branchId &&
        p.category === categoryName,
    ).length;
  };

  // Count products per collection for Gilamlar
  const getCollectionCount = (collectionName: string) => {
    return products.filter(
      (p) =>
        p.branchId === user?.branchId &&
        p.category === "Gilamlar" &&
        p.collection === collectionName,
    ).length;
  };

  // Count products per collection for Metrajlar
  const getMetrajCollectionCount = (collectionName: string) => {
    return products.filter(
      (p) =>
        p.branchId === user?.branchId &&
        p.category === "Metrajlar" &&
        p.collection === collectionName,
    ).length;
  };

  const handleSelectProduct = (productId: string) => {
    navigate(`/seller/sell/${productId}`);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedCollection(null);
    setSearchQuery("");
  };

  const handleBackToCollections = () => {
    setSelectedCollection(null);
    setSearchQuery("");
  };

  const handleBackButton = () => {
    if (searchQuery) {
      // If searching, clear search
      setSearchQuery("");
    } else if (selectedCollection) {
      // If collection is selected, go back to collections
      handleBackToCollections();
    } else if (selectedCategory) {
      // If category is selected, go back to categories
      handleBackToCategories();
    } else {
      // Otherwise, navigate back
      navigate(-1);
    }
  };

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  // Camera search state
  const [cameraSearchOpen, setCameraSearchOpen] =
    useState(false);
  const [capturedImage, setCapturedImage] = useState<
    string | null
  >(null);
  const [similarProducts, setSimilarProducts] = useState<
    Product[]
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleOpenBasketModal = (
    e: React.MouseEvent,
    product: Product,
  ) => {
    e.stopPropagation();
    setSelectedProduct(product);
  };

  const handleAddToBasketConfirm = (quantity: number) => {
    // Add product to basket logic here
    toast.success("Mahsulot savatga qo'shildi!");
    addToBasket(selectedProduct!, quantity);
  };

  // Camera search handlers
  const handleCameraCapture = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setCapturedImage(imageData);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTapToScan = () => {
    // Trigger the hidden file input with camera capture
    document.getElementById("camera-input")?.click();
  };

  const analyzeImage = (imageData: string) => {
    setIsAnalyzing(true);

    // Simulate AI image analysis with a delay
    setTimeout(() => {
      // Mock analysis: randomly select 5 products from current branch
      const branchProducts = products.filter(
        (p) => p.branchId === user?.branchId,
      );

      // Shuffle and get top 5
      const shuffled = [...branchProducts].sort(
        () => Math.random() - 0.5,
      );
      const top5 = shuffled.slice(0, 5);

      setSimilarProducts(top5);
      setIsAnalyzing(false);
      setCameraSearchOpen(false);
      // toast.success(
      //   "Tahlil yakunlandi! 5 ta o'xshash mahsulot topildi.",
      // );
    }, 2000);
  };

  const handleCloseCameraSearch = () => {
    setCameraSearchOpen(false);
    setCapturedImage(null);
    setSimilarProducts([]);
    setIsAnalyzing(false);
  };

  const handleSelectFromCameraSearch = (product: Product) => {
    setSimilarProducts([]);
    setSelectedProduct(product);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackButton}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-xl dark:text-white">
            Mahsulot sotish
          </h1>
        </div>

        {/* Search Bar - Always visible */}
        <div className="space-y-3 px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Mahsulot nomi yoki kodi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 pl-10 pr-4 bg-input-background border-border"
            />
          </div>

          {/* Camera Search Button */}
          <button
            onClick={() => setCameraSearchOpen(true)}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-98"
          >
            <Camera className="h-5 w-5" />
            <span>Rasm orqali qidirish</span>
          </button>
        </div>
      </div>

      {/* Category Selection View */}
      {!selectedCategory && !searchQuery && (
        <div className="p-4">
          {/* <div className="mb-4">
            <h2 className="text-lg text-muted-foreground">Kategoriyani tanlang</h2>
          </div> */}
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const count = getCategoryCount(category.name);
              return (
                <Card
                  key={category.name}
                  className="cursor-pointer border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
                  onClick={() =>
                    setSelectedCategory(category.name)
                  }
                >
                  <div className="p-6 text-center">
                    <div className="text-5xl mb-3">
                      {category.icon}
                    </div>
                    <h3 className="text-lg mb-2 text-card-foreground">
                      {category.label}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{count} dona</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Collection Selection View - Only for Gilamlar */}
      {selectedCategory === "Gilamlar" && !selectedCollection && !searchQuery && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {collections.map((collection) => {
              const count = getCollectionCount(collection.name);
              return (
                <Card
                  key={collection.name}
                  className="cursor-pointer border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
                  onClick={() => setSelectedCollection(collection.name)}
                >
                  <div className="p-6 text-center">
                    <div className="text-5xl mb-3">
                      {collection.icon}
                    </div>
                    <h3 className="text-lg mb-2 text-card-foreground">
                      {collection.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{count} dona</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Collection Selection View - Only for Metrajlar */}
      {selectedCategory === "Metrajlar" && !selectedCollection && !searchQuery && (
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {metrajCollections.map((collection) => {
              const count = getMetrajCollectionCount(collection.name);
              return (
                <Card
                  key={collection.name}
                  className="cursor-pointer border border-border bg-card transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
                  onClick={() => setSelectedCollection(collection.name)}
                >
                  <div className="p-6 text-center">
                    <div className="text-5xl mb-3">
                      {collection.icon}
                    </div>
                    <h3 className="text-lg mb-2 text-card-foreground">
                      {collection.name}
                    </h3>
                    <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{count} dona</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Product List View - Show when: 
          1. Non-Gilamlar/Metrajlar category selected OR
          2. Collection selected OR 
          3. Search query exists */}
      {((selectedCategory && selectedCategory !== "Gilamlar" && selectedCategory !== "Metrajlar") || 
        selectedCollection || 
        searchQuery) && (
        <div className="p-4 space-y-3">
          {/* Collection Filters - Only for Gilamlar category */}
          {/* Removed - using collection cards instead */}

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p>Mahsulot topilmadi</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden border border-border bg-card transition-all hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
                >
                  <div className="flex flex-col">
                    <img
                      src={product.photo}
                      alt={product.name}
                      className="w-full aspect-[4/5] object-cover cursor-pointer"
                    />
                    <div className="p-3 space-y-2">
                      <h3 className="text-sm text-card-foreground cursor-pointer line-clamp-2 mt-[0px] mr-[0px] mb-[16px] ml-[0px]">
                        {product.name}
                      </h3>
                      <Button
                        onClick={(e) =>
                          handleOpenBasketModal(e, product)
                        }
                        className="w-full bg-green-600 hover:bg-green-700 h-9"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Qo'shish
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <BottomNav />

      {selectedProduct && (
        <AddToBasketModal
          product={selectedProduct}
          onAdd={(item) => {
            addToBasket(item);
            toast.success("Mahsulot savatga qo'shildi!", {
              duration: 1000,
            });
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Camera Search Modal */}
      {cameraSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Close Button */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseCameraSearch}
              className="text-white hover:bg-white/20"
            >
              <X className="h-8 w-8" />
            </Button>
          </div>

          {/* Camera Feed Simulation */}
          <div className="flex-1 flex flex-col items-center justify-between py-6">
            <p className="text-gray-500 mb-20">
              Camera Feed Simulation
            </p>

            {/* Capture Button */}
            <div className="flex flex-col items-center space-y-4">
              <button
                onClick={handleTapToScan}
                disabled={isAnalyzing}
                className={`w-24 h-24 rounded-full border-4 border-white flex items-center justify-center transition-all ${
                  isAnalyzing
                    ? "bg-gray-400"
                    : "bg-white/10 active:scale-95"
                }`}
              >
                <div
                  className={`w-20 h-20 rounded-full ${
                    isAnalyzing ? "bg-gray-300" : "bg-white"
                  }`}
                />
              </button>
              <p className="text-white text-lg">
                {isAnalyzing
                  ? "Analyzing..."
                  : "Tap to scan carpet"}
              </p>
            </div>
          </div>

          {/* Hidden file input for camera */}
          <input
            id="camera-input"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            className="hidden"
          />
        </div>
      )}

      {/* Similar Products Results Modal */}
      {similarProducts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="bg-background w-full h-full overflow-y-auto pb-6">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-xl text-card-foreground">
                O'xshash mahsulotlar
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSimilarProducts([])}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              {similarProducts.map((product) => (
                <Card
                  key={product.id}
                  className="overflow-hidden border border-border bg-card transition-all hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
                >
                  <div className="flex space-x-4 p-4">
                    <img
                      src={product.photo}
                      alt={product.name}
                      className="h-24 w-24 rounded-xl object-cover ring-1 ring-border cursor-pointer"
                      onClick={() =>
                        handleSelectProduct(product.id)
                      }
                    />
                    <div className="flex-1">
                      <h3
                        className="mb-1 text-lg text-card-foreground cursor-pointer"
                        onClick={() =>
                          handleSelectProduct(product.id)
                        }
                      >
                        {product.name}
                      </h3>
                      <div className="space-y-1 text-sm">
                        {product.type === "unit" ? (
                          <div className="text-muted-foreground">
                            Qoldiq:{" "}
                            <span className="font-medium text-card-foreground">
                              {product.quantity} dona
                            </span>
                          </div>
                        ) : (
                          <div className="text-muted-foreground">
                            Qoldiq:{" "}
                            <span className="font-medium text-card-foreground">
                              {product.remainingLength} m
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectFromCameraSearch(product);
                        }}
                        className="mt-3 w-full bg-green-600 hover:bg-green-700 h-10"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Savatchaga qo'shish
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}