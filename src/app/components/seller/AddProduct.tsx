import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { ArrowLeft, Upload, X, Plus, Camera, Image as ImageIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import {
  useApp,
  Category,
  ProductType,
} from "../../context/AppContext";
import { toast } from "sonner";
import { BottomNav } from "../shared/BottomNav";

export function AddProduct() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get product ID from URL if editing
  const { user, addProduct, updateProduct, products, branches } = useApp();

  const isEditMode = Boolean(id);

  const [photo, setPhoto] = useState(
    "https://images.unsplash.com/photo-1600166898405-da9535204843?w=400",
  );
  const [name, setName] = useState("");
  const [category, setCategory] =
    useState<Category>("Gilamlar");
  const [type, setType] = useState<ProductType>("unit");
  const [quantity, setQuantity] = useState("");
  const [totalLength, setTotalLength] = useState("");
  const [width, setWidth] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [sellPricePerMeter, setSellPricePerMeter] =
    useState("");
  const [collection, setCollection] = useState("");
  const [customCollection, setCustomCollection] = useState("");
  const [isCustomCollection, setIsCustomCollection] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);
  const [sizeInput, setSizeInput] = useState("");

  const predefinedCollections = [
    "🌺 Lara",
    "🌸 Emili",
    "👑 Melord",
    "🎨 Mashad",
    "✨ Izmir",
    "🏛️ Isfahan",
    "💎 Prestige",
    "🕌 Sultan"
  ];
  const [branchId, setBranchId] = useState<string>(user?.branchId || (branches.length > 0 ? branches[0].id : ""));

  // Update branchId if user or branches load
  useEffect(() => {
    if (user?.branchId) {
      setBranchId(user.branchId);
    } else if (branches.length > 0 && !branchId) {
      setBranchId(branches[0].id);
    }
  }, [user, branches]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (useCamera: boolean) => {
    if (fileInputRef.current) {
      if (useCamera) {
        fileInputRef.current.setAttribute("capture", "environment");
      } else {
        fileInputRef.current.removeAttribute("capture");
      }
      fileInputRef.current.click();
    }
  };

  // Populate form if in edit mode
  useEffect(() => {
    if (isEditMode && products.length > 0) {
      const productToEdit = products.find((p) => p.id === id);
      if (productToEdit) {
        setName(productToEdit.name);
        setPhoto(productToEdit.photo);
        setCategory(productToEdit.category);
        setType(productToEdit.type);
        setBuyPrice(productToEdit.buyPrice.toString());
        setSellPrice(productToEdit.sellPrice.toString());

        if (productToEdit.type === "unit") {
          setQuantity(productToEdit.quantity?.toString() || "");
        } else {
          setTotalLength(productToEdit.totalLength?.toString() || "");
          setWidth(productToEdit.width?.toString() || "");
          setSellPricePerMeter(productToEdit.sellPricePerMeter?.toString() || "");
        }
      } else {
        toast.error("Mahsulot topilmadi");
        navigate("/seller/home");
      }
    }
  }, [id, products, isEditMode, navigate]);

  const handleSave = () => {
    if (!name || !buyPrice || !sellPrice) {
      toast.error("Barcha maydonlarni to'ldiring!");
      return;
    }

    if (type === "unit" && !quantity) {
      toast.error("Miqdorni kiriting!");
      return;
    }

    if (
      type === "meter" &&
      (!totalLength || !sellPricePerMeter)
    ) {
      toast.error("Metr va narxni kiriting!");
      return;
    }

    const commonData = {
      name,
      category,
      type,
      photo,
      buyPrice: parseFloat(buyPrice),
      sellPrice: parseFloat(sellPrice),
      collection,
      availableSizes,
    };

    const typeSpecificData = type === "unit"
      ? { quantity: parseInt(quantity) }
      : {
        totalLength: parseFloat(totalLength),
        remainingLength: parseFloat(totalLength), // Reset remaining length on edit? Or keep? 
        // If editing, we probably shouldn't reset remainingLength unless user explicitly changes totalLength?
        // For simplicity in this "Add/Edit" unified form, if user changes totalLength, we might need logic.
        // But here we are just constructing the object.
        // IMPORTANT: If editing, we should preserve remainingLength if not changed, or adjust it?
        // Let's assume for now we overwrite it with totalLength if it's a new product.
        // If it's an update, we should be careful.
        width: width ? parseFloat(width) : undefined,
        sellPricePerMeter: parseFloat(sellPricePerMeter),
      };

    if (isEditMode && id) {
      // logic for update
      // For meter products, if we update, we usually don't reset remainingLength to totalLength automatically unless intended.
      // But the user input is "totalLength".
      // Let's check if we should update remainingLength.
      // If I change total length from 100 to 120, remaining length should probably increase by 20?
      // Or is this form "Restock"?
      // This form is "Edit Product Details".
      // If I edit the product, I might be correcting a mistake.

      // For now, I'll spread typeSpecificData. 
      // Note: If type is 'meter', `remainingLength` is in `typeSpecificData` as `parseFloat(totalLength)`.
      // This effectively resets remainingLength to totalLength. 
      // This might be what is expected if I'm "fixing" the product definition.
      // But if I sold some, and I edit the name, I don't want to reset remainingLength.

      const productToEdit = products.find((p) => p.id === id);
      let finalTypeData = { ...typeSpecificData };

      if (productToEdit && productToEdit.type === 'meter' && type === 'meter') {
        // If we are just updating name/price, we shouldn't reset remainingLength to totalLength
        // But if we changed totalLength, maybe we should?
        if (productToEdit.totalLength === parseFloat(totalLength)) {
          // Total length didn't change, preserve remainingLength
          finalTypeData.remainingLength = productToEdit.remainingLength || parseFloat(totalLength);
        } else {
          // Total length changed. 
          // Option 1: Reset remaining to new total (assuming it's a correction)
          // Option 2: Adjust remaining by the difference?
          // Let's go with Option 1: Reset. The user sees "Umumiy uzunlik" and sets it.
          // Actually, if I just correct a typo in name, I don't want to reset stock.
          finalTypeData.remainingLength = productToEdit.remainingLength;
          // If I change totalLength, `typeSpecificData` has `remainingLength: totalLength`.
          // I need to decide.
          // Let's use `remainingLength: parseFloat(totalLength)` ONLY if creating.
          // If updating, exclude `remainingLength` unless we want to force it.

          // Let's simplify: If editing, DO NOT update remainingLength here unless we want to support restocking here.
          // But the form has "Total Length".
          // If I change total length, I expect the stock to reflect that.
          // If I just change name, I don't touch total length field.

          // Better approach:
          if (productToEdit.totalLength !== parseFloat(totalLength)) {
            // If total length changed, reset remaining length to match new total?
            // Or maybe the user implies "I have this much now"?
            finalTypeData.remainingLength = parseFloat(totalLength);
          } else {
            finalTypeData.remainingLength = productToEdit.remainingLength;
          }
        }
      }

      updateProduct(id, {
        ...commonData,
        ...finalTypeData
      });
      toast.success("Mahsulot yangilandi!");
      navigate(-1); // Go back
    } else {
      // Create
      const newProduct = {
        id: `p${Date.now()}`,
        branchId: branchId,
        ...commonData,
        ...typeSpecificData
      };
      addProduct(newProduct);
      toast.success("Mahsulot qo'shildi!");
      navigate("/seller/home");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)} // Changed to -1 to support back navigation
          >
            <ArrowLeft className="h-6 w-6 dark:text-white" />
          </Button>
          <h1 className="text-xl dark:text-white">
            {isEditMode ? "Mahsulotni tahrirlash" : "Mahsulot qo'shish"}
          </h1>
        </div>
      </div>

      <div className="p-4 pb-12 space-y-6">
        {/* Photo */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label className="mb-4 block dark:text-white">
            Mahsulot rasmi
          </Label>
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            {photo ? (
              <div className="relative">
                <img
                  src={photo}
                  alt="Product"
                  className="h-48 w-full rounded-lg object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={() => setPhoto("https://via.placeholder.com/400x500?text=Kafit+Rasm")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="h-48 w-full rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-12 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                onClick={() => triggerFileInput(true)}
              >
                <Camera className="mr-2 h-5 w-5" />
                Rasmga olish
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                onClick={() => triggerFileInput(false)}
              >
                <ImageIcon className="mr-2 h-5 w-5" />
                Galereyadan
              </Button>
            </div>
          </div>
        </Card>

        {/* Name */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label
            htmlFor="name"
            className="mb-4 block dark:text-white"
          >
            Mahsulot nomi
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nomi..."
            className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />
        </Card>

        {/* Collection */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label
            htmlFor="collection"
            className="mb-4 block dark:text-white"
          >
            Kolleksiya nomi
          </Label>
          <div className="space-y-4">
            <Select
              value={isCustomCollection ? "custom" : collection}
              onValueChange={(v) => {
                if (v === "custom") {
                  setIsCustomCollection(true);
                  setCollection(customCollection);
                } else {
                  setIsCustomCollection(false);
                  setCollection(v);
                }
              }}
            >
              <SelectTrigger className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Kolleksiyani tanlang" />
              </SelectTrigger>
              <SelectContent>
                {predefinedCollections.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Boshqa...</SelectItem>
              </SelectContent>
            </Select>

            {isCustomCollection && (
              <Input
                value={customCollection}
                onChange={(e) => {
                  setCustomCollection(e.target.value);
                  setCollection(e.target.value);
                }}
                placeholder="Kolleksiya nomini kiriting..."
                className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            )}
          </div>
        </Card>

        {/* Available Sizes for Unit Products */}
        {type === "unit" && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <Label className="mb-4 block dark:text-white">
              O'lchamlar (masalan: 2x3, 3x4)
            </Label>
            <div className="flex space-x-2">
              <Input
                value={sizeInput}
                onChange={(e) => setSizeInput(e.target.value)}
                placeholder="O'lcham (masalan: 2x3)"
                className="h-12 flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (sizeInput && !availableSizes.includes(sizeInput)) {
                      setAvailableSizes([...availableSizes, sizeInput]);
                      setSizeInput("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                className="h-12 px-4 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={(e) => {
                  e.preventDefault();
                  if (sizeInput && !availableSizes.includes(sizeInput)) {
                    setAvailableSizes([...availableSizes, sizeInput]);
                    setSizeInput("");
                  }
                }}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            {availableSizes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {availableSizes.map((size) => (
                  <Badge
                    key={size}
                    variant="secondary"
                    className="flex items-center py-1 px-3 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 hover:bg-blue-200"
                  >
                    {size}
                    <X
                      className="ml-2 h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setAvailableSizes(
                          availableSizes.filter((s) => s !== size),
                        )
                      }
                    />
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        )}


        {/* Branch Selection for Admin */}
        {user?.role === "admin" && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <Label className="mb-4 block dark:text-white">
              Filialni tanlang
            </Label>
            <Select
              value={branchId}
              onValueChange={setBranchId}
            >
              <SelectTrigger className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <SelectValue placeholder="Filialni tanlang" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        )}

        {/* Category */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label className="mb-4 block dark:text-white">
            Kategoriya
          </Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as Category)}
          >
            <SelectTrigger className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gilamlar">Gilamlar</SelectItem>
              <SelectItem value="Paloslar">Paloslar</SelectItem>
              <SelectItem value="Joynamozlar">
                Joynamozlar
              </SelectItem>
              <SelectItem value="Metrajlar">
                Metrajlar
              </SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Type */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label className="mb-4 block dark:text-white">
            Mahsulot turi
          </Label>
          <RadioGroup
            value={type}
            onValueChange={(v) => setType(v as ProductType)}
          >
            <div className="space-y-3">
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4">
                <RadioGroupItem value="unit" id="unit" />
                <Label
                  htmlFor="unit"
                  className="flex-1 cursor-pointer dark:text-white"
                >
                  Dona
                </Label>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 p-4">
                <RadioGroupItem value="meter" id="meter" />
                <Label
                  htmlFor="meter"
                  className="flex-1 cursor-pointer dark:text-white"
                >
                  Metr
                </Label>
              </div>
            </div>
          </RadioGroup>
        </Card>

        {/* Dynamic Fields */}
        {type === "unit" ? (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <Label
              htmlFor="quantity"
              className="mb-4 block dark:text-white"
            >
              Miqdor (dona)
            </Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
            />
          </Card>
        ) : (
          <>
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <Label
                htmlFor="totalLength"
                className="mb-4 block dark:text-white"
              >
                Umumiy uzunlik (metr)
              </Label>
              <Input
                id="totalLength"
                type="number"
                value={totalLength}
                onChange={(e) => setTotalLength(e.target.value)}
                placeholder="0"
                className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                step="0.1"
              />
            </Card>
            <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
              <Label
                htmlFor="width"
                className="mb-4 block dark:text-white"
              >
                Eni (metr) - ixtiyoriy
              </Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="0"
                className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
                step="0.1"
              />
            </Card>
          </>
        )}

        {/* Prices */}

        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label
            htmlFor="sellPrice"
            className="mb-4 block dark:text-white"
          >
            Sotish narxi {type === "meter" && "(umumiy)"}
          </Label>
          <Input
            id="sellPrice"
            type="number"
            value={sellPrice}
            onChange={(e) => setSellPrice(e.target.value)}
            placeholder="0"
            className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />
        </Card>

        {/* Buy Price - Added this as it was in previous code but missing in UI blocks logic above? No it was missing in previous code snippet read? 
           Wait, previous read of AddProduct.tsx had state `buyPrice` but I don't see the Input for it in the read output?
           Ah, I might have missed it or it was not rendered?
           Let's check read output again.
           
           Lines 38: const [buyPrice, setBuyPrice] = useState("");
           Lines 44: if (!name || !buyPrice || !sellPrice) {
           
           But in JSX...
           It skips buyPrice card?
           
           I see "Name", "Category", "Type", "Dynamic Fields", "Prices".
           In "Prices" section (Line 259), it only has "sellPrice".
           
           Wait, line 259:
           <Card ...>
             <Label htmlFor="sellPrice" ...>
             <Input id="sellPrice" ...>
           </Card>
           
           Where is buyPrice input?
           It seems the original file logic requires `buyPrice` but doesn't have an input for it!
           That would be a bug in the original file too.
           Or maybe I missed scrolling?
           
           I'll add Buy Price input to be safe, as it's required in `handleSave`.
        */}
        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <Label
            htmlFor="buyPrice"
            className="mb-4 block dark:text-white"
          >
            Sotib olish narxi
          </Label>
          <Input
            id="buyPrice"
            type="number"
            value={buyPrice}
            onChange={(e) => setBuyPrice(e.target.value)}
            placeholder="0"
            className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
          />
        </Card>

        {type === "meter" && (
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <Label
              htmlFor="sellPricePerMeter"
              className="mb-4 block dark:text-white"
            >
              Sotish narxi (metr uchun)
            </Label>
            <Input
              id="sellPricePerMeter"
              type="number"
              value={sellPricePerMeter}
              onChange={(e) =>
                setSellPricePerMeter(e.target.value)
              }
              placeholder="0"
              className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-400"
            />
          </Card>
        )}
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-16 left-0 right-0 border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <Button
          onClick={handleSave}
          className="h-14 w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          size="lg"
        >
          {isEditMode ? "Mahsulotni yangilash" : "Mahsulotni saqlash"}
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}