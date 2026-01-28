import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { ArrowLeft, Upload, X, Plus, Camera, Image as ImageIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  useApp,
  Category,
  ProductType,
} from "../../context/AppContext";
import { toast } from "sonner";
import { BottomNav } from "../shared/BottomNav";
import { LiveCamera } from "../shared/LiveCamera";
import { AnimatePresence } from "motion/react";

export function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get product ID from URL if editing
  const { user, addProduct, updateProduct, products, branches } = useApp();

  const isEditMode = Boolean(id);

  const [photo, setPhoto] = useState(
    "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
  );
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<Category>("Gilamlar");
  const [type, setType] = useState<ProductType>("unit");
  const [quantity, setQuantity] = useState("");
  const [totalLength, setTotalLength] = useState("");
  const [width, setWidth] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyPriceUsd, setBuyPriceUsd] = useState("");
  const [isUsdPriced, setIsUsdPriced] = useState(false);
  const [sellPrice, setSellPrice] = useState("");
  const [sellPricePerMeter, setSellPricePerMeter] =
    useState("");
  const [collection, setCollection] = useState("");
  const [customCollection, setCustomCollection] = useState("");
  const [isCustomCollection, setIsCustomCollection] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const predefinedCollections = [
    "🌺 Lara",
    "🌸 Emili",
    "👑 Melord",
    "🎨 Mashad",
    "✨ Izmir",
    "🏛️ Isfahan",
    "💎 Prestige",
    "🕌 Sultan"
  ];
  const [branchId, setBranchId] = useState<string>(user?.branchId || (branches.length > 0 ? branches[0].id : ""));

  // Update branchId if user or branches load
  useEffect(() => {
    if (user?.branchId) {
      setBranchId(user.branchId.toString());
    } else if (branches.length > 0 && !branchId) {
      setBranchId(branches[0].id.toString());
    }
  }, [user, branches, branchId]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Функция для сжатия изображения на клиенте
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          // Создаем canvas для изменения размера
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Максимальный размер 1024x1024
          const MAX_SIZE = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Рисуем изображение с новым размером
          ctx.drawImage(img, 0, 0, width, height);

          // Конвертируем в JPEG с качеством 85%
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

          console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(compressedDataUrl.length / 1024).toFixed(1)}KB`);

          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Сжимаем изображение перед установкой
        const compressedImage = await compressImage(file);
        setPhoto(compressedImage);
      } catch (error) {
        console.error('Error compressing image:', error);
        toast.error('Ошибка при обработке изображения');
      }
    }
  };

  const triggerFileInput = (useCamera: boolean) => {
    if (useCamera) {
      setIsCameraOpen(true);
    } else if (fileInputRef.current) {
      fileInputRef.current.removeAttribute("capture");
      fileInputRef.current.click();
    }
  };

  // Populate form if in edit mode
  useEffect(() => {
    if (isEditMode && products.length > 0) {
      const productToEdit = products.find((p) => p.id === id);
      if (productToEdit) {
        setCode(productToEdit.code);
        setPhoto(productToEdit.photo);
        setCategory(productToEdit.category);
        setType(productToEdit.type);
        setBuyPrice(productToEdit.buyPrice.toString());
        setSellPrice(productToEdit.sellPrice.toString());

        if (productToEdit.type === "unit") {
          setQuantity(productToEdit.quantity?.toString() || "");
        } else {
          setTotalLength(productToEdit.totalLength?.toString() || "");
          setWidth(productToEdit.width?.toString() || "");
          setSellPricePerMeter(productToEdit.sellPricePerMeter?.toString() || "");
        }

        if (productToEdit.branchId) {
          setBranchId(productToEdit.branchId.toString());
        }
      } else {
        toast.error("Mahsulot topilmadi");
        navigate("/seller/home");
      }
    }
  }, [id, products, isEditMode, navigate]);

  // Auto-calculate sell price when collection or size changes
  useEffect(() => {
    if (collection && !isEditMode) {
      // Find the collection to get its price_per_sqm
      // In this app, collections are just strings in predefinedCollections, 
      // but ManageCollections now allows setting price_per_sqm which goes to the backend.
      // We should ideally have a collections list in AppContext.

      // For now, let's try to find an existing product from this collection to "infer" the price,
      // or assuming we update AppContext to provide collections.
      const collName = collection.replace(/^[^\s]+\s/, ""); // Remove emoji
      // This is a placeholder - in a real scenario we'd use useApp().collections
      const collPrice = 15; // Default or fetched from a new collections list

      if (type === "unit" && availableSizes.length > 0) {
        const [w, h] = availableSizes[0].split(/x|×|X/).map(v => parseFloat(v));
        if (w && h) {
          const calculatedPrice = w * h * collPrice;
          setSellPrice(calculatedPrice.toString());
        }
      } else if (type === "meter" && width) {
        setSellPricePerMeter(collPrice.toString());
      }
    }
  }, [collection, availableSizes, type, width, products, isEditMode]);

  const handleSave = async () => {
    if (!code || !buyPrice || !sellPrice) {
      toast.error("Barcha maydonlarni to'ldiring!");
      return;
    }

    if (type === "unit" && !quantity) {
      toast.error("Miqdorni kiriting!");
      return;
    }

    if (
      type === "meter" &&
      (!totalLength || !sellPricePerMeter)
    ) {
      toast.error("Metr va narxni kiriting!");
      return;
    }

    const commonData = {
      code,
      category,
      type,
      photo,
      buyPrice: parseFloat(buyPrice),
      buyPriceUsd: buyPriceUsd ? parseFloat(buyPriceUsd) : undefined,
      isUsdPriced,
      sellPrice: parseFloat(sellPrice),
      collection,
      availableSizes,
    };

    const typeSpecificData = type === "unit"
      ? { quantity: parseInt(quantity) }
      : {
        totalLength: parseFloat(totalLength),
        remainingLength: parseFloat(totalLength),
        width: width ? parseFloat(width) : undefined,
        sellPricePerMeter: parseFloat(sellPricePerMeter),
      };

    if (isEditMode && id) {
      const productToEdit = products.find((p) => p.id === id);
      let finalTypeData = { ...typeSpecificData };

      if (productToEdit && productToEdit.type === 'meter' && type === 'meter') {
        if (productToEdit.totalLength === parseFloat(totalLength)) {
          finalTypeData.remainingLength = productToEdit.remainingLength || parseFloat(totalLength);
        } else {
          if (productToEdit.totalLength !== parseFloat(totalLength)) {
            finalTypeData.remainingLength = parseFloat(totalLength);
          } else {
            finalTypeData.remainingLength = productToEdit.remainingLength;
          }
        }
      }

      try {
        await updateProduct(id, {
          ...commonData,
          ...finalTypeData
        });
        toast.success("Mahsulot yangilandi!");
        navigate(-1);
      } catch (error: any) {
        toast.error("Xatolik: " + error.message);
      }
    } else {
      // Create - с оптимистичным обновлением
      const newProduct = {
        id: `p${Date.now()}`,
        branchId: branchId,
        ...commonData,
        ...typeSpecificData
      };

      try {
        // Показываем мгновенный успех
        toast.success("Mahsulot qo'shildi!");

        // Мгновенно переходим назад (оптимистичное обновление в AppContext)
        navigate("/seller/home");

        // API вызов происходит в фоне через AppContext
        await addProduct(newProduct);

      } catch (error: any) {
        console.error("Error adding product:", error);
        // Если ошибка - показываем уведомление (пользователь уже на другой странице)
        toast.error("Mahsulot qo'shishda xatolik bo'ldi: " + (error.response?.data?.detail || error.message));
      }
    }
  };

  // Calculate area and price per m2 for UI preview (if applicable)
  const pricePerM2 = useMemo(() => {
    if (buyPrice && type === "unit" && availableSizes.length > 0) {
      // Just a helper for the first size to give an idea
      const [w, h] = availableSizes[0].split(/x|×/).map(v => parseFloat(v));
      if (w && h) {
        return (parseFloat(buyPrice) / (w * h)).toFixed(2);
      }
    }
    return null;
  }, [buyPrice, availableSizes, type]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-48">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-xl font-bold dark:text-white">
            {isEditMode ? "Mahsulotni tahrirlash" : "Mahsulot qo'shish"}
          </h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 1. Rasmi */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
            Media
          </h2>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {photo ? (
                <div className="relative">
                  <img
                    src={photo}
                    alt="Product"
                    className="h-64 w-full rounded-2xl object-cover ring-1 ring-border shadow-inner"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 rounded-full shadow-lg"
                    onClick={() =>
                      setPhoto(
                        "https://via.placeholder.com/400x500?text=Kafit+Rasm",
                      )
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-48 w-full rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => triggerFileInput(true)}
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Rasmga olish
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => triggerFileInput(false)}
                >
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Galereya
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. Asosiy ma'lumotlar */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
            Asosiy ma'lumotlar
          </h2>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 space-y-5">
            <div>
              <Label className="mb-2 block text-sm font-medium">Mahsulot kodi (Artikul)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Masalan: L-100"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">Kategoriya</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gilamlar">Gilamlar</SelectItem>
                    <SelectItem value="Metrajlar">Metrajlar</SelectItem>
                    <SelectItem value="Ovalniy">Ovalniy</SelectItem>
                    <SelectItem value="Kovrik">Kovrik</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">Filial</Label>
                {user?.role === "admin" ? (
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="h-12 flex items-center px-3 bg-secondary/30 rounded-xl border border-border text-sm">
                    {branches.find((b) => b.id === branchId)?.name || "Filial nomi"}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">Kolleksiya</Label>
              <div className="space-y-3">
                <Select
                  value={isCustomCollection ? "custom" : collection}
                  onValueChange={(v) => {
                    if (v === "custom") {
                      setIsCustomCollection(true);
                    } else {
                      setIsCustomCollection(false);
                      setCollection(v);
                    }
                  }}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Kolleksiyani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {predefinedCollections.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Boshqa... (Qo'lda kiritish)</SelectItem>
                  </SelectContent>
                </Select>

                {isCustomCollection && (
                  <Input
                    value={customCollection}
                    onChange={(e) => {
                      setCustomCollection(e.target.value);
                      setCollection(e.target.value);
                    }}
                    placeholder="Kolleksiya nomini kiriting..."
                    className="h-12 rounded-xl"
                  />
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* 3. Tavsifi (Dona vs Metr) */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
            Xarakteristikalar
          </h2>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 space-y-5">
            <div>
              <Label className="mb-3 block text-sm font-medium text-muted-foreground italic">
                Sotish usuli
              </Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as ProductType)} className="flex gap-4">
                <div className="flex-1">
                  <RadioGroupItem value="unit" id="type-unit" className="peer sr-only" />
                  <Label
                    htmlFor="type-unit"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 transition-all cursor-pointer"
                  >
                    <span className="font-bold">Dona</span>
                    <span className="text-[10px] text-muted-foreground">Tayyor o'lchamlar</span>
                  </Label>
                </div>
                <div className="flex-1">
                  <RadioGroupItem value="meter" id="type-meter" className="peer sr-only" />
                  <Label
                    htmlFor="type-meter"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 transition-all cursor-pointer"
                  >
                    <span className="font-bold">Metr</span>
                    <span className="text-[10px] text-muted-foreground">Rulonli (kesib beriladi)</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Type Specific Fields */}
            {type === "unit" ? (
              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    Mavjud o'lchamlar (masalan: 2x3)
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder="2x3"
                      className="h-12 flex-1 rounded-xl"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (sizeInput && !availableSizes.includes(sizeInput)) {
                            setAvailableSizes([...availableSizes, sizeInput]);
                            setSizeInput("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="h-12 w-12 rounded-xl bg-blue-600"
                      onClick={() => {
                        if (sizeInput && !availableSizes.includes(sizeInput)) {
                          setAvailableSizes([...availableSizes, sizeInput]);
                          setSizeInput("");
                        }
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {availableSizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {availableSizes.map((size) => (
                        <Badge
                          key={size}
                          variant="secondary"
                          className="flex items-center py-1.5 px-3 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100 rounded-lg group"
                        >
                          {size}
                          <X
                            className="ml-2 h-3.5 w-3.5 cursor-pointer opacity-50 group-hover:opacity-100"
                            onClick={() => setAvailableSizes(availableSizes.filter((s) => s !== size))}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">Ombordagi mavjud soni</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="0"
                      className="h-12 rounded-xl pl-10"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      📦
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Rulon uzunligi (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={totalLength}
                      onChange={(e) => setTotalLength(e.target.value)}
                      placeholder="Masalan: 25"
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Rulon eni (m)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="Masalan: 3"
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* 4. Narxlar */}
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
              Narxlar
            </h2>
            {pricePerM2 && (
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                ~ {pricePerM2} so'm / m²
              </span>
            )}
          </div>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Sotib olish narxi (Tan narx)</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground mr-1">USD bilan kiritish</span>
                  <input
                    type="checkbox"
                    checked={isUsdPriced}
                    onChange={(e) => setIsUsdPriced(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-xl pl-12 text-lg font-semibold"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                    UZS
                  </div>
                </div>
                {isUsdPriced && (
                  <div className="relative">
                    <Input
                      type="number"
                      value={buyPriceUsd}
                      onChange={(e) => setBuyPriceUsd(e.target.value)}
                      placeholder="0.00"
                      className="h-12 rounded-xl pl-10 text-lg font-semibold"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      $
                    </div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-1 italic">
                * Bitta dona yoki butun rulon uchun
              </p>
            </div>

            <div className={`grid ${type === "meter" ? "grid-cols-2" : "grid-cols-1"} gap-4`}>
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  {type === "meter" ? "Sotish (butun rulon)" : "Sotish narxi"}
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    placeholder="0"
                    className="h-12 rounded-xl pl-12 text-lg font-semibold text-green-600"
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">
                    UZS
                  </div>
                </div>
              </div>

              {type === "meter" && (
                <div>
                  <Label className="mb-2 block text-sm font-medium text-blue-600">Metr uchun narx</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={sellPricePerMeter}
                      onChange={(e) => setSellPricePerMeter(e.target.value)}
                      placeholder="0"
                      className="h-12 rounded-xl pl-12 text-lg font-semibold border-blue-200 bg-blue-50/10"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 font-bold">
                      m
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>

      {/* Fixed Bottom Button - Adjusted for stability */}
      <div className="fixed bottom-16 left-0 right-0 border-t dark:border-gray-700 bg-white/95 backdrop-blur-md dark:bg-gray-800/95 p-4 z-20 shadow-2xl">
        <Button
          onClick={handleSave}
          className="h-14 w-full bg-blue-600 hover:bg-blue-700 text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
          size="lg"
        >
          {isEditMode ? "Tahrirlashni saqlash" : "Mahsulotni yaratish"}
        </Button>
      </div>

      <BottomNav />

      <AnimatePresence>
        {isCameraOpen && (
          <LiveCamera
            onCapture={(img) => {
              setPhoto(img);
              setIsCameraOpen(false);
            }}
            onClose={() => setIsCameraOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}