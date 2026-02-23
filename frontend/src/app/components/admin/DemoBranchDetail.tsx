import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
    Building2,
    ChevronLeft,
    Banknote,
    TrendingUp,
    CreditCard,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    RefreshCcw,
    Activity
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { Card } from "../ui/card";

export function DemoBranchDetail() {
    const { branchId } = useParams<{ branchId: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialFilter = (searchParams.get("filter") as "today" | "week" | "month" | "custom") || "today";

    const [period, setPeriod] = useState<"today" | "week" | "month" | "custom">(initialFilter);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();

    const { sales, expenses, debts, branches, exchangeRate, staffMembers, products } = useApp();
    const { t } = useLanguage();

    const branch = branches.find((b) => b.id === branchId);

    // Return to demo dashboard
    const handleBack = () => navigate("/admin/demo_dashboard");

    if (!branch) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <div className="text-slate-500 font-medium mb-4">Филиал не найден</div>
                <button onClick={handleBack} className="text-blue-600 font-bold bg-blue-50 px-6 py-2 rounded-xl">Вернуться</button>
            </div>
        );
    }

    // --- Date Filtering ---
    const getFilteredData = () => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let startDate = todayStart;
        let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (period === "week") {
            startDate = new Date(todayStart);
            const day = todayStart.getDay();
            const diff = todayStart.getDate() - day + (day === 0 ? -6 : 1);
            startDate.setDate(diff);
        } else if (period === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (period === "custom") {
            if (dateRange?.from) {
                startDate = new Date(dateRange.from);
                startDate.setHours(0, 0, 0, 0);
                endDate = dateRange.to ? new Date(dateRange.to) : new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
            }
        }

        const isCustom = period === "custom" && dateRange?.from;

        const branchSales = sales.filter(
            (s) => {
                if (s.branchId !== branchId) return false;
                const d = new Date(s.date);
                if (isCustom) return d >= startDate && d <= endDate;
                return d >= startDate;
            }
        );
        const branchExpenses = expenses.filter(
            (e) => {
                if (e.branchId !== branchId) return false;
                const d = new Date(e.date);
                if (isCustom) return d >= startDate && d <= endDate;
                return d >= startDate;
            }
        );

        return { branchSales, branchExpenses };
    };

    const { branchSales, branchExpenses } = getFilteredData();

    // --- Calculations ---

    // Sales
    const cashSales = branchSales.filter((s) => s.paymentType === "cash").reduce((sum, s) => sum + s.amount, 0);
    const cardSales = branchSales.filter((s) => s.paymentType === "card").reduce((sum, s) => sum + s.amount, 0);
    const transferSales = branchSales.filter((s) => s.paymentType === "transfer").reduce((sum, s) => sum + s.amount, 0);

    const totalSalesUSD = branchSales.reduce((sum, s) => sum + s.amount, 0);
    const totalProfitUZS = branchSales.reduce((sum, s) => sum + (s.sellerProfit || 0), 0) * exchangeRate;

    // Expenses
    const totalExpensesUZS = branchExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Debts (Always calculated for the chosen period to simplify the demo)
    // Payments received in this period
    const debtPaymentsReceivedUZS = debts.filter(d => d.branchId === branchId).reduce((sum, debt) => {
        const periodPayments = (debt.paymentHistory || []).filter((payment) => {
            const pDate = new Date(payment.date);
            let sDate = new Date();
            sDate.setHours(0, 0, 0, 0);

            if (period === 'week') {
                const d = sDate.getDay();
                sDate.setDate(sDate.getDate() - d + (d === 0 ? -6 : 1));
                return pDate >= sDate;
            } else if (period === 'month') {
                sDate.setDate(1);
                return pDate >= sDate;
            } else if (period === 'custom' && dateRange?.from) {
                const cStart = new Date(dateRange.from);
                cStart.setHours(0, 0, 0, 0);
                const cEnd = dateRange.to ? new Date(dateRange.to) : new Date(cStart);
                cEnd.setHours(23, 59, 59, 999);
                return pDate >= cStart && pDate <= cEnd;
            }
            return pDate >= sDate;
        });
        return sum + periodPayments.reduce((pSum, p) => pSum + p.amount, 0); // Already UZS
    }, 0);

    // BUGUNGI KASSA = (Cash USD * Rate) + Card/Transfer USD * Rate + Debt Payments UZS
    const actualCashRegisterUZS = (cashSales * exchangeRate) + ((cardSales + transferSales) * exchangeRate) + debtPaymentsReceivedUZS;

    // Formatting 
    const formatCurrency = (amount: number, currency: "USD" | "UZS" = "USD") => {
        if (currency === "UZS") {
            return new Intl.NumberFormat("uz-UZ", { style: "currency", currency: "UZS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
        }
        return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    };

    // Build unified history
    const historyItems = [
        ...branchSales.map(s => ({ ...s, _type: 'sale', _date: new Date(s.date) })),
        ...branchExpenses.map(e => ({ ...e, _type: 'expense', _date: new Date(e.date) }))
    ].sort((a, b) => b._date.getTime() - a._date.getTime());

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20 selection:bg-blue-500/30 text-slate-900">

            {/* HEADER */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="px-4 py-3 flex items-center justify-between max-w-3xl mx-auto">
                    <button onClick={handleBack} className="p-2 -ml-2 text-slate-500 hover:text-blue-600 transition-colors bg-transparent rounded-full flex items-center gap-1">
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <div className="font-black text-slate-800 text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        {branch.name}
                    </div>
                    <div className="w-10"></div> {/* Spacer for center alignment */}
                </div>

                {/* Segmented Control */}
                <div className="px-4 pb-4 max-w-3xl mx-auto">
                    <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/50">
                        {(["today", "week", "month", "custom"] as const).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`flex-1 min-w-[70px] text-sm font-bold py-2 px-2 rounded-lg transition-all ${period === p
                                    ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                {p === "today" ? "Сегодня" : p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Другое"}
                            </button>
                        ))}
                    </div>
                </div>

                {period === "custom" && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in flex justify-center max-w-3xl mx-auto">
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full relative z-50 text-slate-800" />
                    </div>
                )}
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-4 pt-6">

                {/* MAIN REGISTER CARD (Always in UZS) */}
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden group border border-emerald-400/30">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Wallet className="h-32 w-32" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2 mb-1 opacity-90">
                            <Wallet className="h-5 w-5" />
                            <div className="text-xs uppercase font-black tracking-widest text-emerald-50">Фактическая Касса</div>
                        </div>
                        <div className="text-3xl font-black leading-none drop-shadow-sm mb-4">
                            {formatCurrency(actualCashRegisterUZS, "UZS")}
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-emerald-400/30 pt-4 mt-2">
                            <div>
                                <div className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider mb-1">Наличные + Долги</div>
                                <div className="font-bold text-lg">{formatCurrency((cashSales * exchangeRate) + debtPaymentsReceivedUZS, "UZS")}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-emerald-100 uppercase font-bold tracking-wider mb-1">Карта / Перевод</div>
                                <div className="font-bold text-lg">{formatCurrency((cardSales + transferSales) * exchangeRate, "UZS")}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECONDARY KPIs */}
                <div className="grid grid-cols-2 gap-3">
                    <Card className="rounded-2xl p-4 shadow-sm border-slate-200">
                        <div className="flex items-center gap-1.5 mb-2 text-blue-600">
                            <Banknote className="h-4 w-4" />
                            <div className="text-[10px] uppercase font-bold tracking-wider">Объем Продаж</div>
                        </div>
                        <div className="text-xl font-black text-slate-800">
                            {formatCurrency(totalSalesUSD, "USD")}
                        </div>
                    </Card>

                    <Card className="rounded-2xl p-4 shadow-sm border-slate-200">
                        <div className="flex items-center gap-1.5 mb-2 text-rose-500">
                            <ArrowDownRight className="h-4 w-4" />
                            <div className="text-[10px] uppercase font-bold tracking-wider">Все Расходы</div>
                        </div>
                        <div className="text-xl font-black text-slate-800">
                            {formatCurrency(totalExpensesUZS, "UZS")}
                        </div>
                    </Card>
                </div>

                {/* PROFIT GAUGE */}
                <Card className="rounded-2xl p-5 shadow-sm border-slate-200 flex items-center justify-between group hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ваша Прибыль</div>
                            <div className="text-xl font-black text-slate-800">{formatCurrency(totalProfitUZS, "UZS")}</div>
                        </div>
                    </div>
                    {totalProfitUZS > 0 && <Activity className="h-8 w-8 text-blue-200 animate-pulse" />}
                </Card>

                {/* RECENT ACTIVITY FEED */}
                <div className="mt-8 pt-4">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1 mb-4">История операций</h2>
                    <div className="space-y-3">
                        {historyItems.length === 0 && (
                            <div className="text-center py-8 text-slate-400 font-bold bg-white rounded-2xl border border-dashed border-slate-200">
                                Нет операций за этот период
                            </div>
                        )}
                        {historyItems.map((item, i) => {
                            const isSale = item._type === 'sale';
                            const isExpense = item._type === 'expense';
                            const sellerName = staffMembers.find(s => s.id === (item as any).sellerId || s.id === (item as any).staffId)?.name || 'Неизвестно';

                            // Determine meta description for sales based on type
                            let saleMeta = "";
                            let collectionName = "";
                            let displayProductName = (item as any).productName;

                            if (isSale) {
                                const sale = item as any;
                                const product = products.find(p => p.id === sale.productId);
                                if (product && product.collection) {
                                    collectionName = product.collection;
                                    displayProductName = `${collectionName} (${sale.productName})`;
                                }

                                if (sale.type === 'meter') {
                                    saleMeta = `Метр: ${sale.width || 0}x${sale.length || 0}м (${sale.area || 0}м²)`;
                                } else {
                                    saleMeta = `Штуч: ${sale.size || 'Станд.'} • ${sale.quantity || 1} шт.`;
                                }
                            }

                            return (
                                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className={`p-3 rounded-xl ${isSale ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                        {isSale ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-slate-800 truncate text-sm">
                                            {isSale ? `Продажа: ${displayProductName}` : `Расход: ${(item as any).description}`}
                                        </div>
                                        {isSale && (
                                            <div className="text-[10px] font-bold text-blue-600 mt-1 uppercase tracking-widest bg-blue-50 inline-block px-1.5 py-0.5 rounded-md">
                                                {saleMeta}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-slate-400 font-bold flex gap-2 mt-1.5 uppercase tracking-wider">
                                            <span>{item._date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span>•</span>
                                            <span className="truncate">{sellerName}</span>
                                            {isSale && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-slate-500">{(item as any).paymentType}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`font-black whitespace-nowrap text-lg ${isSale ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {isSale ? '+' : '-'}{formatCurrency(item.amount, isExpense ? 'UZS' : 'USD')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
