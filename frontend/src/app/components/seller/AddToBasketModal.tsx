import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Product, BasketItem, useApp } from "../../context/AppContext";
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
      productName: product.code || "Unknown",
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
            Savatga qo'shish
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
                {product.category}
              </p>
              {!isCarpetOrMetraj && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Qoldiq: {maxQuantity}{" "}
                  {isUnit ? "dona" : "metr"}
                </p>
              )}
            </div>
          </div>

          {/* Carpet/Unit Size Input */}
          {(isCarpetOrMetraj || isUnit) && (
            <div className="space-y-4">
              <Label className="block text-lg dark:text-white font-bold">
                O'lchamni kiriting {isMetraj && `(Eni: ${product.width}m)`}
              </Label>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label className="text-xs text-gray-400 mb-1 block">Eni (m)</Label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => {
                      setWidth(e.target.value);
                      setSelectedSize(""); // Reset preset size on manual change
                    }}
                    className="h-12 text-center text-xl dark:bg-gray-700 dark:text-white"
                    min="0.1"
                    step="0.1"
                    placeholder="Eni"
                    readOnly={isMetraj && !!product.width}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-gray-400 mb-1 block">Bo'yi (m)</Label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      setSelectedSize(""); // Reset preset size on manual change
                    }}
                    className="h-12 text-center text-xl dark:bg-gray-700 dark:text-white"
                    min="0.1"
                    step="0.1"
                    placeholder="Bo'yi"
                  />
                </div>
              </div>

              {/* Stock Suggestions for Unit Products or Metraj Rolls */}
              {((isUnit && product.availableSizes && product.availableSizes.length > 0) || (isMetraj && (product.width || (product.availableSizes && product.availableSizes.length > 0)))) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {isUnit ? "Skladda mavjud o'lchamlar:" : "Skladdagi rulonlar:"}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {isUnit && product.availableSizes?.map((s) => {
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
                            {sizeQty} ta qoldi
                          </span>
                        </button>
                      );
                    })}

                    {isMetraj && product.availableSizes?.map((s) => {
                      const sizeName = typeof s === 'string' ? s : (s as any).size;
                      const [w, l] = sizeName.includes('x') ? sizeName.split('x') : [sizeName, ""];
                      const isActive = selectedSize === sizeName;

                      return (
                        <button
                          key={sizeName}
                          onClick={() => {
                            setWidth(w);
                            setHeight(l);
                            setSelectedSize(sizeName);
                          }}
                          className={`flex flex-col items-center justify-center p-2 min-w-[70px] rounded-xl border-2 transition-all ${isActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            : "border-gray-100 dark:border-gray-700 hover:border-blue-200"
                            }`}
                        >
                          <span className={`text-base font-bold ${isActive ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}>
                            {w}{l ? ` x ${l}m` : 'm'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            Rulon
                          </span>
                        </button>
                      );
                    })}

                    {isMetraj && product.width && !product.availableSizes?.length && (
                      <button
                        onClick={() => {
                          setWidth(product.width!.toString());
                          setSelectedSize('fixed-width');
                        }}
                        className={`flex flex-col items-center justify-center p-2 min-w-[60px] rounded-xl border-2 transition-all ${width === product.width.toString()
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-100 dark:border-gray-700 hover:border-blue-200"
                          }`}
                      >
                        <span className={`text-base font-bold ${width === product.width.toString() ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}>
                          {product.width}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          Eni (m)
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {area > 0 && (
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Maydon: {area.toFixed(2)} m²
                </div>
              )}
            </div>
          )}

          {/* Quantity - Not needed for Metrajlar (they use width/height only) */}
          {!isMetraj && (
            <div>
              <Label className="mb-5 block text-lg dark:text-white">
                {isCarpet
                  ? "Soni (dona)"
                  : isUnit
                    ? "Miqdor"
                    : "Metr"}
              </Label>
              {isUnit || isCarpet ? (
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
                    onClick={() =>
                      setQuantity(Math.max(1, quantity - 1))
                    }
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="text-3xl dark:text-white">
                    {quantity}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12"
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
              ) : (
                <Input
                  type="number"
                  value={meters}
                  onChange={(e) => setMeters(e.target.value)}
                  className="h-12 text-center text-xl dark:bg-gray-700 dark:text-white"
                  min="0.1"
                  max={maxQuantity}
                  step="0.1"
                />
              )}
            </div>
          )}

          {/* Price - hidden for carpets as it's calculated from pricePerSquareMeter */}
          {!isCarpetOrMetraj && (
            <div>
              <Label className="mb-3 block text-lg dark:text-white">
                Narx {!isUnit && "(metr uchun)"}
              </Label>
              <Input
                type="number"
                value={sellingPrice * exchangeRate}
                onChange={(e) =>
                  setSellingPrice(
                    (parseFloat(e.target.value) || 0) / exchangeRate,
                  )
                }
                className="h-12 text-xl dark:bg-gray-700 dark:text-white"
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
            Savatga qo'shish
          </Button>
        </div>
      </div>
    </div>
  );
}