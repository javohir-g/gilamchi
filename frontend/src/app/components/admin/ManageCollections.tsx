import { useState, useMemo } from "react";
import { ChevronLeft, Plus, Edit2, Trash2, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useApp } from "../../context/AppContext";
import { toast } from "sonner";
import { BottomNav } from "../shared/BottomNav";

export function ManageCollections() {
  const navigate = useNavigate();
  const { products, collections: ctxCollections, addCollection, updateCollection, deleteCollection: apiDeleteCollection } = useApp();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollectionName, setSelectedCollectionName] = useState<string | null>(null);
  const [editCollectionName, setEditCollectionName] = useState("");
  const [collectionPrice, setCollectionPrice] = useState<string>("");

  // Collection Icons Map
  const collectionIcons: Record<string, string> = {
    Lara: "🌺",
    Emili: "🌸",
    Melord: "👑",
    Mashad: "🎨",
    Izmir: "✨",
    Isfahan: "🏛️",
    Prestige: "💎",
    Sultan: "🕌",
  };

  const getCollectionIcon = (name: string) => collectionIcons[name] || "📦";

  // Use collections from context
  const collections = ctxCollections;

  // Helper to count products in a collection
  const getCollectionCount = (collectionName: string) => {
    return products.filter((p) => p.collection === collectionName).length;
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error("Kolleksiya nomini kiriting!");
      return;
    }

    if (collections.some(c => c.name === newCollectionName)) {
      toast.error("Bu kolleksiya allaqachon mavjud!");
      return;
    }

    await addCollection({
      name: newCollectionName,
      price_per_sqm: collectionPrice ? parseFloat(collectionPrice) : undefined
    });

    toast.success("Kolleksiya qo'shildi!");
    setNewCollectionName("");
    setCollectionPrice("");
    setAddDialogOpen(false);
  };

  const handleEditCollection = async () => {
    if (!editCollectionName.trim() || !selectedCollectionId) {
      toast.error("Kolleksiya nomini kiriting!");
      return;
    }

    await updateCollection(selectedCollectionId, {
      name: editCollectionName,
      price_per_sqm: collectionPrice ? parseFloat(collectionPrice) : undefined
    });

    toast.success("Kolleksiya yangilandi!");
    setEditDialogOpen(false);
    setSelectedCollectionId(null);
    setEditCollectionName("");
    setCollectionPrice("");
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollectionId) return;

    await apiDeleteCollection(selectedCollectionId);
    toast.success("Kolleksiya o'chirildi!");
    setDeleteDialogOpen(false);
    setSelectedCollectionId(null);
  };

  const openEditDialog = (collection: any) => {
    setSelectedCollectionId(collection.id);
    setEditCollectionName(collection.name);
    setCollectionPrice(collection.price_per_sqm?.toString() || "");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (collection: any) => {
    setSelectedCollectionId(collection.id);
    setSelectedCollectionName(collection.name);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border shadow-sm">
        <div className="p-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="-ml-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl text-card-foreground flex-1">
            Kolleksiyalarni boshqarish
          </h1>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setAddDialogOpen(true)}
            className="text-blue-600 dark:text-blue-400"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="p-4 space-y-4">
        {collections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Hech qanday kolleksiya topilmadi</p>
            <p className="text-sm mt-2">
              Mahsulot qo'shishda kolleksiya yarating
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {collections.map((collection) => {
              const count = getCollectionCount(collection.name);
              return (
                <Card
                  key={collection.id}
                  className="border border-border bg-card shadow-sm"
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="text-4xl">{getCollectionIcon(collection.name)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-card-foreground">
                        {collection.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {count} ta mahsulot • {collection.price_per_sqm || 0} $/m²
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(collection)}
                        className="h-9 w-9"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(collection)}
                        className="h-9 w-9 text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Collection Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi kolleksiya qo'shish</DialogTitle>
            <DialogDescription>
              Mahsulot qo'shishda bu kolleksiyani tanlay olasiz
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="new-collection" className="mb-2 block">
                Kolleksiya nomi
              </Label>
              <Input
                id="new-collection"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Masalan: Lara, Emili, Isfahan..."
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="collection-price" className="mb-2 block">
                Kvadrat metr narxi ($)
              </Label>
              <Input
                id="collection-price"
                type="number"
                value={collectionPrice}
                onChange={(e) => setCollectionPrice(e.target.value)}
                placeholder="Masalan: 15"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setNewCollectionName("");
              }}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleAddCollection}>Qo'shish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kolleksiya nomini o'zgartirish</DialogTitle>
            <DialogDescription>
              Bu kolleksiyaga tegishli barcha mahsulotlar yangilanadi
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="edit-collection" className="mb-2 block">
                Yangi nom
              </Label>
              <Input
                id="edit-collection"
                value={editCollectionName}
                onChange={(e) => setEditCollectionName(e.target.value)}
                placeholder="Kolleksiya nomi..."
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="edit-collection-price" className="mb-2 block">
                Kvadrat metr narxi ($)
              </Label>
              <Input
                id="edit-collection-price"
                type="number"
                value={collectionPrice}
                onChange={(e) => setCollectionPrice(e.target.value)}
                placeholder="Masalan: 15"
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedCollection(null);
                setEditCollectionName("");
              }}
            >
              Bekor qilish
            </Button>
            <Button onClick={handleEditCollection}>Saqlash</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kolleksiyani o'chirish</AlertDialogTitle>
            <AlertDialogDescription>
              "{selectedCollectionName}" kolleksiyasini o'chirmoqchimisiz? Bu
              amalni bekor qilib bo'lmaydi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedCollection(null);
              }}
            >
              Bekor qilish
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700"
            >
              O'chirish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div >
  );
}
