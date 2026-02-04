
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Package, DollarSign } from "lucide-react";
import { Sale, Expense, StaffMember, useApp } from "../../context/AppContext";

type DrillDownItem = (Sale | Expense) & { type: "sale" | "expense" };

interface StatsDrillDownDialogProps {
    title: string;
    items: DrillDownItem[];
    trigger: React.ReactNode;
    staffMembers?: StaffMember[];
}

export function StatsDrillDownDialog({
    title,
    items,
    trigger,
    staffMembers = []
}: StatsDrillDownDialogProps) {
    const { exchangeRate } = useApp();

    const formatCurrency = (amount: number, currency: "USD" | "UZS" = "USD") => {
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

    const sortedItems = [...items].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer hover:opacity-90 transition-opacity">
                    {trigger}
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 mt-4">
                    {sortedItems.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">Ma'lumot topilmadi</p>
                    ) : (
                        sortedItems.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-start justify-between rounded-xl border p-3 ${item.type === "sale"
                                    ? "bg-white dark:bg-gray-800/50 border-gray-100 dark:border-gray-700"
                                    : "bg-orange-50/30 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/50"
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                        <div className={`p-2 rounded-lg ${item.type === "sale"
                                            ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                                            : "bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
                                            }`}>
                                            {item.type === "sale" ? <Package className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <div className="font-bold dark:text-white text-sm">
                                                {item.type === "sale"
                                                    ? (item as any).productName
                                                    : (item as any).description}
                                            </div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter">
                                                {new Date(item.date).toLocaleDateString("uz-UZ")} • {new Date(item.date).toLocaleTimeString("uz-UZ", { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                    {item.type === "sale" && (
                                        <div className="mt-2 space-y-1 ml-10">
                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                {(item as any).type === "unit" ? "Dona" : "Metr"} • {(item as any).quantity} • <span className="uppercase">{(item as any).paymentType}</span>
                                            </div>
                                            <div className="flex items-center space-x-3 text-[10px]">
                                                {(item as any).admin_profit !== undefined && (
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                        MEN: {formatCurrency((item as any).admin_profit || 0, "USD")}
                                                    </span>
                                                )}
                                                {(item as any).seller_profit !== undefined && (
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                        FILIAL: {formatCurrency(((item as any).seller_profit || 0) * exchangeRate, "UZS")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {item.type === "expense" && (
                                        <div className="mt-1 flex gap-1 ml-10">
                                            <Badge variant="outline" className="text-[9px] uppercase border-orange-200 text-orange-600 bg-orange-50/50">
                                                {(item as any).category === "staff" ? "Sotuvchi" : "Filial"}
                                            </Badge>
                                            {(item as any).category === "staff" && (item as any).staffId && (
                                                <Badge variant="outline" className="text-[9px] uppercase border-blue-200 text-blue-600 bg-blue-50/50">
                                                    {staffMembers.find(s => s.id === (item as any).staffId)?.name || "Noma'lum"}
                                                </Badge>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="text-right ml-2">
                                    <div className={`text-base font-black ${item.type === "sale" ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
                                        }`}>
                                        {item.type === "sale" ? "+" : "-"}{formatCurrency(item.amount * (item.type === "sale" ? exchangeRate : 1), item.type === "sale" ? "UZS" : "USD")}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
