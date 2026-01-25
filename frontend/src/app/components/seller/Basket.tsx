import {
  ArrowLeft,
  Trash2,
  ShoppingCart,
  Plus,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useApp, BasketItem } from "../../context/AppContext";
import { Input } from "../ui/input";
import { BottomNav } from "../shared/BottomNav";
import { EditBasketItemModal } from "./EditBasketItemModal";
import { toast } from "sonner";

export function Basket() {
  const navigate = useNavigate();
  const { basket, removeFromBasket, updateBasketItem, updateBasketItemFull, products } =
    useApp();
  const [editingItem, setEditingItem] = useState<BasketItem | null>(null);

  const formatCurrency = (amount: number) => {
    return (
      new Intl.NumberFormat("uz-UZ").format(amount) + " so'm"
    );
  };

  const total = basket.reduce(
    (sum, item) => sum + item.total,
    0,
  );

  const handleQuantityChange = (
    id: string,
    newQuantity: string,
    pricePerUnit: number,
  ) => {
    const quantity = parseFloat(newQuantity) || 0;
    if (quantity > 0) {
      updateBasketItem(id, quantity, pricePerUnit);
    }
  };

  const handlePriceChange = (
    id: string,
    quantity: number,
    newPrice: string,
  ) => {
    const price = parseFloat(newPrice) || 0;
    if (price > 0) {
      updateBasketItem(id, quantity, price);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            {/* <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/seller/sell')}
            >
              <ArrowLeft className="h-6 w-6 dark:text-white" />
            </Button> */}
            <h1 className="text-xl dark:text-white">Savat</h1>
          </div>
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <ShoppingCart className="h-5 w-5" />
            <span>{basket.length}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {basket.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            {/* Icon with gradient background */}
            <div className="mb-6 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-8">
              <ShoppingCart className="h-20 w-20 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
            </div>

            {/* Heading */}
            <h3 className="mb-2 text-xl text-gray-900 dark:text-white">
              Savat bo'sh
            </h3>

            {/* Description */}
            <p className="text-center text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
              Mahsulot sotish uchun savatga qo'shing
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={() => navigate("/seller/sell")}
                size="lg"
                className="w-full h-14 text-base bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                <Plus className="mr-2 h-5 w-5" />
                Mahsulot sotish
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Add Product Button */}
            <Button
              onClick={() => navigate("/seller/sell")}
              variant="outline"
              className="w-full h-12 border-2 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Plus className="h-5 w-5 mr-2" />
              Mahsulot qo'shish
            </Button>

            {basket.map((item) => (
              <Card
                key={item.id}
                className="p-4 dark:bg-gray-800 dark:border-gray-700"
              >
                <div className="flex gap-4">
                  <img
                    src={item.photo}
                    alt={item.productName}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="dark:text-white">
                          {item.productName}
                        </h3>
                        {item.width && item.height && item.area && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            O'lcham: {item.width}×{item.height} ({item.area.toFixed(2)} m²)
                          </p>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.width && item.height
                            ? `Soni: ${item.quantity}`
                            : (item.type === "unit"
                              ? `Miqdor: ${item.quantity}`
                              : `Metr: ${item.quantity}`)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingItem(item)}
                          className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900"
                        >
                          <Pencil className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            removeFromBasket(item.id)
                          }
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-2 border-t dark:border-gray-700">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatCurrency(item.pricePerUnit)}
                        {item.type === "meter" ? " / m²" : " / dona"}
                      </div>
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </>
        )}
      </div>

      {/* Fixed Bottom: Total and Checkout */}
      {/* Removed - using BottomNav checkout button instead */}

      <BottomNav onCheckoutClick={() => navigate("/seller/checkout")} />

      {editingItem && (
        <EditBasketItemModal
          item={editingItem}
          product={products.find((p) => p.id === editingItem.productId)!}
          onUpdate={(updatedItem) => {
            updateBasketItemFull(updatedItem);
            toast.success("Mahsulot o'zgartirildi!", {
              duration: 1000,
            });
            setEditingItem(null);
          }}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
}