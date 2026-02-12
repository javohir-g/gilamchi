import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";
import { TrendingUp } from "lucide-react";

interface ExchangeRateDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ExchangeRateDialog({ isOpen, onClose }: ExchangeRateDialogProps) {
    const { exchangeRate, updateExchangeRate } = useApp();
    const { t } = useLanguage();
    const [newRate, setNewRate] = useState(exchangeRate.toString());
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setNewRate(exchangeRate.toString());
    }, [exchangeRate, isOpen]);

    const handleSave = async () => {
        const rate = parseFloat(newRate);
        if (!rate || rate <= 0) {
            toast.error(t('messages.enterValidRate'));
            return;
        }

        try {
            setIsLoading(true);
            await updateExchangeRate(rate);
            toast.success(t('messages.exchangeRateUpdated'));
            onClose();
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        {t('admin.editExchangeRate')}
                    </DialogTitle>
                    <DialogDescription>
                        {t('admin.editExchangeRateDesc')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="rate-input">{t('admin.currentExchangeRate')}</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$1 = </span>
                            <Input
                                id="rate-input"
                                type="number"
                                value={newRate}
                                onChange={(e) => setNewRate(e.target.value)}
                                className="pl-10 pr-12 text-lg font-bold"
                                placeholder={t('admin.enterRatePlaceholder')}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">sum</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                        {t('common.cancel')}
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || parseFloat(newRate) === exchangeRate} className="bg-blue-600 hover:bg-blue-700">
                        {isLoading ? t('common.saving') : t('common.save')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
