import { useState } from 'react';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useApp, PaymentType } from '../../context/AppContext';
import { toast } from 'sonner';

export function SellProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products, user, addSale } = useApp();

  const product = products.find((p) => p.id === productId);

  const [quantity, setQuantity] = useState(1);
  const [meters, setMeters] = useState('1');
  const [sellingPrice, setSellingPrice] = useState(
    product?.type === 'unit' ? product.sellPrice : product?.sellPricePerMeter || 0
  );
  const [paymentType, setPaymentType] = useState<PaymentType>('cash');

  if (!product) {
    return <div>Mahsulot topilmadi</div>;
  }

  const isUnit = product.type === 'unit';
  const maxQuantity = isUnit ? product.quantity || 0 : product.remainingLength || 0;

  const calculateTotal = () => {
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

    const totalAmount = calculateTotal();
    const standardPrice = isUnit ? product.sellPrice : (product.sellPricePerMeter || 0);
    const standardTotal = saleQuantity * standardPrice;
    const extraProfit = totalAmount - standardTotal;

    addSale({
      id: `s${Date.now()}`,
      productId: product.id,
      productName: product.name,
      quantity: saleQuantity,
      amount: totalAmount,
      paymentType,
      branchId: product.branchId,
      sellerId: user.id,
      date: new Date().toISOString(),
      profit: extraProfit > 0 ? extraProfit : 0,
      type: product.type,
      width: product.type === 'meter' ? product.width : undefined,
      length: product.type === 'meter' ? saleQuantity : undefined,
      area: (product.type === 'meter' && product.width) ? (product.width * saleQuantity) : undefined,
    });

    toast.success('Mahsulot sotildi!');
    navigate('/seller/home');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
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
          </div>
        </Card>

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