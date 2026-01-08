import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Product, BasketItem } from "../../context/AppContext";

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

  const [quantity, setQuantity] = useState(1);
  const [meters, setMeters] = useState("1");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [area, setArea] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(
    isCarpetOrMetraj
      ? product.pricePerSquareMeter || 0
      : isUnit
        ? product.sellPrice
        : product.sellPricePerMeter || 0,
  );

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

    const item: BasketItem = {
      id: `b${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID
      productId: product.id,
      productName: product.name,
      category: product.category,
      type: product.type,
      quantity: qty,
      pricePerUnit: sellingPrice,
      total: calculateTotal(),
      photo: product.photo,
      // Carpet-specific fields
      ...(isCarpetOrMetraj && {
        width,
        height,
        area,
      }),
    };

    onAdd(item);
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ").format(amount) + " so'm"
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[95vh] overflow-y-auto">
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

          {/* Carpet Size Selection */}
          {isCarpetOrMetraj && (
            <div>
              <Label className="mb-3 block text-lg dark:text-white">
                O'lchamni kiriting
              </Label>
              <div className="flex items-center space-x-4">
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="h-12 text-center text-xl dark:bg-gray-700 dark:text-white"
                  min="0.1"
                  step="0.1"
                  placeholder="Eni"
                />
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
              {area > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
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