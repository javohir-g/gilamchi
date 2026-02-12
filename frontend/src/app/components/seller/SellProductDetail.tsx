import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useApp, PaymentType } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
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
  const { products, user, addSale, exchangeRate } = useApp();
  const { t } = useLanguage();

  const product = products.find((p) => p.id === productId);

  const [isNasiya, setIsNasiya] = useState(false);
  const { collections } = useApp();

  const isUnit = product?.type === 'unit';

  const [quantity, setQuantity] = useState(1);
  const [meters, setMeters] = useState('1');
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');
  const [sellingPrice, setSellingPrice] = useState(
    isUnit
      ? (product?.sellPrice ? product.sellPrice * exchangeRate : 0)
      : (product?.sellPricePerMeter ? product.sellPricePerMeter * exchangeRate : 0)
  );

  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedSizeObj, setSelectedSizeObj] = useState<any>(null);
  const [area, setArea] = useState(0);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");

  // Update price when product changes
  useEffect(() => {
    if (!product) return;

    setSellingPrice(isUnit
      ? (product.sellPrice * exchangeRate)
      : (product.sellPricePerMeter ? product.sellPricePerMeter * exchangeRate : 0)
    );
  }, [product, isUnit, exchangeRate]);

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

  // Automate width for Metrajlar
  useEffect(() => {
    if (product?.category === "Metrajlar" && product.width && !width) {
      setWidth(product.width.toString());
    }
  }, [product, width]);

  if (!product) {
    return <div>{t('messages.noData')}</div>;
  }

  const isCarpet = product.category === "Gilamlar";
  const isMetraj = product.category === "Metrajlar";
  const isCarpetOrMetraj = isCarpet || isMetraj;

  const maxQuantity = isUnit
    ? (selectedSizeObj ? selectedSizeObj.quantity : (product.quantity || 0))
    : product.remainingLength || 0;

  const calculateTotal = () => {
    if (isCarpetOrMetraj && area > 0) {
      // For carpets and metraj: total = area × price per m² × number of carpets/multiplier
      return area * sellingPrice * (isUnit ? quantity : parseFloat(meters));
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
      toast.error(t('messages.enterQuantity'));
      return;
    }

    const totalAmount = calculateTotal();

    const standardPrice = isUnit ? product.sellPrice : (product.sellPricePerMeter || 0);

    const standardTotal = isCarpet && area > 0
      ? area * standardPrice * saleQuantity
      : saleQuantity * standardPrice;

    // Convert totalAmount (entered in Som) to USD for profit calculation
    const totalAmountUSD = totalAmount / exchangeRate;
    const extraProfit = totalAmountUSD - standardTotal;

    addSale({
      id: `s${Date.now()}`,
      productId: product.id,
      productName: product.code || "Unknown",
      quantity: saleQuantity,
      amount: totalAmountUSD,
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
      exchange_rate: exchangeRate,
    });

    toast.success(t('messages.orderSuccess'));
    navigate('/seller/home');
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
          <h1 className="text-xl">{t('seller.sell')}</h1>
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
                {t('seller.sell')}
              </button>
              <button
                onClick={() => setIsNasiya(true)}
                className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${isNasiya
                  ? "bg-white shadow-sm text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {t('seller.nasiyaSale')}
              </button>
            </div>
          </div>
        </Card>

        {/* Size Selection */}
        {(isCarpetOrMetraj || (product.availableSizes && product.availableSizes.length > 0)) && (
          <Card className="p-6 space-y-3">
            <Label className="text-lg">{t('seller.selectSize')}</Label>
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
                <SelectValue placeholder={t('seller.selectSize')} />
              </SelectTrigger>
              <SelectContent>
                {product.availableSizes?.map((s) => {
                  const sizeName = typeof s === 'string' ? s : s.size;
                  const sizeQty = typeof s === 'string' ? product.quantity : s.quantity;
                  return (
                    <SelectItem key={sizeName} value={sizeName}>
                      {sizeName} ({sizeQty} {t('common.unit')})
                    </SelectItem>
                  );
                })}
                <SelectItem value="other">{t('seller.otherSize')}</SelectItem>
              </SelectContent>
            </Select>
            {area > 0 && selectedSize !== "other" && (
              <div className="text-sm text-gray-500">
                {t('seller.area')}: {area.toFixed(2)} m²
              </div>
            )}
          </Card>
        )}

        {/* Manual Size Input */}
        {isCarpetOrMetraj && (selectedSize === "other" || !product.availableSizes || product.availableSizes.length === 0) && (
          <Card className="p-6">
            <Label className="mb-3 block text-lg">
              {t('seller.enterSize')} {isMetraj && `(${t('product.width')}: ${product.width}m)`}
            </Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label className="text-xs text-gray-400 mb-1 block">{t('product.width')}</Label>
                <Input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="h-14 text-center text-2xl"
                  min="0.1"
                  step="0.1"
                  placeholder={t('product.width')}
                  readOnly={isMetraj && !!product.width}
                />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-gray-400 mb-1 block">{t('product.height')}</Label>
                <Input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-14 text-center text-2xl"
                  min="0.1"
                  step="0.1"
                  placeholder={t('product.height')}
                />
              </div>
            </div>
            {area > 0 && (
              <div className="mt-3 text-sm text-gray-500 font-medium">
                {t('seller.area')}: {area.toFixed(2)} m²
              </div>
            )}
          </Card>
        )}

        {/* Quantity/Meters */}
        <Card className="p-6">
          <Label className="mb-4 block text-lg">
            {isUnit ? t('seller.quantity') : t('product.meter')}
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
                {t('seller.baseWidth')}: {product.remainingLength} {t('common.meter')}
              </p>
            </div>
          )}
        </Card>

        {/* Price */}
        <Card className="p-6">
          <Label className="mb-4 block text-lg">
            {t('seller.soldPrice')} {!isUnit && t('seller.perMeter')}
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
          <Label className="mb-4 block text-lg">{t('seller.salesMethod')}</Label>
          <RadioGroup value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4">
                <RadioGroupItem value="cash" id="cash" />
                <Label htmlFor="cash" className="flex-1 cursor-pointer text-lg">
                  {t('common.cash')}
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex-1 cursor-pointer text-lg">
                  {t('common.card')}
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 p-4">
                <RadioGroupItem value="transfer" id="transfer" />
                <Label htmlFor="transfer" className="flex-1 cursor-pointer text-lg">
                  {t('common.transfer')}
                </Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Total */}
        <Card className="border-2 border-blue-200 bg-blue-50 p-6">
          <div className="mb-2 text-sm text-gray-600">{t('common.total')}</div>
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
          {t('common.confirm')}
        </Button>
      </div>
    </div>
  );
}