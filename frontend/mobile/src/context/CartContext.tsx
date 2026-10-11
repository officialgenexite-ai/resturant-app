import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import storage from "../utils/storage";
import { CartLineItem } from "../types/cart.types";
import { Product, ProductVariant } from "../types/menu.types";

interface CartContextType {
  items: CartLineItem[];
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
  addItem: (product: Product, variant: ProductVariant | null, quantity: number) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "cartItems";

function buildLineId(productId: string, variantName: string | null): string {
  return variantName ? `${productId}::${variantName}` : productId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Hydrate cart from storage on boot
  useEffect(() => {
    (async () => {
      try {
        const stored = await storage.getItem(CART_STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored) as CartLineItem[]);
        }
      } catch (err) {
        console.log("Cart hydration error:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Persist to storage on every change (after initial hydration)
  useEffect(() => {
    if (isLoading) return; // don't overwrite storage during initial load
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, isLoading]);

  const addItem = useCallback(
    (product: Product, variant: ProductVariant | null, quantity: number) => {
      const lineId = buildLineId(product._id, variant?.name ?? null);
      const unitPrice = product.basePrice + (variant?.priceModifier ?? 0);

      setItems((prev) => {
        const existingIndex = prev.findIndex((line) => line.lineId === lineId);

        if (existingIndex !== -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + quantity,
          };
          return updated;
        }

        const newLine: CartLineItem = {
          lineId,
          productId: product._id,
          title: product.title,
          image: product.image,
          variantName: variant?.name ?? null,
          unitPrice,
          quantity,
        };
        return [...prev, newLine];
      });
    },
    []
  );

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((line) => line.lineId !== lineId);
      }
      return prev.map((line) => (line.lineId === lineId ? { ...line, quantity } : line));
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((line) => line.lineId !== lineId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const cartCount = items.reduce((sum, line) => sum + line.quantity, 0);
  const cartTotal = items.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, cartCount, cartTotal, isLoading, addItem, updateQuantity, removeItem, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
