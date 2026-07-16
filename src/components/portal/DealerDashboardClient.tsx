"use client";

import { useMemo, useState } from "react";
import DealerLogoutButton from "@/components/DealerLogoutButton";
import type { DealerSession, CartItem, ListedProduct, Order, OrderStatus, Product } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";
import PlaceOrderPanel from "./PlaceOrderPanel";
import OrdersPanel from "./OrdersPanel";
import DealerProductsPanel from "./DealerProductsPanel";
import {
  PortalShell,
  SimpleTabs,
  Flash,
  StatCard,
} from "./shared";

type Tab = "products" | "order" | "orders";

interface Props {
  session: DealerSession;
  products: Product[];
  listedProducts: ListedProduct[];
  initialOrders: Order[];
}

export default function DealerDashboardClient({
  session,
  products,
  listedProducts,
  initialOrders,
}: Props) {
  const [tab, setTab] = useState<Tab>("products");
  const [orders, setOrders] = useState(initialOrders);
  const [message, setMessage] = useState("");
  const [flashType, setFlashType] = useState<"info" | "success" | "error">("info");
  const [loading, setLoading] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "cancelled");
    const pending = orders.filter((o) => o.status === "pending");
    const totalValue = active.reduce((sum, o) => sum + o.totalPrice, 0);
    return { total: orders.length, pending: pending.length, totalValue };
  }, [orders]);

  function showMessage(text: string, type: "info" | "success" | "error" = "info") {
    setMessage(text);
    setFlashType(type);
  }

  async function checkoutCart(items: CartItem[], notes: string) {
    setLoading(true);
    showMessage("");
    const res = await fetch("/api/dealer/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartItems: items.map((item) => ({
          listedProductId: item.listedProductId,
          quantity: item.quantity,
        })),
        notes,
      }),
    });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) {
      showMessage(result.error || "Order failed", "error");
      return;
    }
    const newOrders = result.orders || [];
    setOrders((prev) => [...newOrders, ...prev]);
    showMessage(
      newOrders.length === 1
        ? "Order placed successfully!"
        : `${newOrders.length} orders placed successfully!`,
      "success"
    );
    setTab("orders");
  }

  async function placeOrder(data: {
    productSlug: string;
    variantId: string;
    quantity: number;
    notes: string;
  }) {
    setLoading(true);
    showMessage("");
    const res = await fetch("/api/dealer/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setLoading(false);
    if (!res.ok) {
      showMessage(result.error || "Order failed", "error");
      return;
    }
    setOrders((prev) => [result.order, ...prev]);
    showMessage("Order placed successfully!", "success");
    setTab("orders");
  }

  async function cancelOrder(orderId: string) {
    if (!confirm("Cancel this pending order?")) return;

    setCancellingId(orderId);
    const res = await fetch(`/api/dealer/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "cancelled" }),
    });
    const data = await res.json();
    setCancellingId(null);

    if (!res.ok) {
      showMessage(data.error || "Could not cancel order", "error");
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o._id === orderId ? { ...o, status: "cancelled" as OrderStatus } : o))
    );
    showMessage("Order cancelled", "success");
  }

  return (
    <PortalShell
      badge="Dealer Portal"
      title="Dealer Dashboard"
      subtitle={`${session.name} · ${session.city}`}
    >
      <div className="mb-6 flex justify-end">
        <DealerLogoutButton />
      </div>

      <Flash message={message} type={flashType} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Orders" value={stats.total} hint="All time" accent="blue" />
        <StatCard label="Pending" value={stats.pending} hint="Awaiting confirmation" accent="orange" />
        <StatCard
          label="Order Value"
          value={formatPrice(stats.totalValue)}
          hint="Excludes cancelled"
          accent="green"
        />
      </div>

      <SimpleTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "products", label: "Products", count: listedProducts.length || undefined },
          { id: "orders", label: "My Orders", count: orders.length },
          { id: "order", label: "Place E-Bike Order" },
        ]}
      />

      {tab === "products" && (
        <DealerProductsPanel
          products={listedProducts}
          onCheckout={checkoutCart}
          loading={loading}
          onMessage={showMessage}
        />
      )}

      {tab === "orders" && (
        <OrdersPanel
          orders={orders}
          mode="dealer"
          title="Order History"
          description="Track your e-bike orders and their current status."
          emptyText="You haven't placed any orders yet."
          onCancel={cancelOrder}
          cancellingId={cancellingId}
        />
      )}

      {tab === "order" && (
        <PlaceOrderPanel products={products} loading={loading} onSubmit={placeOrder} />
      )}
    </PortalShell>
  );
}
