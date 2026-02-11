import { useState } from "react";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Users,
    Building,
    CheckCircle,
    XCircle,
    Pencil,
    Link as LinkIcon,
    Copy,
    ExternalLink
} from "lucide-react";
import { invitationService } from "../../../services/api";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useApp } from "../../context/AppContext";
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";

export function ManageStaffMembers() {
    const navigate = useNavigate();
    const { staffMembers, branches, updateStaffMember, deleteStaffMember } = useApp();
    const [selectedBranch, setSelectedBranch] = useState<string>("all");
    const [isAdding, setIsAdding] = useState(false); // Controls the "Generate Link" modal
    const [editingId, setEditingId] = useState<string | null>(null);
    const [invitationLink, setInvitationLink] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Form data for Link Generation
    const [formData, setFormData] = useState({
        name: "", // Used as username_hint for link generation
        branchId: "",
        isActive: true // Not used for link generation but kept for compatibility
    });

    const filteredStaff = selectedBranch === "all"
        ? staffMembers
        : staffMembers.filter(s => s.branchId === selectedBranch);

    const { t } = useLanguage();

    const getBranchName = (branchId: string | undefined | null) => {
        if (!branchId) return t('common.admin');
        return branches.find(b => b.id === branchId)?.name || "N/A";
    };

    const handleGenerateLink = async () => {
        if (!formData.branchId) {
            toast.error("Iltimos, avval filialni tanlang");
            return;
        }

        setIsGenerating(true);
        try {
            const data = await invitationService.generateLink({
                branch_id: formData.branchId,
                role: "seller",
                username_hint: formData.name || undefined // Send name as hint
            });
            setInvitationLink(data.url);
            toast.success("Taklif havolasi yaratildi");
        } catch (error) {
            toast.error("Havola yaratishda xatolik");
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Nusxalandi");
    };

    const handleSave = async () => {
        // This is only for EDITING existing staff
        if (!editingId) return;

        try {
            await updateStaffMember(editingId, {
                name: formData.name,
                branchId: formData.branchId,
                isActive: formData.isActive
            });
            toast.success("Xodim ma'lumotlari yangilandi");
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
        setInvitationLink(null);
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
                            setInvitationLink(null);
                            setFormData({ name: "", branchId: selectedBranch === 'all' ? "" : selectedBranch, isActive: true });
                        }}
                        className="p-2 bg-green-600 rounded-full ml-2 shadow-lg hover:bg-green-500 transition-colors"
                        title="Xodim qo'shish (Havola orqali)"
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
                    <Card className="p-4 border-2 border-green-200 dark:border-green-800 dark:bg-gray-800">
                        <h2 className="text-lg font-medium mb-4 dark:text-white">
                            {editingId ? "Xodimni tahrirlash" : "Yangi xodim qo'shish (Taklif havolasi)"}
                        </h2>

                        {!editingId && (
                            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                                <p>Yangi xodim qo'shish uchun unga <b>taklif havolasi</b> yuboring.</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">
                                    {editingId ? "Ismi" : "Foydalanuvchi nomi (Lotincha, bo'sh joylarsiz)"}
                                </label>
                                <Input
                                    placeholder={editingId ? "Xodim ismi" : "Masalan: ali_sales"}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="dark:bg-gray-700"
                                />
                                {!editingId && <p className="text-[10px] text-gray-400 mt-1">Bu nom Telegram orqali kirganda login sifatida ishlatiladi.</p>}
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

                            {/* Only show Generate Link button if NOT editing */}
                            {!editingId && !invitationLink && (
                                <Button
                                    className="w-full bg-green-600 hover:bg-green-700 text-white mt-2"
                                    onClick={handleGenerateLink}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? "Yaratilmoqda..." : "Havola yaratish"}
                                </Button>
                            )}

                            {/* Only show Save button if EDITING */}
                            {editingId && (
                                <div className="flex gap-2 pt-2">
                                    <Button variant="outline" className="flex-1" onClick={() => setIsAdding(false)}>Bekor qilish</Button>
                                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave}>Saqlash</Button>
                                </div>
                            )}

                            {/* Close button for Add mode */}
                            {!editingId && (
                                <Button variant="outline" className="w-full mt-2" onClick={() => { setIsAdding(false); setInvitationLink(null); }}>Yopish</Button>
                            )}

                            {invitationLink && (
                                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-xs text-green-700 dark:text-green-400 mb-2 font-medium">Taklif havolasi tayyor:</p>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            readOnly
                                            value={invitationLink}
                                            className="h-9 text-xs bg-white dark:bg-gray-800 border-green-200"
                                        />
                                        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => copyToClipboard(invitationLink)}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={() => window.open(invitationLink, '_blank')}>
                                            <ExternalLink className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2 italic">Bu havola bir marta ishlatilishi mumkin va 24 soat davomida amal qiladi.</p>
                                </div>
                            )}
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
