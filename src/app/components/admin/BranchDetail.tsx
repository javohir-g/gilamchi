import { ArrowLeft, DollarSign } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { useApp } from "../../context/AppContext";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function BranchDetail() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { branches, sales, products, expenses, debts } = useApp();

  const branch = branches.find((b) => b.id === branchId);
  const branchSales = sales.filter(
    (s) => s.branchId === branchId,
  );
  const branchExpenses = expenses.filter(
    (e) => e.branchId === branchId,
  );

  if (!branch) {
    return <div>Filial topilmadi</div>;
  }

  // Sales breakdown by payment type
  const cashSales = branchSales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, s) => sum + s.amount, 0);
  const cardTransferSales = branchSales
    .filter((s) => s.paymentType === "card" || s.paymentType === "transfer")
    .reduce((sum, s) => sum + s.amount, 0);

  const paymentData = [
    { name: "Naqd", value: cashSales, color: "#22c55e" },
    { name: "Karta//O'tkazma", value: cardTransferSales, color: "#3b82f6" },
  ];

  // Category performance
  const categoryData: { [key: string]: number } = {};
  branchSales.forEach((sale) => {
    const product = products.find(
      (p) => p.id === sale.productId,
    );
    if (product) {
      categoryData[product.category] =
        (categoryData[product.category] || 0) + sale.amount;
    }
  });

  const categoryChartData = Object.entries(categoryData).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ").format(amount) + " so'm"
    );
  };

  const totalSales = branchSales.reduce(
    (sum, s) => sum + s.amount,
    0,
  );

  const totalExpenses = branchExpenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  );

  const totalExtraProfit = branchSales.reduce(
    (sum, s) => sum + (s.profit || 0),
    0,
  );

  // Debt calculations - today's data only
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const branchDebts = debts.filter((d) => d.branchId === branchId);

  // New debts created today
  const todayNewDebts = branchDebts.filter((debt) => {
    const debtDate = new Date(debt.date);
    debtDate.setHours(0, 0, 0, 0);
    return debtDate.getTime() === today.getTime();
  });

  const totalNewDebt = todayNewDebts.reduce(
    (sum, debt) => sum + debt.totalAmount,
    0,
  );

  // Debt payments received today
  const totalDebtPaymentsToday = branchDebts.reduce((sum, debt) => {
    const todayPayments = debt.paymentHistory.filter((payment) => {
      const paymentDate = new Date(payment.date);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    });
    return (
      sum +
      todayPayments.reduce((pSum, p) => pSum + p.amount, 0)
    );
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/dashboard")}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl dark:text-white">
              {branch.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Total Sales */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            Bugungi jami savdo
          </div>
          <div className="text-3xl text-blue-600 dark:text-blue-400">
            {formatCurrency(totalSales)}
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {branchSales.length} ta mahsulot sotildi
          </div>
        </Card>

        {/* Extra Profit */}
        {totalExtraProfit > 0 && (
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
            <div className="mb-2 text-sm text-green-700 dark:text-green-300">
              Qo'shimcha foyda
            </div>
            <div className="text-3xl text-green-600 dark:text-green-400">
              {formatCurrency(totalExtraProfit)}
            </div>
            <div className="mt-1 text-sm text-green-700 dark:text-green-300">
              Mahsulotlar standart narxdan yuqoriroq sotildi
            </div>
          </Card>
        )}

        {/* Expenses */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg dark:text-white">
              Bugungi xarajatlar
            </h3>
            <div className="text-lg text-orange-600 dark:text-orange-400">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          {branchExpenses.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Hali xarajat yo'q
            </p>
          ) : (
            <div className="space-y-3">
              {branchExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 p-3"
                >
                  <div>
                    <div className="dark:text-white">
                      {expense.description}
                    </div>
                    {/* <div className="text-sm text-gray-500 dark:text-gray-400">
                      {expense.sellerName}
                    </div> */}
                  </div>
                  <div className="text-right">
                    <div className="text-lg text-orange-600 dark:text-orange-400">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(
                        expense.date,
                      ).toLocaleTimeString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Debts Section */}
        {(totalNewDebt > 0 || totalDebtPaymentsToday > 0) && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 text-lg dark:text-white">
              Qarzlar
            </h3>
            <div className="space-y-3">
              {/* New debts given today */}
              {totalNewDebt > 0 && (
                <div className="rounded-lg bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950 border-red-200 dark:border-red-800 p-6">
                  <div className="mb-2 text-sm text-red-700 dark:text-red-300">
                    Berilgan qarzlar
                  </div>
                  <div className="text-3xl text-red-600 dark:text-red-400">
                    {formatCurrency(totalNewDebt)}
                  </div>
                  <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {todayNewDebts.length} ta mijozga berildi
                  </div>
                </div>
              )}

              {/* Debt payments received today */}
              {totalDebtPaymentsToday > 0 && (
                <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 p-6">
                  <div className="mb-2 text-sm text-green-700 dark:text-green-300">
                    To'langan qarzlar
                  </div>
                  <div className="text-3xl text-green-600 dark:text-green-400">
                    {formatCurrency(totalDebtPaymentsToday)}
                  </div>
                  <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                    Mijozlardan qabul qilindi
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Sales Breakdown */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg dark:text-white">
            To'lov turlari bo'yicha
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-900 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="dark:text-white">
                  Naqd pul
                </span>
              </div>
              <span className="dark:text-white">
                {formatCurrency(cashSales)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900 p-4">
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                <span className="dark:text-white">Karta//O'tkazma</span>
              </div>
              <span className="dark:text-white">
                {formatCurrency(cardTransferSales)}
              </span>
            </div>
          </div>
          <ResponsiveContainer
            width="100%"
            height={200}
            className="mt-2"
          >
            <PieChart>
              <Pie
                data={paymentData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {paymentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                  />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Today's Sales List */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="mb-4 text-lg dark:text-white">
            Bugungi savdolar
          </h3>
          {branchSales.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Hali savdo yo'q
            </p>
          ) : (
            <div className="space-y-3">
              {branchSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-lg border dark:border-gray-700 p-3"
                >
                  <div>
                    <div className="dark:text-white">
                      {sale.productName}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {sale.quantity} x{" "}
                      <Badge variant="outline" className="ml-1">
                        {sale.paymentType === "cash"
                          ? "Naqd"
                          : sale.paymentType === "card"
                            ? "Karta"
                            : "O'tkazma"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg dark:text-white">
                      {formatCurrency(sale.amount)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(sale.date).toLocaleTimeString(
                        "uz-UZ",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}