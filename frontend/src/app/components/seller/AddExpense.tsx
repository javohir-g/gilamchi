import { useState } from "react";
import { ArrowLeft, Wallet, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";
import { BottomNav } from "../shared/BottomNav";

export function AddExpense() {
  const navigate = useNavigate();
  const {
    user,
    expenses,
    staffMembers,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useApp();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(
    null,
  );
  const [category, setCategory] = useState<"branch" | "staff">("branch");
  const [staffId, setStaffId] = useState<string>("");

  const branchStaffMembers = staffMembers.filter(s => s.branchId === user?.branchId && s.isActive);

  // Get today's expenses for this seller
  const myExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const today = new Date();
    return (
      expense.sellerId === user?.id &&
      expenseDate.toDateString() === today.toDateString()
    );
  });

  const handleSave = async () => {
    if (!description || !amount) {
      toast.error("Barcha maydonlarni to'ldiring!");
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error("Summa musbat bo'lishi kerak!");
      return;
    }

    try {
      if (editingId) {
        // Update existing expense
        const updatedExpense = {
          id: editingId,
          description,
          amount: parseFloat(amount),
          category,
          staffId: category === "staff" ? staffId : undefined,
          branchId: user?.branchId || "",
          sellerId: user?.id || "",
          date:
            expenses.find((e) => e.id === editingId)?.date ||
            new Date().toISOString(),
        };
        await updateExpense(editingId, updatedExpense);
        toast.success("Xarajat yangilandi!");
        setEditingId(null);
      } else {
        // Add new expense
        const newExpense = {
          id: `e${Date.now()}`,
          description,
          amount: parseFloat(amount),
          category,
          staffId: category === "staff" ? staffId : undefined,
          branchId: user?.branchId || "",
          sellerId: user?.id || "",
          date: new Date().toISOString(),
        };
        await addExpense(newExpense);
        toast.success("Xarajat qo'shildi!");
      }

      setDescription("");
      setAmount("");
    } catch (error) {
      toast.error("Xatolik yuz berdi!");
    }
  };

  const handleEdit = (expense: any) => {
    setDescription(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category || "branch");
    setStaffId(expense.staffId || "");
    setEditingId(expense.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm("Xarajatni o'chirishni xohlaysizmi?")) {
      try {
        await deleteExpense(expenseId);
        toast.success("Xarajat o'chirildi!");
        if (editingId === expenseId) {
          setDescription("");
          setAmount("");
          setEditingId(null);
        }
      } catch (error) {
        toast.error("O'chirishda xatolik yuz berdi!");
      }
    }
  };

  const handleCancel = () => {
    setDescription("");
    setAmount("");
    setCategory("branch");
    setStaffId("");
    setEditingId(null);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          {/* <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/seller/home")}
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button> */}
          <h1 className="text-xl dark:text-white">
            Xarajat qo'shish
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Description */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label
            className="mb-3 block dark:text-white"
          >
            Xarajat turi
          </Label>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setCategory("branch")}
              className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${category === "branch"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent"
                }`}
            >
              Filial xarajati
            </button>
            <button
              onClick={() => setCategory("staff")}
              className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold transition-all ${category === "staff"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-transparent"
                }`}
            >
              Sotuvchi xarajati
            </button>
          </div>

          {category === "staff" && (
            <div className="mb-4">
              <Label htmlFor="staff" className="mb-2 block dark:text-white">Xodimni tanlang</Label>
              <select
                id="staff"
                className="w-full h-12 p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                <option value="">Xodimni tanlang</option>
                {branchStaffMembers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          <Label
            htmlFor="description"
            className="mb-2 block dark:text-white"
          >
            Xarajat tavsifi
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tushlik, Taksi, Kommunal..."
            className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />

          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Summa"
            className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400 mt-4"
          />

          <div className="flex space-x-2 mt-6">
            {editingId && (
              <Button
                onClick={handleCancel}
                className="h-14 flex-1 bg-gray-500 hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700"
                size="lg"
              >
                Bekor qilish
              </Button>
            )}
            <Button
              onClick={handleSave}
              className={`h-14 ${editingId ? "flex-1" : "w-full"} bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700`}
              size="lg"
            >
              {editingId ? "Yangilash" : "Xarajatni qo'shish"}
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
          <div className="flex items-start space-x-3">
            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                Ushbu xarajat kassadan olingan pul hisoblanadi
                va kunlik hisobotda ko'rsatiladi.
              </p>
            </div>
          </div>
        </Card>

        {/* Today's Expenses */}
        {myExpenses.length > 0 && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-lg mb-4 dark:text-white">
              Bugungi xarajatlarim
            </h2>
            <div className="space-y-3">
              {myExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${editingId === expense.id
                    ? "bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700"
                    : "border-gray-200 dark:border-gray-700"
                    }`}
                >
                  <div className="flex-1">
                    <p className="dark:text-white">
                      {expense.description}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {formatCurrency(expense.amount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {expense.category === "staff" ? `Sotuvchi (${staffMembers.find(s => s.id === expense.staffId)?.name || 'Noma\'lum'})` : "Filial"} • {new Date(
                        expense.date,
                      ).toLocaleTimeString("uz-UZ", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleEdit(expense)}
                      className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleDelete(expense.id)}
                      className="dark:border-gray-600 text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <BottomNav />
    </div >
  );
}