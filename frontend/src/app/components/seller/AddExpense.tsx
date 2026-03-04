import { useState } from "react";
import { Wallet, Edit2, Trash2, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";
import { BottomNav } from "../shared/BottomNav";
import { formatThousands } from "../ui/utils";

export function AddExpense() {
  const navigate = useNavigate();
  const {
    user,
    expenses,
    staffMembers,
    addExpense,
    updateExpense,
    deleteExpense,
    exchangeRate,
  } = useApp();
  const { t } = useLanguage();

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [category, setCategory] = useState<"branch" | "staff">("branch");
  const [staffId, setStaffId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const branchStaffMembers = staffMembers.filter(s => s.branchId === user?.branchId && s.isActive);

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
      toast.error(t('messages.fillAllFields'));
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast.error(t('messages.invalidAmount'));
      return;
    }

    if (category === "staff" && !staffId) {
      toast.error(t('seller.selectStaff'));
      return;
    }

    setIsSaving(true);
    try {
      const expensePayload = {
        description,
        amount: parseFloat(amount) / exchangeRate,
        category,
        staffId: category === "staff" ? (staffId || null) : null,
        branchId: user?.branchId || "",
        sellerId: user?.id || "",
        exchangeRate: exchangeRate,
        isUsd: false,
        date: editingId ? (expenses.find((e) => e.id === editingId)?.date || new Date().toISOString()) : new Date().toISOString(),
      };

      if (editingId) {
        await updateExpense(editingId, { ...expensePayload, id: editingId } as any);
        toast.success(t('messages.expenseUpdated'));
        setEditingId(null);
      } else {
        await addExpense({ ...expensePayload, id: `e${Date.now()}` } as any);
        toast.success(t('messages.expenseAdded'));
      }

      handleCancel();
    } catch (error) {
      console.error(error);
      toast.error(t('common.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (expense: any) => {
    setDescription(expense.description);
    setAmount(Math.round(expense.amount * exchangeRate).toString());
    setCategory(expense.category || "branch");
    setStaffId(expense.staffId || "");
    setEditingId(expense.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (expenseId: string) => {
    if (confirm(t('messages.confirmDeleteExpense'))) {
      setIsSaving(true);
      try {
        await deleteExpense(expenseId);
        toast.success(t('messages.expenseDeleted'));
        if (editingId === expenseId) handleCancel();
      } catch (error) {
        toast.error(t('common.error'));
      } finally {
        setIsSaving(false);
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
    return new Intl.NumberFormat("uz-UZ", {
      style: "currency",
      currency: "UZS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4">
        <h1 className="text-xl font-bold dark:text-white">{t('seller.addExpense')}</h1>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-4 dark:bg-gray-800 border-none shadow-sm">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setCategory("branch")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${category === "branch" ? "bg-indigo-600 text-white shadow-md font-black" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                }`}
            >
              {t('seller.branchExpense')}
            </button>
            <button
              onClick={() => setCategory("staff")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${category === "staff" ? "bg-indigo-600 text-white shadow-md font-black" : "bg-gray-100 dark:bg-gray-700 text-gray-500"
                }`}
            >
              {t('seller.sellerExpense')}
            </button>
          </div>

          <div className="space-y-3">
            {category === "staff" && (
              <div>
                <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">{t('seller.selectStaff')}</Label>
                <select
                  className="w-full h-11 px-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none text-sm"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                >
                  <option value="">{t('seller.selectStaff')}</option>
                  {branchStaffMembers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">{t('seller.expenseDescription')}</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('seller.expensePlaceholder')}
                className="h-11 rounded-xl text-sm"
              />
            </div>

            <div>
              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">{t('common.price')} (UZS)</Label>
              <Input
                type="text"
                value={formatThousands(amount)}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/,/g, "");
                  if (/^\d*\.?\d*$/.test(rawValue)) {
                    setAmount(rawValue);
                  }
                }}
                placeholder="0"
                className="h-11 rounded-xl font-bold"
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold mt-2"
            >
              {isSaving ? t('common.loading') : (editingId ? t('common.save') : t('common.add'))}
            </Button>

            {editingId && (
              <Button onClick={handleCancel} variant="ghost" className="w-full h-10 rounded-xl text-xs text-muted-foreground">
                {t('common.cancel')}
              </Button>
            )}
          </div>
        </Card>

        <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex items-start gap-3">
          <Wallet className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
            {t('messages.expenseDisclaimer')}
          </p>
        </div>

        {myExpenses.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-[10px] font-bold text-muted-foreground uppercase px-1">{t('seller.myExpensesToday')}</h2>
            {myExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-sm truncate dark:text-white">{expense.description}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-bold text-xs">{formatCurrency(expense.amount * exchangeRate)}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {expense.category === "staff" ? staffMembers.find(s => s.id === expense.staffId)?.name : 'Filial'} • {new Date(expense.date).toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(expense)} className="h-8 w-8 rounded-full">
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(expense.id)} className="h-8 w-8 rounded-full text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}