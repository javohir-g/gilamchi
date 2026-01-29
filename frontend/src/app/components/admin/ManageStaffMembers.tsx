import { useState } from "react";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Users,
    Building,
    CheckCircle,
    XCircle,
    Pencil
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";

export function ManageStaffMembers() {
    const navigate = useNavigate();
    const { staffMembers, branches, addStaffMember, updateStaffMember, deleteStaffMember } = useApp();
    const [selectedBranch, setSelectedBranch] = useState<string>("all");
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        branchId: "",
        isActive: true
    });

    const filteredStaff = selectedBranch === "all"
        ? staffMembers
        : staffMembers.filter(s => s.branchId === selectedBranch);

    const getBranchName = (branchId: string) => {
        return branches.find(b => b.id === branchId)?.name || "N/A";
    };

    const handleSave = async () => {
        if (!formData.name || !formData.branchId) {
            toast.error("Iltimos, barcha maydonlarni to'ldiring");
            return;
        }

        try {
            if (editingId) {
                await updateStaffMember(editingId, formData);
                toast.success("Xodim ma'lumotlari yangilandi");
            } else {
                await addStaffMember(formData);
                toast.success("Yangi xodim qo'shildi");
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData({ name: "", branchId: "", isActive: true });
        } catch (error) {
            toast.error("Xatolik yuz berdi");
        }
    };

    const handleEdit = (staff: any) => {
        setFormData({
            name: staff.name,
            branchId: staff.branchId,
            isActive: staff.isActive
        });
        setEditingId(staff.id);
        setIsAdding(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm("Haqiqatan ham bu xodimni o'chirib tashlamoqchimisiz?")) {
            try {
                await deleteStaffMember(id);
                toast.success("Xodim o'chirildi");
            } catch (error) {
                toast.error("Xatolik yuz berdi");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-6">
            {/* Header */}
            <div className="bg-blue-700 dark:bg-blue-800 px-4 pb-6 pt-6 text-white text-center">
                <div className="mb-4 flex items-center justify-between">
                    <button onClick={() => navigate("/profile")} className="p-2">
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-semibold">Xodimlar ro'yxati</h1>
                    <button
                        onClick={() => {
                            setIsAdding(true);
                            setEditingId(null);
                            setFormData({ name: "", branchId: selectedBranch === 'all' ? "" : selectedBranch, isActive: true });
                        }}
                        className="p-2 bg-blue-600 rounded-full"
                    >
                        <Plus className="h-6 w-6" />
                    </button>
                </div>

                {/* Branch Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-center">
                    <Button
                        variant={selectedBranch === "all" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setSelectedBranch("all")}
                        className={selectedBranch === "all" ? "" : "bg-blue-600/50 text-white border-transparent"}
                    >
                        Hammasi
                    </Button>
                    {branches.map((branch) => (
                        <Button
                            key={branch.id}
                            variant={selectedBranch === branch.id ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setSelectedBranch(branch.id)}
                            className={selectedBranch === branch.id ? "" : "bg-blue-600/50 text-white border-transparent"}
                        >
                            {branch.name}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
                {isAdding && (
                    <Card className="p-4 border-2 border-blue-200 dark:border-blue-800 dark:bg-gray-800">
                        <h2 className="text-lg font-medium mb-4 dark:text-white">
                            {editingId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Ismi</label>
                                <Input
                                    placeholder="Xodim ismi"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="dark:bg-gray-700"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">Filial</label>
                                <select
                                    className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={formData.branchId}
                                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                                >
                                    <option value="">Filialni tanlang</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Faol (foyda taqsimotida qatnashadi)
                                </label>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>Bekor qilish</Button>
                                <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Saqlash</Button>
                            </div>
                        </div>
                    </Card>
                )}

                {filteredStaff.length === 0 ? (
                    <Card className="p-12 text-center text-gray-500 bg-white/50 dark:bg-gray-800/50">
                        <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>Xodimlar topilmadi</p>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {filteredStaff.map((staff) => (
                            <Card key={staff.id} className="p-4 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${staff.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold dark:text-white">{staff.name}</h3>
                                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                                <Building className="h-3 w-3 mr-1" />
                                                {getBranchName(staff.branchId)}
                                                <span className="mx-1">•</span>
                                                {staff.isActive ? (
                                                    <span className="text-green-600 flex items-center"><CheckCircle className="h-3 w-3 mr-0.5" /> Faol</span>
                                                ) : (
                                                    <span className="text-gray-400 flex items-center"><XCircle className="h-3 w-3 mr-0.5" /> No-faol</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(staff)}>
                                            <Pencil className="h-4 w-4 text-blue-600" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(staff.id)}>
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
