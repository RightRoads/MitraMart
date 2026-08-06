import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const KEY = "hs_cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  // Cart holds products only. Services are booked individually.
  function add(item, qty = 1) {
    setItems((prev) => {
      const found = prev.find((i) => i.id === item.id);
      if (found) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { id: item.id, name: item.name, price_cents: item.price_cents, qty }];
    });
  }

  function setQty(id, qty) {
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, qty } : i))
    );
  }

  function remove(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function clear() {
    setItems([]);
  }

  const count = items.reduce((n, i) => n + i.qty, 0);
  const totalCents = items.reduce((n, i) => n + i.qty * i.price_cents, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, count, totalCents }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
