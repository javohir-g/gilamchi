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
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";
import { BottomNav } from "../shared/BottomNav";
import { LiveCamera } from "../shared/LiveCamera";
import { AnimatePresence } from "motion/react";

export function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get product ID from URL if editing
  const { user, addProduct, updateProduct, products, branches, collections: globalCollections, fetchCollectionsForBranch } = useApp();
  const { t } = useLanguage();

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
  const [availableSizes, setAvailableSizes] = useState<any[]>([]);
  const [sizeInput, setSizeInput] = useState("");
  const [sizeQuantityInput, setSizeQuantityInput] = useState("");
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [localCollections, setLocalCollections] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string>(user?.branchId || (branches.length > 0 ? branches[0].id : ""));

  // Update branchId if user or branches load
  useEffect(() => {
    if (user?.branchId) {
      setBranchId(user.branchId.toString());
    } else if (branches.length > 0 && !branchId) {
      setBranchId(branches[0].id.toString());
    }
  }, [user, branches, branchId]);

  // Fetch collections when branchId changes
  useEffect(() => {
    if (branchId) {
      fetchCollectionsForBranch(branchId).then(setLocalCollections);
    } else {
      setLocalCollections([]);
    }
  }, [branchId, fetchCollectionsForBranch]);

  // Use local collections if available, otherwise use global
  const collections = localCollections.length > 0 ? localCollections : globalCollections;

  // Auto-set type based on category
  useEffect(() => {
    if (category === "Metrajlar" && type !== "meter") {
      setType("meter");
    } else if (category === "Gilamlar" && type !== "unit") {
      setType("unit");
    }
  }, [category]);

  // Sync sizeInput for metered rolls
  useEffect(() => {
    if (type === "meter" && width) {
      setSizeInput(width);
    }
  }, [type, width]);

  // Auto-calculate total quantity or length based on sizes/rolls
  useEffect(() => {
    if (type === "unit" && availableSizes.length > 0) {
      const total = availableSizes.reduce((sum, s) => sum + (parseInt(s.quantity) || 0), 0);
      setQuantity(total.toString());
    } else if (type === "meter" && availableSizes.length > 0) {
      const total = availableSizes.reduce((sum, s) => {
        const parts = s.size.split('x');
        const length = parts.length === 2 ? parseFloat(parts[1]) : parseFloat(parts[0]);
        return sum + (length * (parseInt(s.quantity) || 1));
      }, 0);
      setTotalLength(total.toFixed(2));
    }
  }, [availableSizes, type]);

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
        toast.error(t('messages.imageProcessingError'));
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
      const selectedCollectionData = localCollections.find(c => c.name === collection);

      const buyRate = selectedCollectionData?.buy_price_per_sqm || 0;
      const sellRate = selectedCollectionData?.price_per_sqm || 0;

      if (type === "unit" && availableSizes.length > 0) {
        // Redundant check removed, accessing [0] safely
        if (availableSizes.length > 0) {
          const sizeObj = availableSizes[0];
          let sizeStr = "";

          if (typeof sizeObj === 'string') sizeStr = sizeObj;
          else if (typeof sizeObj === 'number') sizeStr = String(sizeObj);
          else if (sizeObj && typeof sizeObj === 'object' && sizeObj.size) sizeStr = String(sizeObj.size);

          if (sizeStr) {
            const parts = sizeStr.split(/x|×|X/).map((v: string) => parseFloat(v));

            if (parts.length === 2) {
              const [w, h] = parts;
              const area = w * h;

              const calculatedBuyPrice = area * buyRate;
              const calculatedSellPrice = area * sellRate;

              if (buyRate > 0) {
                setBuyPriceUsd(calculatedBuyPrice.toFixed(2));
                setBuyPrice(calculatedBuyPrice.toFixed(2));
                setIsUsdPriced(true);
              }
              if (sellRate > 0) {
                setSellPrice(calculatedSellPrice.toFixed(2));
              }
            }
          }
        }
      } else if (type === "meter" && width) {
        const w = parseFloat(width);
        const calculatedBuyPriceMeter = w * buyRate;
        const calculatedSellPriceMeter = w * sellRate;

        if (buyRate > 0) {
          setBuyPriceUsd(calculatedBuyPriceMeter.toFixed(2));
          setBuyPrice(calculatedBuyPriceMeter.toFixed(2));
          setIsUsdPriced(true);
        }
        if (sellRate > 0) {
          setSellPricePerMeter(calculatedSellPriceMeter.toFixed(2));
          setSellPrice(calculatedSellPriceMeter.toFixed(2));
        }
      }
    }
  }, [collection, availableSizes, type, width, products, isEditMode, localCollections]);

  const handleSave = async () => {
    if (!code || !buyPrice || !sellPrice) {
      toast.error(t('messages.fillAllFields'));
      return;
    }

    if (type === "unit" && availableSizes.length === 0) {
      toast.error(t('messages.fillAllFields'));
      return;
    }

    if (
      type === "meter" &&
      (!totalLength || !sellPricePerMeter)
    ) {
      toast.error(t('messages.fillAllFields'));
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

    setIsSaving(true);
    try {
      if (isEditMode && id) {
        await updateProduct(id, {
          ...commonData,
          ...typeSpecificData
        });
        toast.success(t('messages.productUpdated'));
      } else {
        const newProduct = {
          ...commonData,
          ...typeSpecificData,
          id: `p${Date.now()}`,
          branchId: branchId,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        await addProduct(newProduct);
        toast.success(t('messages.productAdded'));
      }
      navigate(-1);
    } catch (error: any) {
      toast.error(t('messages.productAddError'));
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate area and price per m2 for UI preview (if applicable)
  const pricePerM2 = useMemo(() => {
    if (buyPrice && type === "unit" && availableSizes.length > 0) {
      // Just a helper for the first size to give an idea
      const sizeObj = availableSizes[0];
      let sizeStr = "";
      if (typeof sizeObj === 'string') sizeStr = sizeObj;
      else if (typeof sizeObj === 'number') sizeStr = String(sizeObj);
      else if (sizeObj && typeof sizeObj === 'object' && sizeObj.size) sizeStr = String(sizeObj.size);

      if (sizeStr) {
        const parts = sizeStr.split(/x|×|X/).map((v: string) => parseFloat(v));
        if (parts.length === 2) {
          const [w, h] = parts;
          if (w && h) {
            return (parseFloat(buyPrice) / (w * h)).toFixed(2);
          }
        }
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
            {isEditMode ? t('seller.editProduct') : t('product.add')}
          </h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* 1. Rasmi */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
            {t('seller.media')}
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
                  {t('seller.takePhoto')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-xl dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                  onClick={() => triggerFileInput(false)}
                >
                  <ImageIcon className="mr-2 h-5 w-5" />
                  {t('seller.gallery')}
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* 2. Asosiy ma'lumotlar */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
            {t('seller.mainInfo')}
          </h2>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 space-y-5">
            <div>
              <Label className="mb-2 block text-sm font-medium">{t('seller.productCodeArtikul')}</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`${t('common.forExample')}: L-100`}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block text-sm font-medium">{t('common.category')}</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder={t('common.category')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Gilamlar">{t('product.carpets')}</SelectItem>
                    <SelectItem value="Metrajlar">{t('product.meters')}</SelectItem>
                    <SelectItem value="Ovalniy">{t('product.oval')}</SelectItem>
                    <SelectItem value="Kovrik">{t('product.rugs')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block text-sm font-medium">{t('common.branch')}</Label>
                {user?.role === "admin" ? (
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder={t('seller.selectBranch')} />
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
                    {branches.find((b) => b.id === branchId)?.name || t('common.branch')}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label className="mb-2 block text-sm font-medium">{t('common.collection')}</Label>
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
                    <SelectValue placeholder={t('seller.selectCollection')} />
                  </SelectTrigger>
                  <SelectContent>
                    {localCollections.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">{t('common.other')}... ({t('seller.manualEntry')})</SelectItem>
                  </SelectContent>
                </Select>

                {isCustomCollection && (
                  <Input
                    value={customCollection}
                    onChange={(e) => {
                      setCustomCollection(e.target.value);
                      setCollection(e.target.value);
                    }}
                    placeholder={t('seller.enterCollectionName')}
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
            {t('seller.characteristics')}
          </h2>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 space-y-5">
            <div className="space-y-4">
              <Label className="mb-3 block text-sm font-medium text-muted-foreground italic">
                {t('seller.salesMethod')}
              </Label>
              <RadioGroup value={type} onValueChange={(v) => setType(v as ProductType)} className="flex gap-4">
                <div className="flex-1">
                  <RadioGroupItem value="unit" id="type-unit" className="peer sr-only" />
                  <Label
                    htmlFor="type-unit"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 transition-all cursor-pointer"
                  >
                    <span className="font-bold">{t('seller.unitType')}</span>
                    <span className="text-[10px] text-muted-foreground">{t('seller.readySizes')}</span>
                  </Label>
                </div>
                <div className="flex-1">
                  <RadioGroupItem value="meter" id="type-meter" className="peer sr-only" />
                  <Label
                    htmlFor="type-meter"
                    className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-blue-600 [&:has([data-state=checked])]:border-blue-600 transition-all cursor-pointer"
                  >
                    <span className="font-bold">{t('seller.meterType')}</span>
                    <span className="text-[10px] text-muted-foreground">{t('seller.rollType')}</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Type Specific Fields */}
            {type === "unit" ? (
              <div className="space-y-5">
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    {t('seller.readySizes')} ({t('seller.availableSizesInput')})
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      placeholder="2x3"
                      className="h-12 flex-1 rounded-xl"
                    />
                    <Input
                      type="number"
                      value={sizeQuantityInput}
                      onChange={(e) => setSizeQuantityInput(e.target.value)}
                      placeholder={t('common.quantityShort')}
                      className="h-12 w-24 rounded-xl text-center"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const qty = parseInt(sizeQuantityInput) || 1;
                          if (sizeInput && !availableSizes.find(s => s.size === sizeInput)) {
                            setAvailableSizes([...availableSizes, { size: sizeInput, quantity: qty }]);
                            setSizeInput("");
                            setSizeQuantityInput("");
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="h-12 w-12 rounded-xl bg-blue-600"
                      onClick={() => {
                        const qty = parseInt(sizeQuantityInput) || 1;
                        if (sizeInput && !availableSizes.find(s => s.size === sizeInput)) {
                          setAvailableSizes([...availableSizes, { size: sizeInput, quantity: qty }]);
                          setSizeInput("");
                          setSizeQuantityInput("");
                        }
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {availableSizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {availableSizes.map((s) => (
                        <Badge
                          key={s.size}
                          variant="secondary"
                          className="flex items-center py-1.5 px-3 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100 rounded-lg group"
                        >
                          <span className="font-bold mr-1">{s.size}</span>
                          <span className="text-[10px] opacity-70">({s.quantity} {t('common.unit')})</span>
                          <X
                            className="ml-2 h-3.5 w-3.5 cursor-pointer text-blue-400 hover:text-red-500 transition-colors"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setAvailableSizes(availableSizes.filter((item) => item.size !== s.size));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">{t('seller.stockQuantity')}</Label>
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
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    {t('product.width')} ({t('common.meter_short')})
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="0.00"
                      className="h-12 rounded-xl pl-10"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ↔️
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block text-sm font-medium">
                    {t('seller.addRolls')}
                  </Label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        placeholder={`${t('product.width')} (${t('common.meter_short')})`}
                        className="h-12 w-full rounded-xl"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        step="0.1"
                        value={sizeQuantityInput}
                        onChange={(e) => setSizeQuantityInput(e.target.value)}
                        placeholder={`${t('product.height')} (${t('common.meter_short')})`}
                        className="h-12 w-full rounded-xl"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const w = parseFloat(sizeInput);
                            const l = parseFloat(sizeQuantityInput);
                            if (w > 0 && l > 0) {
                              const sizeStr = `${w}x${l}`;
                              if (!availableSizes.find(s => s.size === sizeStr)) {
                                setAvailableSizes([...availableSizes, { size: sizeStr, initial_length: l, quantity: 1 }]);
                                setSizeInput(width);
                                setSizeQuantityInput("");
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      type="button"
                      className="h-12 w-12 rounded-xl bg-blue-600"
                      onClick={() => {
                        const w = parseFloat(sizeInput);
                        const l = parseFloat(sizeQuantityInput);
                        if (w > 0 && l > 0) {
                          const sizeStr = `${w}x${l}`;
                          if (!availableSizes.find(s => s.size === sizeStr)) {
                            setAvailableSizes([...availableSizes, { size: sizeStr, initial_length: l, quantity: 1 }]);
                            setSizeInput(width);
                            setSizeQuantityInput("");
                          }
                        }
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  {availableSizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {availableSizes.map((s) => (
                        <Badge
                          key={s.size}
                          variant="secondary"
                          className="flex items-center py-1.5 px-3 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-100 rounded-lg group"
                        >
                          <span className="font-bold mr-1">{s.size}m</span>
                          <span className="text-[10px] opacity-70">({s.quantity} {t('seller.roll')})</span>
                          <X
                            className="ml-2 h-3.5 w-3.5 cursor-pointer text-green-400 hover:text-red-500 transition-colors"
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setAvailableSizes(availableSizes.filter((item) => item.size !== s.size));
                            }}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* 4. Narxlar */}
        <section className="space-y-3">
          <div className="flex justify-between items-end">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1">
              {t('seller.prices')}
            </h2>
            {pricePerM2 && (
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">
                {t('seller.price')}: {pricePerM2} {t('common.currency')} / {t('common.meter_short')}²
              </span>
            )}
          </div>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700 space-y-5">
            {/* Price inputs hidden as they are calculated automatically from Collection */}
            <div className="hidden">
              <div className="grid grid-cols-1 gap-4">
                <div className="relative">
                  <Input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    value={buyPriceUsd}
                    onChange={(e) => setBuyPriceUsd(e.target.value)}
                  />
                  <Input
                    type="number"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                  />
                  <Input
                    type="number"
                    value={sellPricePerMeter}
                    onChange={(e) => setSellPricePerMeter(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Display Calculated Prices for Verification */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{t('seller.buyPriceAuto')}</Label>
                <div className="text-xl font-bold mt-1 text-slate-700 dark:text-slate-300">
                  ${buyPriceUsd || "0"}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {t('common.collection')}: ${collections.find(c => c.name === collection)?.buy_price_per_sqm || 0}/m²
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                <Label className="text-xs text-blue-600/70 dark:text-blue-400/70 uppercase font-bold tracking-wider">{t('seller.sellToBranch')}</Label>
                <div className="text-xl font-bold mt-1 text-blue-600 dark:text-blue-400">
                  ${parseFloat(sellPrice || "0").toFixed(2)}
                </div>
                <p className="text-[10px] text-blue-500/70 mt-1">
                  {t('common.collection')}: ${collections.find(c => c.name === collection)?.price_per_sqm || 0}/m²
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {/* Fixed Bottom Button - Adjusted for stability */}
      <div className="fixed bottom-0 left-0 right-0 border-t dark:border-gray-700 bg-white/95 backdrop-blur-md dark:bg-gray-800/95 p-4 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <Button
          onClick={handleSave}
          className="h-14 w-full bg-blue-600 hover:bg-blue-700 text-lg font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
          size="lg"
          disabled={isSaving}
        >
          {isSaving ? `${t('common.saving')}...` : (isEditMode ? t('seller.saveEdit') : t('seller.createProduct'))}
        </Button>
      </div>

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