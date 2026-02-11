import { useState } from "react";
import { ArrowLeft, Calendar, User, FileText, DollarSign, Save, Phone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp, BasketItem, Debt, Payment } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

interface LocationState {
  basketItems: BasketItem[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isNasiya?: boolean;
}

export function CreateDebt() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addDebt, user, clearBasket, completeOrder, exchangeRate } = useApp();
  const { t } = useLanguage();

  const state = location.state as LocationState | null;

  // If no state, redirect back
  if (!state || !user) {
    navigate("/seller/checkout");
    return null;
  }

  const { basketItems, totalAmount, paidAmount, remainingAmount, isNasiya = false } = state;

  const [debtorName, setDebtorName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [orderDetails, setOrderDetails] = useState(() => {
    // Auto-generate order details from basket items
    return basketItems
      .map((item) => {
        if (item.width && item.height && item.area) {
          return `${item.productName} (${item.width}×${item.height})`;
        }
        return `${item.productName} (${item.quantity}x)`;
      })
      .join(", ");
  });
  // Thousand separator helpers
  const formatNumber = (value: string): string => {
    const cleanedValue = value.replace(/[^\d.]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) return parts[0] + '.' + parts.slice(1).join('');
    return cleanedValue;
  };

  const parseFormattedNumber = (value: string): number => parseFloat(value) || 0;
  const [isSaving, setIsSaving] = useState(false);

  const [customRemainingAmount, setCustomRemainingAmount] = useState(
    formatNumber((remainingAmount * exchangeRate).toString())
  );
  const [paymentDeadline, setPaymentDeadline] = useState(() => {
    // Default to 7 days from now
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0];
  });

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

  const handleSaveDebt = () => {
    // Validation
    if (!debtorName.trim()) {
      toast.error(t('messages.enterDebtorName'));
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error(t('messages.enterPhone'));
      return;
    }

    if (!orderDetails.trim()) {
      toast.error(t('messages.enterOrderDetails'));
      return;
    }

    const remainingUZS = parseFormattedNumber(customRemainingAmount);
    // The user said "можно сохранять в базе данных в сумах" -> "can save in DB in Soms".
    // So backend expects Soms now.
    // All amounts sent to completeOrder and for debt creation should be in UZS.

    if (remainingUZS <= 0) {
      toast.error(t('messages.debtMustBePositive'));
      return;
    }

    // Complete order first to record sales and reduce stock
    const payments: Payment[] = [];
    const paidAmountUZS = paidAmount * exchangeRate;
    if (paidAmountUZS > 0) {
      // For simplicity, we assume paid amount is cash if not specified.
      // In a real scenario, we might want to know if it was card/transfer.
      payments.push({ type: "cash", amount: paidAmountUZS });
    }

    // Add debt payment type for the remaining amount
    payments.push({ type: "debt", amount: remainingUZS });

    // Call completeOrder which returns orderId
    setIsSaving(true);
    completeOrder(payments, totalAmount, isNasiya).then((orderId: string) => {
      // Create debt linked to orderId with UZS amounts
      const debt: Debt = {
        id: `d${Date.now()}`,
        debtorName: debtorName.trim(),
        phoneNumber: phoneNumber.trim(),
        orderDetails: orderDetails.trim(),
        totalAmount: totalAmount * exchangeRate, // Convert to UZS
        paidAmount: paidAmount * exchangeRate, // Convert to UZS
        initial_payment: paidAmount * exchangeRate, // Convert to UZS
        remainingAmount: remainingUZS, // Already in UZS
        paymentDeadline: new Date(paymentDeadline).toISOString(),
        branchId: user.branchId || "",
        sellerId: user.id,
        sellerName: user.name,
        date: new Date().toISOString(),
        status: "pending",
        orderItems: basketItems,
        orderId: orderId, // Link to the order
        paymentHistory: []
      };

      addDebt(debt);
      clearBasket();
      toast.success(t('messages.saveSuccess'));
      navigate("/seller/home");
    }).catch((err: any) => {
      console.error("Order completion failed:", err);
      toast.error(t('messages.error'));
    }).finally(() => {
      setIsSaving(false);
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/seller/checkout")}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-2xl dark:text-white">{t('seller.createDebt')}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Order Summary Card */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 dark:border-orange-800 border-2 border-orange-100">
          <h3 className="font-semibold text-lg mb-4 dark:text-white">
            {t('debt.orderDetails')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                {t('debt.totalAmount')}:
              </span>
              <span className="font-semibold dark:text-white">
                {formatCurrency(totalAmount * exchangeRate)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                {t('debt.paidAmount')}:
              </span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(paidAmount * exchangeRate)}
              </span>
            </div>
            <div className="pt-3 border-t dark:border-orange-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {t('debt.debts')}:
                </span>
                <span className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(remainingAmount * exchangeRate)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Debtor Information Form */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="space-y-5">
            {/* Debtor Name */}
            <div>
              <Label className="text-base font-semibold dark:text-white mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                {t('debt.debtorName')}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                className="h-14 text-lg dark:bg-gray-700 dark:text-white border-2"
                placeholder={t('debt.exampleName')}
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label className="text-base font-semibold dark:text-white mb-3 flex items-center gap-2">
                <Phone className="h-5 w-5" />
                {t('debt.phoneNumber')}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-14 text-lg dark:bg-gray-700 dark:text-white border-2"
                placeholder={t('debt.examplePhone')}
              />
            </div>

            {/* Order Details */}
            <div>
              <Label className="text-base font-semibold dark:text-white mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('debt.orderDetails')}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <textarea
                value={orderDetails}
                onChange={(e) => setOrderDetails(e.target.value)}
                className="w-full h-24 px-4 py-3 text-base rounded-lg border-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 resize-none"
                placeholder={t('debt.orderDetails')}
              />
            </div>

            {/* Remaining Amount */}
            <div>
              <Label className="text-base font-semibold dark:text-white mb-3 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('debt.remainingAmount')}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="text"
                value={customRemainingAmount}
                onChange={(e) => setCustomRemainingAmount(formatNumber(e.target.value))}
                className="h-14 text-lg font-semibold dark:bg-gray-700 dark:text-white border-2 border-orange-400 dark:border-orange-600"
                placeholder="0"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('debt.autoCalculated')} {formatCurrency(remainingAmount * exchangeRate)}
              </p>
            </div>

            {/* Payment Deadline */}
            <div>
              <Label className="text-base font-semibold dark:text-white mb-3 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('debt.paymentDeadline')}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={paymentDeadline}
                onChange={(e) => setPaymentDeadline(e.target.value)}
                className="h-14 text-lg dark:bg-gray-700 dark:text-white border-2"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>
        </Card>

        {/* Order Items Preview */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-semibold text-lg mb-4 dark:text-white">
            {t('nav.products')}
          </h3>
          <div className="space-y-3">
            {basketItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <img
                  src={item.photo}
                  alt={item.productName}
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium dark:text-white">
                    {item.productName}
                  </p>
                  {item.width && item.height && item.area && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.width}×{item.height} ({item.area.toFixed(2)} m²)
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatCurrency(item.total * exchangeRate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 border-t dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/seller/checkout")}
            className="h-14 flex-1 text-base dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            size="lg"
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSaveDebt}
            className="h-14 flex-[2] bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-base font-semibold"
            size="lg"
            disabled={isSaving}
          >
            <Save className="h-5 w-5 mr-2" />
            {isSaving ? t('common.loading') : t('common.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}