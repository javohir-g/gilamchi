
import { Card } from "../ui/card";
import { StaffMember, Expense } from "../../context/AppContext";

interface StaffProfitDistributionProps {
    staffMembers: StaffMember[];
    branchId: string;
    totalSellerProfit: number;
    totalBranchExpenses: number;
    branchExpenses: Expense[];
    className?: string;
}

export function StaffProfitDistribution({
    staffMembers,
    branchId,
    totalSellerProfit,
    totalBranchExpenses,
    branchExpenses,
    className
}: StaffProfitDistributionProps) {
    const activeStaff = staffMembers.filter(s => s.branchId === branchId && s.isActive);

    if (activeStaff.length === 0) return null;

    const distributableProfit = totalSellerProfit - totalBranchExpenses;
    const sharePerPerson = distributableProfit / activeStaff.length;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <Card className={`p-5 dark:bg-gray-800 dark:border-gray-700 border-emerald-100 bg-emerald-50/30 ${className}`}>
            <h3 className="mb-4 text-xs font-black dark:text-emerald-400 text-emerald-700 tracking-widest uppercase text-center">
                XODIMLAR O'RТASIDA TAQSIMOT
            </h3>
            <div className="space-y-3">
                {activeStaff.map(staff => {
                    const individualExpenses = branchExpenses
                        .filter(e => e.category === "staff" && e.staffId === staff.id)
                        .reduce((sum, e) => sum + e.amount, 0);
                    const netPayout = sharePerPerson - individualExpenses;

                    return (
                        <div key={staff.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900 shadow-sm border border-emerald-100/50 dark:border-emerald-900/30">
                            <div>
                                <div className="font-bold text-sm dark:text-white">{staff.name}</div>
                                <div className="text-[10px] text-gray-400 uppercase">
                                    Ulush: {formatCurrency(sharePerPerson)} • Xarajat: {formatCurrency(individualExpenses)}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-sm font-black ${netPayout >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(netPayout)}
                                </div>
                                <div className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">
                                    Qo'lga tegishi
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
