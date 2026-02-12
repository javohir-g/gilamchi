import { useState, useMemo } from "react";
import { ChevronLeft, Plus, Edit2, Trash2, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import { useLanguage } from "../../context/LanguageContext";
import { toast } from "sonner";
import { BottomNav } from "../shared/BottomNav";

export function ManageSizes() {
  const navigate = useNavigate();
  const { products, renameSize, deleteSize } = useApp();
  const { t } = useLanguage();

  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [editSizeName, setEditSizeName] = useState("");

  // Get unique collections
  const collections = useMemo(() => {
    const uniqueCollections = Array.from(
      new Set(products.map((p) => p.collection).filter(Boolean))
    ) as string[];
    return uniqueCollections.sort();
  }, [products]);

  // Get all sizes based on selected collection
  const sizes = useMemo(() => {
    const relevantProducts =
      selectedCollection === "all"
        ? products
        : products.filter((p) => p.collection === selectedCollection);

    const allSizes = new Set<string>();
    relevantProducts.forEach((p) => {
      if (p.availableSizes) {
        p.availableSizes.forEach((s) => allSizes.add(s));
      }
    });

    // Sort sizes naturally
    return Array.from(allSizes).sort((a, b) => {
      const getArea = (s: string) => {
        const parts = s.split(/×|x/);
        if (parts.length === 2)
          return parseFloat(parts[0]) * parseFloat(parts[1]);
        return 0;
      };
      return getArea(a) - getArea(b);
    });
  }, [products, selectedCollection]);

  // Helper to count products using a size
  const getSizeCount = (size: string) => {
    const relevantProducts =
      selectedCollection === "all"
        ? products
        : products.filter((p) => p.collection === selectedCollection);

    return relevantProducts.filter((p) => p.availableSizes?.includes(size))
      .length;
  };

  const handleAddSize = () => {
    if (!newSize.trim()) {
      toast.error(t('messages.enterSize'));
      return;
    }

    if (sizes.includes(newSize)) {
      toast.error(t('messages.sizeAlreadyExists'));
      return;
    }

    toast.info(
      t('messages.useNewSizeInAddEdit')
    );
    setNewSize("");
    setAddDialogOpen(false);
  };

  const handleEditSize = () => {
    if (!editSizeName.trim() || !selectedSize) {
      toast.error(t('messages.enterSize'));
      return;
    }

    if (sizes.includes(editSizeName) && editSizeName !== selectedSize) {
      toast.error(t('messages.sizeAlreadyExists'));
      return;
    }

    const collectionFilter =
      selectedCollection === "all" ? undefined : selectedCollection;
    renameSize(selectedSize, editSizeName, collectionFilter);
    toast.success(t('messages.sizeUpdated'));
    setEditDialogOpen(false);
    setSelectedSize(null);
    setEditSizeName("");
  };

  const handleDeleteSize = () => {
    if (!selectedSize) return;

    const count = getSizeCount(selectedSize);
    if (count > 0) {
      toast.error(
        t('messages.sizeInUse').replace('{count}', count.toString())
      );
      setDeleteDialogOpen(false);
      setSelectedSize(null);
      return;
    }

    const collectionFilter =
      selectedCollection === "all" ? undefined : selectedCollection;
    deleteSize(selectedSize, collectionFilter);
    toast.success(t('messages.sizeDeleted'));
    setDeleteDialogOpen(false);
    setSelectedSize(null);
  };

  const openEditDialog = (size: string) => {
    setSelectedSize(size);
    setEditSizeName(size);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (size: string) => {
    setSelectedSize(size);
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
            {t('admin.manageSizes')}
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

      {/* Filter */}
      <div className="p-4">
        <Label className="mb-2 block text-sm text-muted-foreground">
          {t('admin.selectCollection')}
        </Label>
        <Select value={selectedCollection} onValueChange={setSelectedCollection}>
          <SelectTrigger className="h-12 bg-input-background border-border">
            <SelectValue placeholder={t('common.allCollections')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allCollections')}</SelectItem>
            {collections.map((collection) => (
              <SelectItem key={collection} value={collection}>
                {collection}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sizes Grid */}
      <div className="px-4 pb-4 space-y-4">
        {sizes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Ruler className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>{t('messages.noSizesFound')}</p>
            <p className="text-sm mt-2">
              {t('messages.createSizesOnAdd')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {sizes.map((size) => {
              const count = getSizeCount(size);
              return (
                <Card
                  key={size}
                  className="border border-border bg-card shadow-sm"
                >
                  <div className="p-4 flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-card-foreground">
                        {size}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {count} {t('nav.products')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditDialog(size)}
                        className="h-9 w-9"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDeleteDialog(size)}
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

      {/* Add Size Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.addSize')}</DialogTitle>
            <DialogDescription>
              {t('admin.addSizeDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-size" className="mb-2 block">
              {t('admin.sizeExampleLabel')}
            </Label>
            <Input
              id="new-size"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              placeholder={`${t('common.forExample')}: 3×4, 2×3, 3.5×5...`}
              className="h-12"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddDialogOpen(false);
                setNewSize("");
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddSize}>{t('common.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Size Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editSize')}</DialogTitle>
            <DialogDescription>
              {selectedCollection === "all"
                ? t('admin.editSizeAllDesc')
                : t('admin.editSizeOneDesc').replace('{collection}', selectedCollection)}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-size" className="mb-2 block">
              {t('admin.newSize')}
            </Label>
            <Input
              id="edit-size"
              value={editSizeName}
              onChange={(e) => setEditSizeName(e.target.value)}
              placeholder={t('admin.sizePlaceholder')}
              className="h-12"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedSize(null);
                setEditSizeName("");
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditSize}>{t('common.save')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Size Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteSize')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.confirmDeleteSize').replace('{size}', selectedSize || '')}{" "}
              {selectedCollection === "all"
                ? t('messages.deleteSizeAllNote')
                : t('messages.deleteSizeOneNote').replace('{collection}', selectedCollection)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedSize(null);
              }}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSize}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}
