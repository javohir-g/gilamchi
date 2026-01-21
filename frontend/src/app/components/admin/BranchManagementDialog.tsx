import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

interface BranchManagementDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BranchManagementDialog({ isOpen, onClose }: BranchManagementDialogProps) {
    const { branches, addBranch, deleteBranch } = useApp();
    const [newBranchName, setNewBranchName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddBranch = async () => {
        if (!newBranchName.trim()) {
            toast.error("Filial nomini kiriting");
            return;
        }

        try {
            setIsLoading(true);
            await addBranch(newBranchName);
            setNewBranchName("");
            toast.success("Filial muvaffaqiyatli qo'shildi");
        } catch (error) {
            toast.error("Xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteBranch = async (id: string, name: string) => {
        if (confirm(`Rostdan ham "${name}" filialini o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi.`)) {
            try {
                setIsLoading(true);
                await deleteBranch(id);
                toast.success("Filial o'chirildi");
            } catch (error) {
                toast.error("O'chirishda xatolik yuz berdi");
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Filiallarni Boshqarish</DialogTitle>
                    <DialogDescription>
                        Yangi filial qo'shing yoki mavjudlarini o'chiring.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Yangi filial nomi</Label>
                        <div className="flex space-x-2">
                            <Input
                                value={newBranchName}
                                onChange={(e) => setNewBranchName(e.target.value)}
                                placeholder="Filial nomi..."
                            />
                            <Button onClick={handleAddBranch} disabled={isLoading}>
                                <Plus className="h-4 w-4 mr-1" />
                                Qo'shish
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4">
                        <Label>Mavjud filiallar</Label>
                        <div className="border rounded-md divide-y max-h-[300px] overflow-y-auto">
                            {branches.length === 0 ? (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    Filiallar yo'q
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
                        Yopish
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
