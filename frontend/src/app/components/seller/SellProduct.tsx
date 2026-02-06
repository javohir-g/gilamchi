
import { useState } from "react";
import axios from "axios";
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
import { productService } from "../../../services/api";
import { BottomNav } from "../shared/BottomNav";
import { AddToBasketModal } from "./AddToBasketModal";
import { LiveCamera } from "../shared/LiveCamera";
import { AnimatePresence } from "motion/react";
import type { Category } from "../../context/AppContext";
import { toast } from "sonner";

export function SellProduct() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<Category | null>(null);
  const navigate = useNavigate();
  const { products, user, basket, addToBasket, collections } = useApp();

  const categories: {
    name: Category;
    label: string;
    icon: string;
  }[] = [
      { name: "Gilamlar", label: "Gilamlar", icon: "🧵" },
      { name: "Metrajlar", label: "Metrajlar", icon: "📏" },
      { name: "Ovalniy", label: "Ovalniy", icon: "⭕" },
      { name: "Kovrik", label: "Kovrik", icon: "🔲" },
    ];

  const getCollectionIcon = (collectionName?: string) => {
    if (!collectionName) return "";
    const lower = collectionName.toLowerCase();
    if (lower.includes("lara")) return "🌺";
    if (lower.includes("emili") || lower.includes("emily")) return "🌸";
    if (lower.includes("melord")) return "👑";
    if (lower.includes("mashad")) return "🎨";
    if (lower.includes("izmir")) return "✨";
    if (lower.includes("isfahan")) return "🏛️";
    if (lower.includes("prestige")) return "💎";
    if (lower.includes("sultan")) return "🕌";

    // Check if the collection name already has an emoji at the start
    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
    if (emojiRegex.test(collectionName)) return ""; // Already has one

    return "🏷️"; // Default icon
  };

  // Filter products by branch, category, and search
  const filteredProducts = products.filter((product) => {
    const isAdmin = user?.role === "admin";

    // For sellers, we trust the backend to have already filtered by branch.
    // For admins, we allow them to see everything or we could add a branch selector later.
    const matchesBranch =
      user?.role === "seller" ||
      isAdmin ||
      (String(product.branchId).toLowerCase() === String(user?.branchId).toLowerCase());

    const matchesCategory = selectedCategory
      ? product.category === selectedCategory
      : true;
    const matchesCollection = true;
    const matchesSearch =
      (product.code || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (product.category || "")
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
        String(p.branchId) === String(user?.branchId) &&
        p.category === categoryName,
    ).length;
  };

  // Count products per collection for Gilamlar
  const getCollectionCount = (collectionName: string) => {
    return products.filter(
      (p) =>
        String(p.branchId) === String(user?.branchId) &&
        p.category === "Gilamlar" &&
        p.collection === collectionName,
    ).length;
  };

  // Count products per collection for Metrajlar
  const getMetrajCollectionCount = (collectionName: string) => {
    return products.filter(
      (p) =>
        String(p.branchId) === String(user?.branchId) &&
        p.category === "Metrajlar" &&
        p.collection === collectionName,
    ).length;
  };

  const handleSelectProduct = (productId: string) => {
    navigate(`/seller/sell/${productId}`);
  };

  const handleBackButton = () => {
    if (searchQuery) {
      setSearchQuery("");
    } else if (selectedCategory) {
      setSelectedCategory(null);
    } else {
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
  const [isLiveCameraOpen, setIsLiveCameraOpen] = useState(false);

  const handleOpenBasketModal = (
    e: React.MouseEvent,
    product: Product,
  ) => {
    e.stopPropagation();
    setSelectedProduct(product);
  };

  const handleAddToBasketConfirm = (quantity: number) => {
    if (!selectedProduct) return;

    // Construct the basket item correctly
    const item: any = {
      ...selectedProduct,
      quantity,
      selectedLength: selectedProduct.type === 'meter' ? quantity : undefined,
      sellPrice: selectedProduct.type === 'unit'
        ? selectedProduct.sellPrice
        : (selectedProduct.sellPricePerMeter || 0) * quantity
    };

    addToBasket(item);
    toast.success("Mahsulot savatga qo'shildi!");
    setSelectedProduct(null);
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

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    setCameraSearchOpen(false);

    try {
      // Сжимаем изображение перед поиском (клиентская оптимизация)
      // Для поиска достаточно 512x512px, качество 80%
      const compressForSearch = (base64Str: string): Promise<Blob> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 512; // Меньше размер = быстрее поиск (CLIP работает с 224x224)
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_SIZE) {
                height *= MAX_SIZE / width;
                width = MAX_SIZE;
              }
            } else {
              if (height > MAX_SIZE) {
                width *= MAX_SIZE / height;
                height = MAX_SIZE;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
            }, 'image/jpeg', 0.8); // 80% качество
          };
          img.src = base64Str;
        });
      };

      const compressedBlob = await compressForSearch(imageData);
      const file = new File([compressedBlob], "search_optimized.jpg", { type: "image/jpeg" });

      console.log(`Search image optimized: ${(file.size / 1024).toFixed(1)}KB`);

      const response = await productService.searchImage(file, selectedCategory || undefined);
      setSimilarProducts(response);

      if (response.length === 0) {
        toast.info("O'xshash mahsulotlar topilmadi. Boshqa rasm bilan urinib ko'ring.");
      } else {
        toast.success(`${response.length} ta o'xshash mahsulot topildi!`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Rasm orqali qidirishda xatolik bo'ldi. Qaytadan urinib ko'ring.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseCameraSearch = () => {
    setCameraSearchOpen(false);
    setCapturedImage(null);
    setSimilarProducts([]);
    setIsAnalyzing(false);
  };

  const handleSelectFromCameraSearch = (product: Product) => {
    setSelectedProduct(product);

    // Feedback Loop: Add the captured image as a sample for the product
    if (capturedImage) {
      // Background task (don't wait for it)
      (async () => {
        try {
          // imageData is base64, convert to blob
          const response = await fetch(capturedImage);
          const blob = await response.blob();
          await productService.addSample(product.id, blob);
          console.log(`Sample added for product ${product.id}`);
        } catch (err) {
          console.error("Failed to add feedback sample", err);
        }
      })();
    }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const matchedCount = products.filter(p => String(p.branchId) === String(user?.branchId)).length;
              alert(`Debug Info:\n- Total products: ${products.length}\n- User Branch ID: ${user?.branchId}\n- Products matching branch: ${matchedCount}\n- First product branchId: ${products[0]?.branchId}`);
            }}
            className="text-[10px] text-gray-400 opacity-50"
          >
            Diag
          </Button>
        </div>

        {!user?.branchId && user?.role === 'seller' && (
          <div className="mx-4 mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-sm">
            Filialingiz aniqlanmadi. Mahsulotlarni ko'rish uchun profilingizda filial biriktirilgan bo'lishi kerak.
          </div>
        )}

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

      {/* Category Tabs */}
      <div className="px-4 pb-2 whitespace-nowrap overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className={`rounded-full ${selectedCategory === null ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
            onClick={() => setSelectedCategory(null)}
          >
            Barchasi
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.name}
              variant={selectedCategory === cat.name ? "default" : "outline"}
              className={`rounded-full flex items-center gap-2 ${selectedCategory === cat.name ? "bg-blue-600 text-white hover:bg-blue-700" : ""}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Product List View */}
      <div className="p-4 space-y-3">
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
                    alt={product.code}
                    className="w-full aspect-[4/5] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={(e) => handleOpenBasketModal(e, product)}
                  />
                  <div className="p-3 space-y-2">
                    <div className="space-y-1">
                      <h3 className="text-sm font-medium text-card-foreground line-clamp-2">
                        {product.code}
                      </h3>
                      {product.collection && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>{getCollectionIcon(product.collection)}</span>
                          <span className="ml-1">{product.collection}</span>
                        </div>
                      )}
                      {(() => {
                        const collection = collections.find(c => c.name === product.collection);
                        if (collection?.price_usd_per_sqm && (product.category === "Gilamlar" || product.category === "Metrajlar")) {
                          return (
                            <div className="text-xs font-semibold text-green-600 dark:text-green-400">
                              ${collection.price_usd_per_sqm}/m²
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
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
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
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

          <div className="w-full max-w-sm space-y-3 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Rasm orqali qidirish</h2>
              <p className="text-gray-400">Mahsulotni topish uchun rasmga oling yoki yuklang</p>
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white">Qidirilmoqda...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                  onClick={() => {
                    setIsLiveCameraOpen(true);
                  }}
                >
                  <Camera className="w-10 h-10" />
                  <span>Kamera</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-32 flex flex-col items-center justify-center gap-4 bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white"
                  onClick={() => {
                    const input = document.getElementById("camera-input-file") as HTMLInputElement;
                    if (input) input.click();
                  }}
                >
                  <ImageIcon className="w-10 h-10" />
                  <span>Galereya</span>
                </Button>
              </div>
            )}

            {/* Input inputs */}
            <input
              id="camera-input-cam"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input
              id="camera-input-file"
              type="file"
              accept="image/*"
              onChange={handleCameraCapture}
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* Full-Screen Loading Modal for Image Analysis */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}

      {/* Similar Products Results Modal */}
      {similarProducts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="bg-background w-full h-full overflow-y-auto pb-6">
            <div className="sticky top-0 bg-card border-b border-border z-10 shadow-sm">
              <div className="p-4 flex items-center justify-between">
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

              {/* Category Filter in results - Local filtering logic */}
              <div className="px-4 pb-3 whitespace-nowrap overflow-x-auto scrollbar-hide">
                <div className="flex space-x-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    className={`rounded-full h-8 px-3 text-xs ${selectedCategory === null ? "bg-blue-600 text-white" : ""}`}
                    onClick={() => setSelectedCategory(null)}
                  >
                    Barchasi
                  </Button>
                  {categories.map((cat) => (
                    <Button
                      key={cat.name}
                      variant={selectedCategory === cat.name ? "default" : "outline"}
                      className={`rounded-full h-8 px-3 text-xs flex items-center gap-1 ${selectedCategory === cat.name ? "bg-blue-600 text-white" : ""}`}
                      onClick={() => setSelectedCategory(cat.name)}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {similarProducts
                .filter(p => !selectedCategory || p.category === selectedCategory)
                .map((product: any) => (
                  <Card
                    key={product.id}
                    className="overflow-hidden border border-border bg-card transition-all hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-blue-900/10"
                  >
                    <div className="flex space-x-4 p-4">
                      <div className="relative">
                        <img
                          src={product.photo}
                          alt={product.name}
                          className="h-24 w-24 rounded-xl object-cover ring-1 ring-border cursor-pointer"
                          onClick={() =>
                            handleSelectProduct(product.id)
                          }
                        />
                        {/* Similarity Badge - Restored */}
                        {product.similarity_percentage !== undefined && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-50 to-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                            {Math.round(product.similarity_percentage)}%
                          </div>
                        )}
                      </div>
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
                          {/* Sizes Info */}
                          {product.availableSizes && product.availableSizes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {product.availableSizes.map((s: any) => {
                                const sizeName = typeof s === 'string' ? s : s.size;
                                return (
                                  <Badge key={sizeName} variant="secondary" className="px-2 py-0 h-5 text-[10px]">
                                    {sizeName}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}

                          {/* Similarity Info */}
                          {product.similarity_percentage !== undefined && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ✓ {Math.round(product.similarity_percentage)}% o'xshashlik
                              </span>
                            </div>
                          )}
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

      <AnimatePresence>
        {isLiveCameraOpen && (
          <LiveCamera
            onCapture={(img) => {
              setCapturedImage(img);
              analyzeImage(img);
              setIsLiveCameraOpen(false);
            }}
            onClose={() => setIsLiveCameraOpen(false)}
            title="Qidirish uchun rasmga oling"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
