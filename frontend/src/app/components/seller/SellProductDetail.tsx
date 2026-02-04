import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useApp, PaymentType } from '../../context/AppContext';
import { toast } from 'sonner';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function SellProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, user, addSale } = useApp();

  const product = products.find((p) => p.id === productId);

  const [isNasiya, setIsNasiya] = useState(false);
  const { collections } = useApp();

  const isUnit = product?.type === 'unit';

  const [quantity, setQuantity] = useState(1);
  const [meters, setMeters] = useState('1');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [sellingPrice, setSellingPrice] = useState(
    isUnit ? product?.sellPrice || 0 : product?.sellPricePerMeter || 0
  );

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSizeObj, setSelectedSizeObj] = useState<any>(null);
  const [area, setArea] = useState(0);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Update price when Nasiya toggle or product changes
  useEffect(() => {
    if (!product) return;

    if (isNasiya && product.collection) {
      const coll = collections.find(c => c.name === product.collection);
      if (coll?.price_nasiya_per_sqm) {
        setSellingPrice(coll.price_nasiya_per_sqm);
        return;
      }
    }

    setSellingPrice(isUnit ? product.sellPrice : product?.sellPricePerMeter || 0);
  }, [isNasiya, product, collections, isUnit]);

  // Parse width and height from selectedSize
  useEffect(() => {
    if (selectedSize) {
      const parts = selectedSize.split(/×|x/);
      if (parts.length === 2) {
        setWidth(parts[0].trim());
        setHeight(parts[1].trim());
      }

      // Update selectedSizeObj if availableSizes is updated
      if (product?.availableSizes) {
        const found = product.availableSizes.find(s =>
          (typeof s === 'string' ? s : s.size) === selectedSize
        );
        setSelectedSizeObj(typeof found === 'string' ? { size: found, quantity: product.quantity } : found);
      }
    }
  }, [selectedSize, product?.availableSizes, product?.quantity]);

  // Calculate area when width or height changes
  useEffect(() => {
    if (width && height) {
      const w = parseFloat(width);
      const h = parseFloat(height);
      if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        const calculatedArea = w * h;
        setArea(calculatedArea);
      }
    }
  }, [width, height]);

  if (!product) {
    return <div>Mahsulot topilmadi</div>;
  }

  const isCarpet = product.category === "Gilamlar";
  const isMetraj = product.category === "Metrajlar";
  const isCarpetOrMetraj = isCarpet || isMetraj;

  const maxQuantity = isUnit
    ? (selectedSizeObj ? selectedSizeObj.quantity : (product.quantity || 0))
    : product.remainingLength || 0;

  const calculateTotal = () => {
    if (isCarpet) {
      // For carpets: total = area × price per m² × number of carpets
      return area > 0 ? area * sellingPrice * quantity : quantity * sellingPrice;
    }
    if (isUnit) {
      return quantity * sellingPrice;
    } else {
      return parseFloat(meters) * sellingPrice;
    }
  };

  const handleSell = () => {
    if (!user) return;

    const saleQuantity = isUnit ? quantity : parseFloat(meters);

    if (saleQuantity <= 0 || saleQuantity > maxQuantity) {
      toast.error('Noto\'g\'ri miqdor!');
      return;
    }

    if (isCarpetOrMetraj && !selectedSize && (!width || !height)) {
      // If it's a carpet but no size selected or entered (though here we should probably enforce selection if available)
    }

    const totalAmount = calculateTotal();

    let standardPrice = isUnit ? product.sellPrice : (product.sellPricePerMeter || 0);

    if (isNasiya && product.collection) {
      const coll = collections.find(c => c.name === product.collection);
      if (coll?.price_nasiya_per_sqm) {
        standardPrice = coll.price_nasiya_per_sqm;
      }
    }

    const standardTotal = isCarpet && area > 0
      ? area * standardPrice * saleQuantity
      : saleQuantity * standardPrice;

    const extraProfit = totalAmount - standardTotal;

    addSale({
      id: `s${Date.now()}`,
      productId: product.id,
      productName: product.code || "Unknown",
      quantity: saleQuantity,
      amount: totalAmount,
      paymentType,
      branchId: product.branchId,
      sellerId: user.id,
      date: new Date().toISOString(),
      profit: extraProfit,
      type: product.type,
      width: width ? parseFloat(width) : (product.type === 'meter' ? product.width : undefined),
      length: height ? parseFloat(height) : (product.type === 'meter' ? saleQuantity : undefined),
      area: area > 0 ? area : ((product.type === 'meter' && product.width) ? (product.width * saleQuantity) : undefined),
      size: selectedSize || undefined,
      isNasiya: isNasiya,
    });

    toast.success('Mahsulot sotildi!');
    navigate('/seller/home');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/seller/sell')}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl">Sotish</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Product Info */}
        <Card className="overflow-hidden">
          <img
            src={product.photo}
            alt={product.name}
            className="h-48 w-full object-cover"
          />
          <div className="p-4">
            <h2 className="mb-1 text-xl">{product.name}</h2>
            <p className="text-sm text-gray-500">{product.category}</p>

            {/* Price Type Toggle */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mt-4">
              <button
                onClick={() => setIsNasiya(false)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${!isNasiya
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Sotish
              </button>
              <button
                onClick={() => setIsNasiya(true)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${isNasiya
                  ? "bg-white shadow-sm text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                Nasiya
              </button>
            </div>
          </div>
        </Card>

        {/* Size Selection */}
        {(isCarpetOrMetraj || (product.availableSizes && product.availableSizes.length > 0)) && (
          <Card className="p-6 space-y-3">
            <Label className="text-lg">O'lchamni tanlang</Label>
            <Select
              value={selectedSize}
              onValueChange={(val) => {
                setSelectedSize(val);
                if (val !== "other") {
                  // Effect handles width/height/area
                } else {
                  setWidth("");
                  setHeight("");
                  setArea(0);
                }
              }}
            >
              <SelectTrigger className="h-14 text-xl">
                <SelectValue placeholder="O'lchamni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {product.availableSizes?.map((s) => {
                  const sizeName = typeof s === 'string' ? s : s.size;
                  const sizeQty = typeof s === 'string' ? product.quantity : s.quantity;
                  return (
                    <SelectItem key={sizeName} value={sizeName}>
                      {sizeName} ({sizeQty} dona)
                    </SelectItem>
                  );
                })}
                {isCarpetOrMetraj && (
                  <SelectItem value="other">Boshqa olcham</SelectItem>
                )}
              </SelectContent>
            </Select>
            {area > 0 && selectedSize !== "other" && (
              <div className="text-sm text-gray-500">
                Maydon: {area.toFixed(2)} m²
              </div>
            )}
          </Card>
        )}

        {/* Manual Size Input for Carpet/Metraj if "Boshqa olcham" selected or no sizes available */}
        {isCarpetOrMetraj && (selectedSize === "other" || !product.availableSizes || product.availableSizes.length === 0) && (
          <Card className="p-6">
            <Label data-slot="label" className="items-center gap-2 font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 mb-3 block text-lg dark:text-white">
              O'lchamni kiriting
            </Label>
            <div className="flex items-center space-x-4">
              <Input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="h-14 text-center text-2xl"
                min="0.1"
                step="0.1"
                placeholder="Eni"
              />
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="h-14 text-center text-2xl"
                min="0.1"
                step="0.1"
                placeholder="Bo'yi"
              />
            </div>
            {area > 0 && (
              <div className="mt-3 text-sm text-gray-500">
                Maydon: {area.toFixed(2)} m²
              </div>
            )}
          </Card>
        )}

        {/* Quantity/Meters */}
        <Card className="p-6">
          <Label className="mb-4 block text-lg">
            {isUnit ? 'Miqdor' : 'Metr'}
          </Label>

          {isUnit ? (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-6 w-6" />
              </Button>
              <div className="text-4xl">{quantity}</div>
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
              >
                <Plus className="h-6 w-6" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="number"
                value={meters}
                onChange={(e) => setMeters(e.target.value)}
                className="h-14 text-center text-2xl"
                min="0.1"
                max={maxQuantity}
                step="0.1"
              />
              <p className="text-sm text-gray-500">
                Qoldiq: {product.remainingLength} metr
              </p>
            </div>
          )}
        </Card>

        {/* Price */}
        <Card className="p-6">
          <Label className="mb-4 block text-lg">
            Sotish narxi {!isUnit && '(metr uchun)'}
          </Label>
          <Input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
            className="h-14 text-2xl"
          />
        </Card>

        {/* Payment Type */}
        <Card className="p-6">
          <Label className="mb-4 block text-lg">To'lov turi</Label>
          <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer text-lg">
                  Naqd pul
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer text-lg">
                  Karta
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4">
                <RadioGroupItem value="transfer" id="transfer" />
                <Label htmlFor="transfer" className="flex-1 cursor-pointer text-lg">
                  O'tkazma
                </Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Total */}
        <Card className="border-2 border-blue-200 bg-blue-50 p-6">
          <div className="mb-2 text-sm text-gray-600">Jami summa</div>
          <div className="text-3xl text-blue-600">
            {formatCurrency(calculateTotal())}
          </div>
        </Card>
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        <Button
          onClick={handleSell}
          className="h-14 w-full bg-green-600 hover:bg-green-700"
          size="lg"
        >
          Sotishni tasdiqlash
        </Button>
      </div>
    </div>
  );
}