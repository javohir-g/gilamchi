import { useState, useEffect } from "react";
import { ArrowLeft, FileEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  useApp,
  Payment,
} from "../../context/AppContext";
import { toast } from "sonner";

export function Checkout() {
  const navigate = useNavigate();
  const { basket, completeOrder, collections } = useApp();

  // Redirect if basket is empty
  useEffect(() => {
    if (basket.length === 0) {
      navigate("/seller/sell");
    }
  }, [basket.length, navigate]);

  const [cashAmount, setCashAmount] = useState("0");
  const [cardAmount, setCardAmount] = useState("0");
  const [isNasiya, setIsNasiya] = useState(false);

  const calculatedTotal = basket.reduce(
    (sum, item) => {
      if (!isNasiya) return sum + item.total;

      const collection = collections.find(c => c.name === item.collection);
      if (!collection || !collection.price_nasiya_per_sqm) return sum + item.total;

      if (item.area) return sum + (collection.price_nasiya_per_sqm * item.area);
      return sum + (collection.price_nasiya_per_sqm * item.quantity);
    },
    0,
  );

  // Helper function to format number with thousand separators
  const formatNumber = (value: string): string => {
    // Remove all non-digit and non-dot characters
    const cleanedValue = value.replace(/[^\d.]/g, '');

    // Ensure only one dot
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleanedValue;
  };

  // Helper function to parse formatted number to raw number
  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value) || 0;
  };

  // Calculate total from cash + card
  const sellerTotal =
    parseFormattedNumber(cashAmount) +
    parseFormattedNumber(cardAmount);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const handleComplete = () => {
    const cash = parseFormattedNumber(cashAmount);
    const card = parseFormattedNumber(cardAmount);
    const total = cash + card;

    if (total <= 0) {
      toast.error("Sotilgan narxni kiriting!");
      return;
    }

    const payments: Payment[] = [];

    // Add cash payment if amount > 0
    if (cash > 0) {
      payments.push({
        type: "cash",
        amount: cash,
      });
    }

    // Add card payment if amount > 0
    if (card > 0) {
      payments.push({
        type: "card",
        amount: card,
      });
    }

    completeOrder(payments, total, isNasiya);
    toast.success("Buyurtma muvaffaqiyatli yakunlandi!");
    navigate("/seller/home");
  };

  const isValid = sellerTotal > 0;
  const profit = sellerTotal - calculatedTotal;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/seller/basket")}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-2xl dark:text-white">
            Sotishni yakunlash
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800 border-2 border-blue-100">
          <div className="space-y-5">
            {/* Price Type Toggle */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
              <button
                onClick={() => setIsNasiya(false)}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${!isNasiya
                  ? "bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
              >
                Oddiy
              </button>
              <button
                onClick={() => setIsNasiya(true)}
                className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${isNasiya
                  ? "bg-white dark:bg-gray-700 shadow-sm text-orange-600 dark:text-orange-400"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  }`}
              >
                Nasiya
              </button>
            </div>

            {/* Calculated Total */}
            <div>
              <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isNasiya ? "Hisoblangan narx (Nasiya)" : "Hisoblangan narx (Oddiy)"}
              </Label>
              <div className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-1">
                {formatCurrency(calculatedTotal)}
              </div>
            </div>

            {/* Seller Entered Total */}
            <div>
              <Label className="text-lg font-semibold dark:text-white mb-3 block">
                Sotilgan narx{" "}
                <span className="text-red-500">*</span>
              </Label>
              <div className="space-y-4">
                {/* Cash Input */}
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                    Naqd
                  </Label>
                  <Input
                    type="text"
                    value={cashAmount}
                    onChange={(e) =>
                      setCashAmount(formatNumber(e.target.value))
                    }
                    className="h-16 text-2xl font-semibold dark:bg-gray-700 dark:text-white border-2 border-blue-400 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Card/Transfer Input */}
                <div>
                  <Label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                    Karta/O'tkazma
                  </Label>
                  <Input
                    type="text"
                    value={cardAmount}
                    onChange={(e) =>
                      setCardAmount(formatNumber(e.target.value))
                    }
                    className="h-16 text-2xl font-semibold dark:bg-gray-700 dark:text-white border-2 border-blue-400 dark:border-blue-600 focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
                    placeholder="0"
                    min="0"
                  />
                </div>

                {/* Total Display */}
                <div className="pt-3 border-t dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium text-gray-700 dark:text-gray-300">
                      Jami sotilgan:
                    </Label>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(sellerTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit/Loss Indicator */}
            {sellerTotal > 0 && profit !== 0 && !isNaN(profit) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl font-medium ${profit > 0
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                  }`}
              >
                <div className="text-sm mb-1">
                  {profit > 0 ? "🎉 Foyda (markup)" : "⚠️ Zarar (discount)"}
                </div>
                <div className="text-2xl font-bold mb-3">
                  {profit > 0 ? "+" : ""}
                  {formatCurrency(profit)}
                </div>

                {/* Add debt button for loss */}
                {profit < 0 && (
                  <Button
                    onClick={() => {
                      // Navigate to CreateDebt with order data
                      navigate("/seller/create-debt", {
                        state: {
                          basketItems: basket,
                          totalAmount: calculatedTotal,
                          paidAmount: sellerTotal,
                          remainingAmount: Math.abs(profit),
                          isNasiya: isNasiya // Pass the mode
                        },
                      });
                    }}
                    className="w-full mt-2 bg-orange-200 hover:bg-orange-300 dark:bg-orange-800 dark:hover:bg-orange-700 text-orange-900 dark:text-orange-100"
                    size="sm"
                  >
                    <FileEdit className="h-4 w-4 mr-2" />
                    Qarzga yozish
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </Card>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 border-t dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/seller/basket")}
            className="h-14 flex-1 text-base dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            size="lg"
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleComplete}
            className="h-14 flex-[2] bg-green-600 hover:bg-green-700 text-base font-semibold"
            size="lg"
            disabled={!isValid}
          >
            ✓ Yakunlash
          </Button>
        </div>
      </div>
    </div>
  );
}