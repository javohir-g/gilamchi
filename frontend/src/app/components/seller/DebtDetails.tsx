import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  DollarSign,
  History,
  Receipt,
  Wallet,
  Phone,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp, DebtPayment } from "../../context/AppContext";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";

export function DebtDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { debts, makeDebtPayment, user } = useApp();

  const debt = debts.find((d) => d.id === id);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [showPaymentModal, setShowPaymentModal] =
    useState(false);

  const isAdmin = user?.role === "admin";
  const debtsListRoute = isAdmin
    ? "/admin/debts"
    : "/seller/debts";
  const debtDetailRoute = (debtId: string) =>
    isAdmin
      ? `/admin/debt/${debtId}`
      : `/seller/debt/${debtId}`;

  if (!debt) {
    navigate(debtsListRoute);
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "No'malum";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Noto'g'ri sana";
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatDateShort = (dateString: string | undefined | null) => {
    if (!dateString) return "No'malum";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Noto'g'ri sana";
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const handleMakePayment = () => {
    const amount = parseFloat(paymentAmount);

    if (!amount || amount <= 0) {
      toast.error("To'lov summasini kiriting!");
      return;
    }

    if (amount > debt.remainingAmount) {
      toast.error(
        "To'lov summasi qarz summasidan oshmasligi kerak!",
      );
      return;
    }

    if (!user) return;

    const payment: DebtPayment = {
      id: `dp${Date.now()}`,
      amount: amount,
      date: new Date().toISOString(),
      sellerId: user.id,
      sellerName: user.name,
      note: paymentNote.trim() || undefined,
    };

    makeDebtPayment(debt.id, payment);
    setPaymentAmount("");
    setPaymentNote("");
    setShowPaymentModal(false);
    toast.success("To'lov qabul qilindi!");
  };

  const getStatusBadge = () => {
    if (debt.status === "paid") {
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          ✓ To'langan
        </Badge>
      );
    }

    const isOverdue =
      new Date(debt.paymentDeadline) < new Date();
    if (isOverdue) {
      return <></>;
    }

    return <></>;
  };

  // Get other debts from the same debtor
  const debtorHistory = debts.filter(
    (d) => d.debtorName === debt.debtorName && d.id !== debt.id,
  );

  // Ensure paymentHistory exists
  const paymentHistory = debt.paymentHistory || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-[100px] pt-[0px] pr-[0px] pl-[0px]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(debtsListRoute)}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-2xl dark:text-white">
            Qarz tafsilotlari
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Debtor Info Card */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <User className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold dark:text-white">
                  {debt.debtorName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Qarzdor
                </p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          {/* Amounts Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t dark:border-gray-700">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Jami summa
              </p>
              <p className="font-semibold dark:text-white">
                {formatCurrency(debt.totalAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                To'langan
              </p>
              <p className="font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(debt.paidAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Qolgan qarz
              </p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(debt.remainingAmount)}
              </p>
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold dark:text-white">
              Buyurtma ma'lumotlari
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            {debt.orderDetails}
          </p>

          {/* Order Items */}
          {debt.orderItems && debt.orderItems.length > 0 && (
            <div className="mt-4 space-y-3">
              {debt.orderItems.map((item) => (
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
                        {item.width}×{item.height} (
                        {item.area.toFixed(2)} m²)
                      </p>
                    )}
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Deadline and Info */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="space-y-3">
            {debt.phoneNumber && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Telefon raqami
                  </p>
                  <a
                    href={`tel:${debt.phoneNumber}`}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {debt.phoneNumber}
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 pt-3 border-t dark:border-gray-700">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  To'lov muddati
                </p>
                <p className="font-semibold dark:text-white">
                  {formatDateShort(debt.paymentDeadline)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t dark:border-gray-700">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sotuvchi
                </p>
                <p className="font-semibold dark:text-white">
                  {debt.sellerName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t dark:border-gray-700">
              <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Yaratilgan sana
                </p>
                <p className="font-semibold dark:text-white">
                  {formatDateShort(debt.date)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment History */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold dark:text-white">
              To'lov tarixi
            </h3>
          </div>

          {paymentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Hali to'lovlar amalga oshirilmagan
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-green-700 dark:text-green-400">
                      +{formatCurrency(payment.amount)}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(payment.date)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {payment.sellerName}
                  </p>
                  {payment.note && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 italic">
                      {payment.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Debtor History Section */}
        {debtorHistory.length > 0 && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold dark:text-white">
                Qarzdor tarixi
              </h3>
              <Badge variant="secondary" className="ml-auto">
                {debtorHistory.length} ta qarz
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {debt.debtorName} ning boshqa qarzlari
            </p>

            <div className="space-y-3">
              {debtorHistory
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() -
                    new Date(a.date).getTime(),
                )
                .map((historyDebt) => (
                  <div
                    key={historyDebt.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() =>
                      navigate(debtDetailRoute(historyDebt.id))
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium dark:text-white">
                        {formatDateShort(historyDebt.date)}
                      </span>
                      {historyDebt.status === "paid" ? (
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          ✓ To'langan
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          ⏳ Kutilmoqda
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {historyDebt.orderDetails}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Jami:{" "}
                        {formatCurrency(
                          historyDebt.totalAmount,
                        )}
                      </span>
                      {historyDebt.status !== "paid" && (
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          Qarz:{" "}
                          {formatCurrency(
                            historyDebt.remainingAmount,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Button */}
      {debt.status !== "paid" && (
        <div className="fixed bottom-0 left-0 right-0 border-t dark:border-gray-700 p-6 bg-white dark:bg-gray-800">
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="w-full h-14 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-base font-semibold"
            size="lg"
          >
            <Wallet className="h-5 w-5 mr-2" />
            Qarzni to'lash
          </Button>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
      >
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white text-xl">
              To'lov qabul qilish
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Qarzni to'lash uchun summa va izoh kiriting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Remaining Amount Display */}
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Qolgan qarz
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(debt.remainingAmount)}
              </p>
            </div>

            <div>
              <Label className="dark:text-white">
                To'lov summasi{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) =>
                  setPaymentAmount(e.target.value)
                }
                className="h-14 text-lg font-semibold dark:bg-gray-700 dark:text-white mt-2"
                placeholder="0"
                max={debt.remainingAmount}
                min="0"
                autoFocus
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Maksimal: {formatCurrency(debt.remainingAmount)}
              </p>
            </div>

            <div>
              <Label className="dark:text-white">
                Izoh (ixtiyoriy)
              </Label>
              <Input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                className="h-12 dark:bg-gray-700 dark:text-white mt-2"
                placeholder="Masalan: Naqd to'lov"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount("");
                  setPaymentNote("");
                }}
                className="flex-1 h-12 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                Bekor qilish
              </Button>
              <Button
                onClick={handleMakePayment}
                className="flex-1 h-12 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
              >
                <DollarSign className="h-5 w-5 mr-1" />
                Qabul qilish
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}