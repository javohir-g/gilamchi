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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function ManageCollections() {
  const navigate = useNavigate();
  const { products, collections: ctxCollections, branches, fetchCollectionsForBranch, addCollection, updateCollection, deleteCollection: apiDeleteCollection, user } = useApp();
  const { t } = useLanguage();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedCollectionName, setSelectedCollectionName] = useState<string | null>(null);
  const [editCollectionName, setEditCollectionName] = useState("");
  const [collectionPrice, setCollectionPrice] = useState<string>("");
  const [collectionBuyPrice, setCollectionBuyPrice] = useState<string>("");
  const [addBranchId, setAddBranchId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

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

  // Helper to count products in a collection (filtered by branch if possible)
  const getCollectionCount = (collectionName: string) => {
    return products.filter((p) => p.collection === collectionName && (user?.role === 'admin' ? p.branchId === selectedBranchId : true)).length;
  };

  // Use collections from context but filter by branch
  // Admin can select branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>(user?.branchId || "");

  // Update selectedBranchId when branches load if not set
  useMemo(() => {
    if (!selectedBranchId && branches.length > 0) {
      // Sort branches to ensure consisten order if needed, or just take first
      // Assuming branches are: Yangi Bozor, Hunarmandlar, Naymancha
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const [localCollections, setLocalCollections] = useState<any[]>([]);

  useMemo(() => {
    if (user?.role === 'admin' && selectedBranchId) {
      fetchCollectionsForBranch(selectedBranchId).then(setLocalCollections);
    } else {
      setLocalCollections(ctxCollections);
    }
  }, [selectedBranchId, ctxCollections, user, fetchCollectionsForBranch]);

  const collections = user?.role === 'admin' ? localCollections : ctxCollections;

  // ... helper functions
  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranchId(newBranchId);
  };

  const handleAddCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error(t('messages.enterCollectionName'));
      return;
    }

    if (collections.some(c => c.name === newCollectionName)) {
      toast.error(t('messages.collectionAlreadyExists'));
      return;
    }

    setIsSaving(true);
    try {
      await addCollection({
        name: newCollectionName,
        price_per_sqm: collectionPrice ? parseFloat(collectionPrice) : undefined,
        buy_price_per_sqm: collectionBuyPrice ? parseFloat(collectionBuyPrice) : undefined,
        branchId: user?.role === 'admin' ? addBranchId : user?.branchId
      });

      toast.success(t('messages.collectionAdded'));
      setNewCollectionName("");
      setCollectionPrice("");
      setCollectionBuyPrice("");
      setAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add collection", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditCollection = async () => {
    if (!editCollectionName.trim() || !selectedCollectionId) {
      toast.error(t('messages.enterCollectionName'));
      return;
    }

    setIsSaving(true);
    try {
      await updateCollection(selectedCollectionId, {
        name: editCollectionName,
        price_per_sqm: collectionPrice ? parseFloat(collectionPrice) : undefined,
        buy_price_per_sqm: collectionBuyPrice ? parseFloat(collectionBuyPrice) : undefined,
        branchId: user?.role === 'admin' ? addBranchId : undefined
      });

      toast.success(t('messages.collectionUpdated'));
      setEditDialogOpen(false);
      setSelectedCollectionId(null);
      setEditCollectionName("");
      setCollectionPrice("");
      setCollectionBuyPrice("");
    } catch (error) {
      console.error("Failed to update collection", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCollection = async () => {
    if (!selectedCollectionId) return;

    setIsSaving(true);
    try {
      await apiDeleteCollection(selectedCollectionId);
      toast.success(t('messages.collectionDeleted'));
      setDeleteDialogOpen(false);
      setSelectedCollectionId(null);
    } catch (error) {
      console.error("Failed to delete collection", error);
    } finally {
      setIsSaving(false);
    }
  };

  const openEditDialog = (collection: any) => {
    setSelectedCollectionId(collection.id);
    setAddBranchId(collection.branchId || selectedBranchId);
    setEditCollectionName(collection.name);
    setCollectionPrice(collection.price_per_sqm?.toString() || "");
    setCollectionBuyPrice(collection.buy_price_per_sqm?.toString() || "");
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (collection: any) => {
    setSelectedCollectionId(collection.id);
    setSelectedCollectionName(collection.name);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
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
          <div className="flex-1">
            <h1 className="text-xl text-card-foreground">
              {t('admin.manageCollections')}
            </h1>
            {user?.role === 'admin' && (
              <p className="text-xs text-muted-foreground">
                {branches.find(b => b.id === selectedBranchId)?.name} {t('common.forBranch')}
              </p>
            )}
          </div>

          <Button
            className="rounded-full h-12 px-6 shadow-md hover:shadow-lg transition-all"
            onClick={() => {
              setAddBranchId(selectedBranchId);
              setAddDialogOpen(true);
            }}
          >
            <Plus className="h-6 w-6 mr-2" />
            {t('admin.addCollection')}
          </Button>
        </div>

        {/* Branch Tabs for Admin */}
        {user?.role === 'admin' && branches.length > 0 && (
          <div className="px-4 pb-2">
            <Tabs
              value={selectedBranchId}
              onValueChange={setSelectedBranchId}
              className="w-full"
            >
              <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${branches.length}, 1fr)` }}>
                {branches.map(branch => (
                  <TabsTrigger key={branch.id} value={branch.id} className="text-xs sm:text-sm">
                    {branch.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}
      </div>

      {/* Collections Grid */}
      <div className="p-4 space-y-4">
        {collections.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>{t('messages.noCollectionsFound')}</p>
            <p className="text-sm mt-2">
              {t('messages.createCollectionsOnAdd')}
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
                        {count} {t('nav.products')} • {collection.price_per_sqm || 0} $/m²
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
            <DialogTitle>{t('admin.addCollection')}</DialogTitle>
            <DialogDescription>
              {t('admin.addCollectionDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="new-collection" className="mb-2 block">
                {t('admin.collectionName')}
              </Label>
              <Input
                id="new-collection"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={`${t('common.forExample')}: Lara, Emili, Isfahan...`}
                className="h-12"
              />
            </div>
            {user?.role === 'admin' && (
              <div>
                <Label className="mb-2 block">{t('admin.branch')}</Label>
                <Select value={addBranchId} onValueChange={setAddBranchId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t('admin.selectBranch')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="collection-buy-price" className="mb-2 block">
                {t('seller.buyPrice')} ($/m²)
              </Label>
              <Input
                id="collection-buy-price"
                type="number"
                value={collectionBuyPrice}
                onChange={(e) => setCollectionBuyPrice(e.target.value)}
                placeholder={`${t('common.forExample')}: 10`}
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="collection-price" className="mb-2 block">
                {t('seller.price')} ($/m²)
              </Label>
              <Input
                id="collection-price"
                type="number"
                value={collectionPrice}
                onChange={(e) => setCollectionPrice(e.target.value)}
                placeholder={`${t('common.forExample')}: 15`}
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
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddCollection} disabled={isSaving}>
              {isSaving ? t('common.saving') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Collection Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.editCollection')}</DialogTitle>
            <DialogDescription>
              {t('admin.editCollectionDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="edit-collection" className="mb-2 block">
                {t('common.newName')}
              </Label>
              <Input
                id="edit-collection"
                value={editCollectionName}
                onChange={(e) => setEditCollectionName(e.target.value)}
                placeholder={t('admin.collectionPlaceholder')}
                className="h-12"
              />
            </div>
            {user?.role === 'admin' && (
              <div>
                <Label className="mb-2 block">{t('admin.branch')}</Label>
                <Select value={addBranchId} onValueChange={setAddBranchId}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={t('admin.selectBranch')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="edit-collection-buy-price" className="mb-2 block">
                Sotib olish narxi ($/m²)
              </Label>
              <Input
                id="edit-collection-buy-price"
                type="number"
                value={collectionBuyPrice}
                onChange={(e) => setCollectionBuyPrice(e.target.value)}
                placeholder={`${t('common.forExample')}: 10`}
                className="h-12"
              />
            </div>
            <div>
              <Label htmlFor="edit-collection-price" className="mb-2 block">
                Sotish narxi ($/m²)
              </Label>
              <Input
                id="edit-collection-price"
                type="number"
                value={collectionPrice}
                onChange={(e) => setCollectionPrice(e.target.value)}
                placeholder={`${t('common.forExample')}: 15`}
                className="h-12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedCollectionId(null);
                setEditCollectionName("");
              }}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEditCollection} disabled={isSaving}>
              {isSaving ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Collection Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.deleteCollection')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('messages.confirmDeleteCollection').replace('{name}', selectedCollectionName || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedCollectionId(null);
              }}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCollection}
              className="bg-red-600 hover:bg-red-700"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div >
  );
}
