import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { BasketItem, Product, useApp } from "../../context/AppContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

interface EditBasketItemModalProps {
  item: BasketItem;
  product: Product;
  onUpdate: (item: BasketItem) => void;
  onClose: () => void;
}

export function EditBasketItemModal({
  item,
  product,
  onUpdate,
  onClose,
}: EditBasketItemModalProps) {
  const { exchangeRate } = useApp();
  const isUnit = product.type === "unit";
  const isCarpet =
    product.category === "Gilamlar" &&
    product.pricePerSquareMeter !== undefined;
  const isMetraj =
    product.category === "Metrajlar" &&
    product.pricePerSquareMeter !== undefined;
  const isCarpetOrMetraj = isCarpet || isMetraj;
  const maxQuantity = isUnit
    ? product.quantity || 0
    : product.remainingLength || 0;

  // Initialize with existing values
  const [quantity, setQuantity] = useState(isCarpet ? item.quantity : 1);
  const [meters, setMeters] = useState(
    isMetraj && item.area && item.quantity
      ? (item.quantity / item.area).toFixed(1) // Extract meters from quantity
      : !isUnit && !isCarpetOrMetraj
        ? item.quantity.toString()
        : "1"
  );
  const [width, setWidth] = useState(item.width || "");
  const [height, setHeight] = useState(item.height || "");
  const [area, setArea] = useState(item.area || 0);
  const [sellingPrice, setSellingPrice] = useState(item.pricePerUnit * exchangeRate);
  const [selectedSize, setSelectedSize] = useState<string>(item.size || "");

  // Initialize quantity for carpets and units
  useEffect(() => {
    if (isCarpet && item.area && item.quantity) {
      // For carpets, quantity is the number of carpets
      setQuantity(item.quantity);
    } else if (isUnit) {
      setQuantity(item.quantity);
    }
  }, [item, isCarpet, isUnit]);

  // Calculate area when width or height changes
  useEffect(() => {
    if (isCarpetOrMetraj && width && height) {
      const w = parseFloat(width);
      const h = parseFloat(height);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        const calculatedArea = w * h;
        setArea(calculatedArea);
      }
    }
  }, [width, height, isCarpetOrMetraj]);

  // Automate width for Metrajlar
  useEffect(() => {
    if (isMetraj && product.width && !width) {
      setWidth(product.width.toString());
    }
  }, [isMetraj, product.width, width]);

  // Parse width and height from selectedSize
  useEffect(() => {
    if (selectedSize && selectedSize !== "other") {
      const parts = selectedSize.split(/×|x/);
      if (parts.length === 2) {
        setWidth(parts[0].trim());
        setHeight(parts[1].trim());
      }
    }
  }, [selectedSize]);

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

  const handleUpdate = () => {
    const qty = isCarpet
      ? quantity
      : isMetraj
        ? parseFloat(meters)
        : getQuantityValue();

    if (qty <= 0 || (!isCarpetOrMetraj && qty > maxQuantity)) {
      return;
    }

    if (isCarpetOrMetraj && (!width || !height)) {
      return;
    }

    const updatedItem: BasketItem = {
      ...item,
      quantity: qty,
      pricePerUnit: sellingPrice / exchangeRate,
      total: calculateTotal() / exchangeRate,
      size: selectedSize || undefined,
      // Carpet-specific fields
      ...(isCarpetOrMetraj && {
        width,
        height,
        area,
      }),
    };

    onUpdate(updatedItem);
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
            Mahsulotni o'zgartirish
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

          {/* Size Selection */}
          {(isCarpetOrMetraj || (product.availableSizes && product.availableSizes.length > 0)) && (
            <div className="space-y-3">
              <Label className="text-lg dark:text-white">O'lchamni tanlang</Label>
              <Select
                value={selectedSize}
                onValueChange={(val) => {
                  setSelectedSize(val);
                  if (val === "other") {
                    setWidth("");
                    setHeight("");
                    setArea(0);
                  }
                }}
              >
                <SelectTrigger className="h-12 text-lg dark:bg-gray-700 dark:text-white">
                  <SelectValue placeholder="O'lchamni tanlang" />
                </SelectTrigger>
                <SelectContent>
                  {product.availableSizes?.map((s: any) => {
                    const sizeName = typeof s === 'string' ? s : s.size;
                    const sizeQty = typeof s === 'string' ? product.quantity : s.quantity;
                    return (
                      <SelectItem key={sizeName} value={sizeName}>
                        {sizeName} ({sizeQty} dona)
                      </SelectItem>
                    );
                  })}
                  <SelectItem value="other">Boshqa olcham</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Carpet/Metraj Dimensions - Only shown if "Boshqa olcham" or no sizes */}
          {isCarpetOrMetraj && (selectedSize === "other" || !product.availableSizes || product.availableSizes.length === 0) && (
            <div className="space-y-3">
              <Label className="block text-lg dark:text-white">
                O'lchamni kiriting {isMetraj && `(Eni: ${product.width}m)`}
              </Label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Label className="text-xs text-gray-400 mb-1 block">Eni (m)</Label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
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
                    onChange={(e) => setHeight(e.target.value)}
                    className="h-12 text-center text-xl dark:bg-gray-700 dark:text-white"
                    min="0.1"
                    step="0.1"
                    placeholder="Bo'yi"
                  />
                </div>
              </div>
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
                value={sellingPrice}
                onChange={(e) =>
                  setSellingPrice(
                    parseFloat(e.target.value) || 0,
                  )
                }
                className="h-12 text-xl dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Update Button */}
          <Button
            onClick={handleUpdate}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700"
            size="lg"
            disabled={isCarpetOrMetraj && (!width || !height)}
          >
            Saqlash
          </Button>
        </div>
      </div>
    </div>
  );
}