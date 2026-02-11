import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

interface BranchManagementDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BranchManagementDialog({ isOpen, onClose }: BranchManagementDialogProps) {
    const { branches, addBranch, deleteBranch } = useApp();
    const { t } = useLanguage();
    const [newBranchName, setNewBranchName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddBranch = async () => {
        if (!newBranchName.trim()) {
            toast.error(t('messages.enterBranchName'));
            return;
        }

        try {
            setIsLoading(true);
            await addBranch(newBranchName);
            setNewBranchName("");
            toast.success(t('messages.branchAddedSuccess'));
        } catch (error) {
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBranch = async (id: string, name: string) => {
        if (confirm(t('admin.confirmDeleteBranch', { name }))) {
            try {
                setIsLoading(true);
                await deleteBranch(id);
                toast.success(t('messages.branchDeleted'));
            } catch (error) {
                toast.error(t('messages.deletionError'));
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('admin.manageBranches')}</DialogTitle>
                    <DialogDescription>
                        {t('admin.addNewBranch')}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>{t('admin.newBranchName')}</Label>
                        <div className="flex space-x-2">
                            <Input
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                placeholder={t('admin.branchNamePlaceholder')}
                            />
                            <Button onClick={handleAddBranch} disabled={isLoading}>
                                <Plus className="h-4 w-4 mr-1" />
                                {t('common.add')}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <Label>{t('admin.existingBranches')}</Label>
                        <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                            {branches.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    {t('admin.noBranches')}
                                </div>
                            ) : (
                                branches.map((branch) => (
                                    <div key={branch.id} className="flex items-center justify-between p-3 bg-card">
                                        <span className="font-medium">{branch.name}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteBranch(branch.id, branch.name)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            disabled={isLoading}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {t('common.close')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
