"use client";

import { Clock, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Order, OrderStatus } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";
import { Empty, Panel, StatusBadge, inputClass } from "./shared";

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface OrdersPanelProps {
  orders: Order[];
  title?: string;
  description?: string;
  mode: "admin" | "dealer";
  emptyText?: string;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  cancellingId?: string | null;
}

export default function OrdersPanel({
  orders,
  title = "Orders",
  description,
  mode,
  emptyText = "No orders yet.",
  onStatusChange,
  onCancel,
  cancellingId,
}: OrdersPanelProps) {
  return (
    <Panel title={title} description={description}>
      {orders.length === 0 ? (
        <Empty text={emptyText} />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o._id}
              className="rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF5A00]/10 text-[#FF5A00]">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-[#111]">{o.productName}</p>
                    <p className="text-sm text-[#666]">
                      {o.variantName} · Qty {o.quantity}
                    </p>
                    {mode === "admin" && (
                      <p className="text-sm text-[#666]">
                        {o.dealerName} · {o.dealerCity}
                      </p>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#999]">
                      <Clock className="h-3 w-3" />
                      {formatDate(o.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <p className="mt-2 font-bold text-[#111]">{formatPrice(o.totalPrice)}</p>
                </div>
              </div>

              {o.notes && (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-[#666]">
                  <span className="font-medium text-[#333]">Notes:</span> {o.notes}
                </p>
              )}

              {mode === "admin" && onStatusChange && (
                <select
                  className={inputClass + " mt-3 max-w-[180px]"}
                  value={o.status}
                  onChange={(e) => onStatusChange(o._id!, e.target.value as OrderStatus)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              )}

              {mode === "dealer" && o.status === "pending" && onCancel && (
                <div className="mt-3 flex justify-end border-t border-[#EEE] pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={cancellingId === o._id}
                    onClick={() => onCancel(o._id!)}
                  >
                    {cancellingId === o._id ? "Cancelling..." : "Cancel Order"}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
