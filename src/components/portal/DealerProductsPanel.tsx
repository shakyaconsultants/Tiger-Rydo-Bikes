"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import type { CartItem, ListedProduct } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";
import { ActionBar, Empty, Panel, inputClass } from "./shared";

const CART_STORAGE_KEY = "tiger-rydo-dealer-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

interface Props {
  products: ListedProduct[];
  onCheckout: (items: CartItem[], notes: string) => Promise<void>;
  loading?: boolean;
  onMessage: (text: string, type?: "info" | "success" | "error") => void;
}

export default function DealerProductsPanel({
  products,
  onCheckout,
  loading = false,
  onMessage,
}: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState("");
  const [view, setView] = useState<"products" | "cart">("products");

  useEffect(() => {
    setCart(loadCart());
  }, []);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  function addToCart(product: ListedProduct) {
    const productId = product._id;
    if (!productId) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.listedProductId === productId);
      if (existing) {
        return prev.map((item) =>
          item.listedProductId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          listedProductId: productId,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          quantity: 1,
        },
      ];
    });
    onMessage(`Added "${product.name}" to cart`, "success");
  }

  function updateQuantity(listedProductId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.listedProductId === listedProductId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeFromCart(listedProductId: string) {
    setCart((prev) => prev.filter((item) => item.listedProductId !== listedProductId));
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      onMessage("Your cart is empty", "error");
      return;
    }
    await onCheckout(cart, notes);
    setCart([]);
    setNotes("");
    setView("products");
  }

  if (products.length === 0) {
    return (
      <Panel
        title="Products"
        description="Browse dealer-only products and add them to your cart."
      >
        <Empty text="No products available yet. Check back later." />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setView("products")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            view === "products"
              ? "bg-[#111] text-white shadow-md"
              : "border border-[#E6E6E6] bg-white text-[#666] hover:border-[#FF5A00]/40"
          }`}
        >
          Products
        </button>
        <button
          type="button"
          onClick={() => setView("cart")}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            view === "cart"
              ? "bg-[#111] text-white shadow-md"
              : "border border-[#E6E6E6] bg-white text-[#666] hover:border-[#FF5A00]/40"
          }`}
        >
          Cart
          {cartCount > 0 && (
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                view === "cart" ? "bg-white/20 text-white" : "bg-[#FF5A00] text-white"
              }`}
            >
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {view === "products" && (
        <Panel
          title="Products"
          description="Dealer-only catalog. Add items to your cart to place an order."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <div
                key={product._id}
                className="overflow-hidden rounded-xl border border-[#E6E6E6] bg-white shadow-sm"
              >
                <div className="relative aspect-[4/3] bg-[#F4F4F5]">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 280px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[#999]">
                      No image
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-[#111]">{product.name}</h3>
                  <p className="mt-1 text-lg font-bold text-[#FF5A00]">
                    {formatPrice(product.price)}
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => addToCart(product)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {view === "cart" && (
        <Panel title="Shopping Cart" description="Review items and place your order.">
          {cart.length === 0 ? (
            <Empty text="Your cart is empty. Browse products to add items." />
          ) : (
            <>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.listedProductId}
                    className="flex gap-3 rounded-xl border border-[#E6E6E6] bg-white p-3"
                  >
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#F4F4F5]">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[#111]">{item.name}</p>
                      <p className="text-sm text-[#FF5A00]">{formatPrice(item.price)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.listedProductId, -1)}
                          className="rounded border border-[#E6E6E6] p-1 hover:border-[#FF5A00]"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.listedProductId, 1)}
                          className="rounded border border-[#E6E6E6] p-1 hover:border-[#FF5A00]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.listedProductId)}
                          className="ml-auto rounded p-1 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-[#111]">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-[#FF5A00]/30 bg-[#FF5A00]/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-[#FF5A00]">Cart Total</p>
                <p className="text-2xl font-bold text-[#111]">{formatPrice(cartTotal)}</p>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-[#333]">
                  Notes <span className="font-normal text-[#999]">(optional)</span>
                </label>
                <textarea
                  className={inputClass}
                  rows={3}
                  placeholder="Delivery preferences, special requests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <ActionBar>
                <Button size="sm" onClick={handleCheckout} disabled={loading}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {loading ? "Placing order..." : "Place Order"}
                </Button>
              </ActionBar>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}
