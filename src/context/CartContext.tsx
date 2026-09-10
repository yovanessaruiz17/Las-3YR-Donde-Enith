import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { storeService } from '../services/storeService';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  removeFromCart: (id: string) => void;
  increaseQuantity: (id: string) => void;
  decreaseQuantity: (id: string) => void;
  clearCart: () => void;
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  formatCurrency: (value: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'las3yr_cart_items_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);
  const [shippingCost, setShippingCost] = useState(12000);
  const [freeShippingFrom, setFreeShippingFrom] = useState(150000);

  // Sync with store settings
  useEffect(() => {
    storeService.getStoreSettings().then((settings) => {
      if (settings) {
        if (typeof settings.shipping_cost === 'number') setShippingCost(settings.shipping_cost);
        if (typeof settings.free_shipping_from === 'number') setFreeShippingFrom(settings.free_shipping_from);
      }
    });
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, variant?: string) => {
    const availableStock = typeof product.stock === 'number' ? Math.max(0, product.stock) : 999;
    if (availableStock <= 0 || product.active === false) {
      return; // No se puede agregar si el producto está sin stock o inactivo
    }

    setCart((prev) => {
      const itemKey = variant ? `${product.id}-${variant}` : product.id;
      const existing = prev.find((item) => item.id === itemKey);

      if (existing) {
        const newQty = Math.min(availableStock, existing.quantity + quantity);
        return prev.map((item) =>
          item.id === itemKey ? { ...item, quantity: newQty } : item
        );
      } else {
        const initialQty = Math.min(availableStock, Math.max(1, quantity));
        return [...prev, { id: itemKey, product, quantity: initialQty, selected_variant: variant }];
      }
    });
    setIsOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const increaseQuantity = (id: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const maxStock = typeof item.product.stock === 'number' ? Math.max(0, item.product.stock) : 999;
          if (item.quantity >= maxStock) return item;
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      })
    );
  };

  const decreaseQuantity = (id: string) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  // Totals calculation
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= freeShippingFrom || subtotal === 0 ? 0 : shippingCost;
  const total = subtotal + shipping;
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        subtotal,
        shipping,
        total,
        itemCount,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
        formatCurrency: storeService.formatCurrency,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe utilizarse dentro de un CartProvider');
  }
  return context;
};
