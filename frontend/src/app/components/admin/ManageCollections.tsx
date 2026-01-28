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
  const { products, renameCollection, deleteCollection } = useApp();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
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

  // Get unique collections
  const collections = useMemo(() => {
    const uniqueCollections = Array.from(
      new Set(products.map((p) => p.collection).filter(Boolean))
    ) as string[];
    return uniqueCollections.sort();
  }, [products]);

  // Helper to count products in a collection
  const getCollectionCount = (collectionName: string) => {
    return products.filter((p) => p.collection === collectionName).length;
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim()) {
      toast.error("Kolleksiya nomini kiriting!");
      return;
    }

    if (collections.includes(newCollectionName)) {
      toast.error("Bu kolleksiya allaqachon mavjud!");
      return;
    }

    toast.info(
      "Yangi kolleksiya qo'shish uchun mahsulot qo'shishda bu kolleksiyani tanlang"
    );
    setNewCollectionName("");
    setAddDialogOpen(false);
  };

  const handleEditCollection = () => {
    if (!editCollectionName.trim() || !selectedCollection) {
      toast.error("Kolleksiya nomini kiriting!");
      return;
    }

    if (collections.includes(editCollectionName) && editCollectionName !== selectedCollection) {
      toast.error("Bu kolleksiya nomi allaqachon mavjud!");
      return;
    }

    renameCollection(selectedCollection, editCollectionName);
    toast.success("Kolleksiya nomi o'zgartirildi!");
    setEditDialogOpen(false);
    setSelectedCollection(null);
    setEditCollectionName("");
  };

  const handleDeleteCollection = () => {
    if (!selectedCollection) return;

    const count = getCollectionCount(selectedCollection);
    if (count > 0) {
      toast.error(
        `Bu kolleksiyada ${count} ta mahsulot bor. Avval mahsulotlarni o'chiring yoki boshqa kolleksiyaga o'tkazing!`
      );
      setDeleteDialogOpen(false);
      setSelectedCollection(null);
      return;
    }

    deleteCollection(selectedCollection);
    toast.success("Kolleksiya o'chirildi!");
    setDeleteDialogOpen(false);
    setSelectedCollection(null);
  };

  const openEditDialog = (collection: string) => {
    setSelectedCollection(collection);
    setEditCollectionName(collection);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (collection: string) => {
    setSelectedCollection(collection);
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
              const count = getCollectionCount(collection);
              return (
                <Card
                  key={collection}
                  className="border border-border bg-card shadow-sm"
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="text-4xl">{getCollectionIcon(collection)}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-card-foreground">
                        {collection}
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
          <div className="py-4">
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
              "{selectedCollection}" kolleksiyasini o'chirmoqchimisiz? Bu
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
    </div>
  );
}
