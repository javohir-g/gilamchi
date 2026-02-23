import { useState, useMemo } from "react";
import {
    ChevronRight,
    CalendarDays,
    TrendingDown,
    TrendingUp,
    Activity,
    Landmark,
    PieChart,
    Wallet,
    Users
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { BottomNav } from "../shared/BottomNav";
import { DatePickerWithRange } from "../ui/date-range-picker";
import { Card } from "../ui/card";

export function DemoDashboard() {
    const navigate = useNavigate();
    const { sales, expenses, branches, exchangeRate } = useApp();
    const { t } = useLanguage();

    const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
    const [isCustomRange, setIsCustomRange] = useState(false);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Generate 7 days centered on today
    const days = useMemo(() => {
        const today = startOfDay(new Date());
        return Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));
    }, []);

    const handleDayClick = (day: Date) => {
        if (!isCustomRange && isSameDay(day, selectedDate)) {
            setShowDatePicker(!showDatePicker);
        } else {
            setIsCustomRange(false);
            setSelectedDate(day);
            setShowDatePicker(false);
        }
    };

    const handleApplyCustom = () => {
        setIsCustomRange(true);
        setShowDatePicker(false);
    };

    // Filter data
    const getFilteredData = () => {
        let start: Date;
        let end: Date;

        if (isCustomRange && dateRange?.from) {
            start = startOfDay(dateRange.from);
            end = dateRange.to ? new Date(dateRange.to) : new Date(start);
            end.setHours(23, 59, 59, 999);
        } else {
            start = startOfDay(selectedDate);
            end = new Date(start);
            end.setHours(23, 59, 59, 999);
        }

        const periodSales = sales.filter((sale) => {
            const d = new Date(sale.date);
            return d >= start && d <= end;
        });

        const periodExpenses = expenses.filter((e) => {
            const d = new Date(e.date);
            return d >= start && d <= end;
        });

        return { periodSales, periodExpenses };
    };

    const { periodSales, periodExpenses } = getFilteredData();

    // Branch Stats
    const branchStats = branches.map((branch) => {
        const bSales = periodSales.filter((s) => s.branchId === branch.id);
        const bExpenses = periodExpenses.filter((e) => e.branchId === branch.id);

        const adminTurnover = bSales.reduce((sum, s) => sum + (s.amount - (s.sellerProfit || 0)), 0);
        const adminProfit = bSales.reduce((sum, s) => sum + (s.adminProfit || 0), 0);
        const branchProfit = bSales.reduce((sum, s) => sum + (s.sellerProfit || 0), 0);

        const staffExpenses = bExpenses.filter(e => e.category === 'staff').reduce((sum, e) => {
            return sum + (e.isUsd ? e.amount : e.amount / exchangeRate);
        }, 0);

        const branchExp = bExpenses.filter(e => e.category === 'branch').reduce((sum, e) => {
            return sum + (e.isUsd ? e.amount : e.amount / exchangeRate);
        }, 0);

        const totalExpenses = staffExpenses + branchExp;
        const netMargin = adminProfit > 0 ? ((adminProfit - totalExpenses) / adminTurnover) * 100 : 0;

        return {
            ...branch,
            adminTurnover,
            adminProfit,
            branchProfit,
            staffExpenses,
            branchExp,
            totalExpenses,
            netMargin: isNaN(netMargin) ? 0 : netMargin
        };
    }).sort((a, b) => b.adminTurnover - a.adminTurnover);

    const totalAdminTurnover = branchStats.reduce((sum, b) => sum + b.adminTurnover, 0);
    const totalAdminProfit = branchStats.reduce((sum, b) => sum + b.adminProfit, 0);

    const formatCurrency = (amount: number, currency: "USD" | "UZS" = "USD", compact = false) => {
        const isNegative = amount < 0;
        const absAmount = Math.abs(amount);

        const options: Intl.NumberFormatOptions = {
            style: "currency",
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: compact && absAmount >= 1000 ? 1 : 2,
            notation: compact && absAmount >= 1000 ? "compact" : "standard"
        };

        const formatted = new Intl.NumberFormat(currency === "UZS" ? "uz-UZ" : "en-US", options).format(absAmount);
        return isNegative ? `-${formatted}` : formatted;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 selection:bg-blue-500/30">

            {/* STICKY HEADER AREA */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-30 pt-4 pb-2 shadow-sm">
                <div className="max-w-3xl mx-auto px-4">

                    {/* Top Row: Title & Action */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
                                <Activity className="h-4 w-4 text-white" />
                            </div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-800">Мониторинг</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Период</p>
                            <p className="text-sm font-bold text-blue-600 cursor-pointer" onClick={() => setShowDatePicker(!showDatePicker)}>
                                {isCustomRange && dateRange?.from
                                    ? `${format(dateRange.from, 'dd MMM')} - ${dateRange.to ? format(dateRange.to, 'dd MMM') : ''}`
                                    : format(selectedDate, 'dd MMMM yyyy', { locale: ru })}
                            </p>
                        </div>
                    </div>

                    {/* Financial Summary Snippet (High-Level) */}
                    <div className="flex gap-4 mb-5 border-b border-slate-100 pb-4">
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 font-semibold mb-1">Оборот (Сумма)</p>
                            <p className="text-2xl font-black text-slate-800 tracking-tight">
                                {formatCurrency(totalAdminTurnover, "USD")}
                            </p>
                        </div>
                        <div className="flex-1 border-l border-slate-200 pl-4">
                            <p className="text-xs text-slate-500 font-semibold mb-1">Прибыль (Чистая)</p>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-black text-emerald-600 tracking-tight">
                                    {formatCurrency(totalAdminProfit, "USD")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Minimalist Native Horizontal Scroller */}
                    <div className="flex justify-between items-center overflow-x-auto no-scrollbar gap-1 pb-2 -mx-2 px-2">
                        {days.map((day, i) => {
                            const isSelected = !isCustomRange && isSameDay(day, selectedDate);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(day)}
                                    className={`flex flex-col items-center justify-center p-2 rounded-xl min-w-[48px] h-[56px] transition-all relative ${isSelected
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "hover:bg-slate-100 text-slate-500 bg-white border border-slate-200"
                                        }`}
                                >
                                    <span className={`text-[10px] font-bold mb-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {format(day, 'E', { locale: ru })}
                                    </span>
                                    <span className={`text-base font-black ${isSelected ? 'text-white' : (isToday ? 'text-blue-600' : 'text-slate-700')}`}>
                                        {format(day, 'd')}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Date Picker Drawer (Animated) */}
            {showDatePicker && (
                <div className="max-w-3xl mx-auto px-4 mt-4 animate-in slide-in-from-top-4 fade-in duration-200 relative z-20">
                    <div className="bg-white rounded-2xl p-4 shadow-xl border border-slate-200">
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-full text-slate-800 mb-4" />
                        <button
                            onClick={handleApplyCustom}
                            disabled={!dateRange?.from}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Применить выбранный диапазон
                        </button>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="max-w-3xl mx-auto px-4 mt-6 space-y-4">

                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Детализация по филиалам</h2>

                {branchStats.map((branch) => {
                    // Calculate visual metrics
                    const marginPercent = branch.adminTurnover > 0 ? (branch.adminProfit / branch.adminTurnover) * 100 : 0;
                    const isProfitable = branch.adminProfit > branch.totalExpenses;

                    return (
                        <div
                            key={branch.id}
                            onClick={() => navigate(`/admin/demo_branch/${branch.id}?filter=today`)}
                            className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                        >
                            {/* Accent line on the left */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isProfitable ? 'bg-emerald-500' : 'bg-slate-300'} group-hover:bg-blue-500 transition-colors`}></div>

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 tracking-tight">{branch.name}</h3>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1 flex items-center gap-1 uppercase tracking-wider">
                                        <Landmark className="h-3 w-3" />
                                        Маржа {(marginPercent).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-slate-800 tracking-tight">{formatCurrency(branch.adminTurnover, "USD")}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Оборот</p>
                                </div>
                            </div>

                            {/* Dense Financial Grid */}
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                {/* Profit */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Вал. Прибыль</span>
                                    </div>
                                    <span className="text-sm font-black text-emerald-600">{formatCurrency(branch.adminProfit, "USD")}</span>
                                </div>

                                {/* Seller Margin */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <PieChart className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Доля продавцов</span>
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{formatCurrency(branch.branchProfit, "USD")}</span>
                                </div>

                                {/* Divider */}
                                <div className="col-span-2 h-px bg-slate-200 my-0.5" />

                                {/* Staff Expenses */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <Users className="h-3.5 w-3.5 text-rose-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Зарплаты</span>
                                    </div>
                                    <span className="text-sm font-bold text-rose-600">{formatCurrency(branch.staffExpenses, "USD")}</span>
                                </div>

                                {/* Branch Expenses */}
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1.5 text-slate-500">
                                        <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
                                        <span className="text-[11px] font-bold uppercase tracking-wider">Расходы фил.</span>
                                    </div>
                                    <span className="text-sm font-bold text-rose-600">{formatCurrency(branch.branchExp, "USD")}</span>
                                </div>
                            </div>

                            {/* View Details Hint */}
                            <div className="mt-4 flex items-center justify-end gap-1 text-[10px] uppercase font-bold tracking-widest text-slate-400 group-hover:text-blue-600 transition-colors">
                                Подробнее <ChevronRight className="h-3 w-3" />
                            </div>
                        </div>
                    );
                })}

            </div>

            <BottomNav />
        </div>
    );
}
