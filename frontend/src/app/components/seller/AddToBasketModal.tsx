import { useState, useEffect, useMemo } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Product, BasketItem, useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface AddToBasketModalProps {
  product: Product;
  onAdd: (item: BasketItem) => void;
  onClose: () => void;
}

export function AddToBasketModal({
  product,
  onAdd,
  onClose,
}: AddToBasketModalProps) {
  const { collections, exchangeRate } = useApp();
  const { t } = useLanguage();
  const isUnit = product.type === "unit";
  const isCarpet = product.category === "Gilamlar";
  const isMetraj = product.category === "Metrajlar";
  const isCarpetOrMetraj = isCarpet || isMetraj;

  const [quantity, setQuantity] = useState(1);
  const [meters, setMeters] = useState("1");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [area, setArea] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSizeObj, setSelectedSizeObj] = useState<any>(null);

  const filteredSizes = useMemo(() => {
    if (!product.availableSizes) return [];
    if (isMetraj) return product.availableSizes; // Metraj rolls are managed differently

    return product.availableSizes.filter((s) => {
      const sizeStr = typeof s === "string" ? s : s.size;
      const parts = sizeStr.split(/×|x/);
      if (parts.length !== 2) return true;

      const [w, h] = parts.map((p: string) => p.trim());

      // If user selected a specific size dropdown, we keep it visible
      if (selectedSize === sizeStr) return true;

      // Filter by manual input
      const widthMatch = !width || w.startsWith(width) || w === width;
      const heightMatch = !height || h.startsWith(height) || h === height;

      return widthMatch && heightMatch;
    });
  }, [product.availableSizes, width, height, isMetraj, selectedSize]);

  // Determine initial price
  const getInitialPrice = () => {
    // 1. If it has a specific m2 price, use it
    if (product.pricePerSquareMeter) return product.pricePerSquareMeter;

    // 2. If it's a carpet/metraj, try to find collection price
    if (isCarpetOrMetraj && product.collection) {
      const coll = collections.find(c => c.name === product.collection);
      if (coll?.price_per_sqm) return coll.price_per_sqm;
    }

    // 3. Fallback to sellPrice or sellPricePerMeter
    return isUnit ? product.sellPrice : (product.sellPricePerMeter || 0);
  };

  const [sellingPrice, setSellingPrice] = useState(getInitialPrice());

  // Max quantity calculation
  const maxQuantity = isUnit
    ? (selectedSizeObj ? selectedSizeObj.quantity : (product.quantity || 0))
    : product.remainingLength || 0;

  // Calculate area when width or height changes
  useEffect(() => {
    if ((isCarpetOrMetraj || selectedSize) && width && height) {
      const w = parseFloat(width);
      const h = parseFloat(height);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        const calculatedArea = w * h;
        setArea(calculatedArea);
      }
    }
  }, [width, height, isCarpetOrMetraj, selectedSize]);

  // Automate width for Metrajlar
  useEffect(() => {
    if (isMetraj && product.width && !width) {
      setWidth(product.width.toString());
    }
  }, [isMetraj, product.width, width]);

  // Parse width and height from selectedSize
  useEffect(() => {
    if (selectedSize) {
      const parts = selectedSize.split(/×|x/);
      if (parts.length === 2) {
        setWidth(parts[0].trim());
        setHeight(parts[1].trim());
      }

      // Update selectedSizeObj if availableSizes is updated
      if (product.availableSizes) {
        const found = product.availableSizes.find(s =>
          (typeof s === 'string' ? s : s.size) === selectedSize
        );
        setSelectedSizeObj(typeof found === 'string' ? { size: found, quantity: product.quantity } : found);
      }
    }
  }, [selectedSize, product.availableSizes, product.quantity]);

  const getQuantityValue = () => {
    if (isCarpet) {
      return area * quantity; // For carpets: number of carpets × area
    }
    if (isMetraj) {
      return area * parseFloat(meters); // For metraj: meters × area
    }
    return isUnit ? quantity : parseFloat(meters);
  };

  const calculateTotal = () => {
    if (isCarpet) {
      // For carpets: total = area × price per m² × number of carpets
      return area * sellingPrice * quantity;
    }
    if (isMetraj) {
      // For metraj: total = area × price per m² × meters
      return area * sellingPrice * parseFloat(meters);
    }
    return getQuantityValue() * sellingPrice;
  };

  const handleAdd = () => {
    const qty = isMetraj
      ? parseFloat(height)
      : isUnit
        ? quantity
        : parseFloat(meters);

    if (qty <= 0 || qty > maxQuantity) {
      return;
    }

    if (isCarpetOrMetraj && (!width || !height)) {
      return;
    }

    const item: BasketItem = {
      id: `b${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      productId: product.id,
      productName: product.code || t('debt.unknown'),
      category: product.category,
      type: product.type,
      quantity: qty,
      pricePerUnit: sellingPrice,
      total: calculateTotal(),
      photo: product.photo,
      collection: product.collection || "",
      size: selectedSize || undefined,
      // Carpet-specific or Size-specific fields
      ...((isCarpetOrMetraj || selectedSize) && {
        width,
        height,
        area,
      }),
    };

    onAdd(item);
    onClose();
  };

  const formatCurrency = (amount: number, currency: "USD" | "UZS" = "UZS") => {
    if (currency === "UZS") {
      return new Intl.NumberFormat("uz-UZ", {
        style: "currency",
        currency: "UZS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 pb-24 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl dark:text-white">
            {t('seller.addToBasket')}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6 dark:text-white" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Info */}
          <div className="flex gap-4">
            <img
              src={product.photo}
              alt={product.name}
              className="h-20 w-20 rounded-lg object-cover"
            />
            <div>
              <h3 className="text-lg dark:text-white">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {product.collection} ({product.category})
              </p>
              {!isCarpetOrMetraj && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('product.inStock')}: {maxQuantity}{" "}
                  {isUnit ? t('common.unit') : t('common.meter')}
                </p>
              )}
            </div>
          </div>

          {/* Roll Selection for Metraj Products - AT THE TOP */}
          {isMetraj && (
            <div className="space-y-3">
              <Label className="text-base font-bold dark:text-white">
                {t('seller.selectRoll')}
              </Label>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes?.map((s: any, idx: number) => {
                  const sizeName = typeof s === 'string' ? s : s.size;
                  const [w, l] = sizeName.split('x').map(parseFloat);
                  const isActive = selectedSize === sizeName;

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setWidth(w.toString());
                        setSelectedSize(sizeName);
                        // Optional: Reset height if it exceeds new max
                        if (parseFloat(height) > l) setHeight("");
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 min-w-[80px] rounded-2xl border-2 transition-all ${isActive
                        ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-100 dark:border-gray-700 hover:border-blue-200"
                        }`}
                    >
                      <span className={`text-lg font-black ${isActive ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}>
                        {w}m
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        {t('seller.lengthLeft').replace('{count}', l.toFixed(1))}
                      </span>
                    </button>
                  );
                })}

                {/* Fixed width fallback if no rolls defined */}
                {product.width && (!product.availableSizes || product.availableSizes.length === 0) && (
                  <button
                    onClick={() => {
                      setWidth(product.width!.toString());
                      setSelectedSize('fixed');
                    }}
                    className={`flex flex-col items-center justify-center p-2.5 min-w-[80px] rounded-2xl border-2 transition-all ${width === product.width.toString()
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-100 dark:border-gray-700 hover:border-blue-200"
                      }`}
                  >
                    <span className={`text-lg font-black ${width === product.width.toString() ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}>
                      {product.width}{t('common.meterShort')}
                    </span>
                    <span className="text-[10px] text-gray-500 font-medium">
                      {t('seller.baseWidth')}
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Size/Quantity Inputs */}
          {(isCarpetOrMetraj || isUnit) && (
            <div className="space-y-4 pt-2 border-t dark:border-gray-700">
              <Label className="block text-lg dark:text-white font-bold">
                {isMetraj ? t('seller.enterLength') : t('seller.enterSize')}
              </Label>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label className="text-xs text-gray-400 mb-1 block">{t('product.width')}</Label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => {
                      setWidth(e.target.value);
                      setSelectedSize("");
                    }}
                    className="h-12 text-center text-xl dark:bg-gray-700 dark:text-white font-bold"
                    min="0.1"
                    step="0.1"
                    placeholder={t('product.width')}
                    readOnly={isMetraj && (!!product.width || (product.availableSizes && product.availableSizes.length > 0))}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-400 mb-1 block">{t('product.height')} {isMetraj && selectedSize && `(${t('common.max')}: ${maxQuantity}${t('common.meterShort')})`}</Label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      if (!isMetraj) setSelectedSize("");
                    }}
                    className="h-12 text-center text-xl dark:bg-gray-700 dark:text-white font-bold"
                    min="0.1"
                    max={isMetraj ? maxQuantity : undefined}
                    step="0.1"
                    placeholder={t('product.height')}
                  />
                </div>
              </div>

              {/* Stock Suggestions for UNIT Products ONLY (Metraj handled above) */}
              {isUnit && product.availableSizes && product.availableSizes.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('seller.availableSizesStock')}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {filteredSizes.map((s) => {
                      const sizeName = typeof s === 'string' ? s : s.size;
                      const sizeQty = typeof s === 'string' ? product.quantity : s.quantity;
                      const isActive = selectedSize === sizeName;

                      return (
                        <button
                          key={sizeName}
                          onClick={() => {
                            setSelectedSize(sizeName);
                          }}
                          className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${isActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-100 dark:border-gray-700 hover:border-blue-200"
                            }`}
                        >
                          <span className={`text-base font-bold ${isActive ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}>
                            {sizeName}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {t('seller.left').replace('{count}', sizeQty.toString())}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {area > 0 && (
                <div className="mt-1 text-base text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl flex justify-between items-center">
                  <span>{t('seller.totalArea')}</span>
                  <span>{area.toFixed(2)} m²</span>
                </div>
              )}
            </div>
          )}

          {/* Quantity - For UNIT/CARPET only */}
          {(isUnit || isCarpet) && (
            <div className="pt-2 border-t dark:border-gray-700">
              <Label className="mb-4 block text-lg dark:text-white font-bold">
                {isCarpet ? t('seller.quantityUnit') : t('seller.quantity')}
              </Label>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={() =>
                    setQuantity(Math.max(1, quantity - 1))
                  }
                  disabled={quantity <= 1}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-3xl dark:text-white font-black">
                  {quantity}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-xl"
                  onClick={() =>
                    setQuantity(
                      isUnit
                        ? Math.min(maxQuantity, quantity + 1)
                        : quantity + 1,
                    )
                  }
                  disabled={isUnit && quantity >= maxQuantity}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Price - hidden for carpets/metraj as they use collection price */}
          {!isCarpetOrMetraj && (
            <div className="pt-2 border-t dark:border-gray-700">
              <Label className="mb-3 block text-lg font-bold dark:text-white">
                {t('seller.price')} {!isUnit && t('seller.perMeter')}
              </Label>
              <Input
                type="number"
                value={sellingPrice * exchangeRate}
                onChange={(e) =>
                  setSellingPrice(
                    (parseFloat(e.target.value) || 0) / exchangeRate,
                  )
                }
                className="h-12 text-xl dark:bg-gray-700 dark:text-white font-bold"
              />
            </div>
          )}

          {/* Add Button */}
          <Button
            onClick={handleAdd}
            className="w-full h-12 bg-green-600 hover:bg-green-700"
            size="lg"
            disabled={isCarpetOrMetraj && (!width || !height)}
          >
            {t('seller.addToBasket')}
          </Button>
        </div>
      </div>
    </div>
  );
}