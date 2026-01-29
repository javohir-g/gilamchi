import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  TrendingUp,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { useApp } from "../../context/AppContext";
import { Badge } from "../ui/badge";

export function Debts() {
  const navigate = useNavigate();
  const { debts, user } = useApp();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter debts by branch and search query
  const branchDebts = debts
    .filter((debt) => {
      if (user?.role === "admin") return true; // Admin sees all debts
      if (
        user?.role === "seller" &&
        debt.branchId === user.branchId
      ) {
        return true;
      }
      return false;
    })
    .filter((debt) => {
      if (!searchQuery) return true;
      return (
        debt.debtorName
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        debt.orderDetails
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      );
    });

  // Separate debts by status
  const pendingDebts = branchDebts.filter(
    (d) => d.status === "pending",
  );
  const paidDebts = branchDebts.filter(
    (d) => d.status === "paid",
  );
  const overdueDebts = branchDebts.filter((d) => {
    if (d.status === "paid") return false;
    return new Date(d.paymentDeadline) < new Date();
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("uz-UZ", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getStatusBadge = (debt: (typeof debts)[0]) => {
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
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          ⚠️ Muddati o'tgan
        </Badge>
      );
    }

    return (
      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        ⏳ Kutilmoqda
      </Badge>
    );
  };

  // Calculate total stats
  const totalPending = pendingDebts.reduce(
    (sum, d) => sum + d.remainingAmount,
    0,
  );
  const totalOverdue = overdueDebts.reduce(
    (sum, d) => sum + d.remainingAmount,
    0,
  );
  const totalPaid = paidDebts.reduce(
    (sum, d) => sum + d.totalAmount,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-2xl dark:text-white">Qarzlar</h1>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Pending */}
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <div className="text-xs text-orange-700 dark:text-orange-400 mb-1">
              Kutilmoqda
            </div>
            <div className="font-bold text-orange-900 dark:text-orange-300">
              {pendingDebts.length}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-500 mt-1">
              {formatCurrency(totalPending)}
            </div>
          </Card>

          {/* Paid */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <div className="text-xs text-green-700 dark:text-green-400 mb-1">
              To'langan
            </div>
            <div className="font-bold text-green-900 dark:text-green-300">
              {paidDebts.length}
            </div>
            <div className="text-xs text-green-600 dark:text-green-500 mt-1">
              {formatCurrency(totalPaid)}
            </div>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Qarzdor yoki mahsulot qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Debts List */}
        {branchDebts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="mb-6 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 p-8">
              <FileText
                className="h-20 w-20 text-orange-500 dark:text-orange-400"
                strokeWidth={1.5}
              />
            </div>
            <h3 className="mb-2 text-xl text-gray-900 dark:text-white">
              Qarzlar yo'q
            </h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
              Hozircha hech qanday qarz mavjud emas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {branchDebts
              .sort((a, b) => {
                // Sort by status: overdue > pending > paid
                if (a.status === "paid" && b.status !== "paid")
                  return 1;
                if (a.status !== "paid" && b.status === "paid")
                  return -1;

                const aOverdue =
                  new Date(a.paymentDeadline) < new Date();
                const bOverdue =
                  new Date(b.paymentDeadline) < new Date();
                if (aOverdue && !bOverdue) return -1;
                if (!aOverdue && bOverdue) return 1;

                // Sort by date (newest first)
                return (
                  new Date(b.date).getTime() -
                  new Date(a.date).getTime()
                );
              })
              .map((debt) => (
                <Card
                  key={debt.id}
                  className="p-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg hover:border-gray-400 dark:hover:border-gray-600 transition-all cursor-pointer border-2"
                  onClick={() =>
                    navigate(`/seller/debt/${debt.id}`)
                  }
                >
                  <div className="space-y-3">
                    {/* Header: Name, Amount and Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="p-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex-shrink-0">
                          <User className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                            {debt.debtorName}
                          </h3>
                          <p className="text-lg font-medium text-gray-900 dark:text-white break-words">
                            {formatCurrency(
                              debt.remainingAmount,
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {getStatusBadge(debt)}
                      </div>
                    </div>

                    {/* Pay Debt Button */}
                    {debt.status !== "paid" && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/seller/debt/${debt.id}`);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium"
                        size="sm"
                      >
                        Qarzni to'lash
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}