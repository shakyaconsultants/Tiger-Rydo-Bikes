"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Boxes,
  History,
  Package,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import Button from "@/components/ui/Button";
import type { InventoryItem, InventoryStockStatus, InventoryTransaction } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";
import {
  ActionBar,
  Empty,
  Field,
  Panel,
  StatCard,
  inputClass,
} from "./shared";

type MessageAnchor = "lowStock" | "adjust";

function InlineFlash({
  message,
  type = "success",
}: {
  message: string;
  type?: "success" | "error" | "info";
}) {
  const styles = {
    success: "border border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border border-red-200 bg-red-50 text-red-700",
    info: "border border-[#E6E6E6] bg-[#FAFAFA] text-[#666]",
  };

  return (
    <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-medium ${styles[type]}`}>
      {message}
    </p>
  );
}

interface InventorySummary {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

interface Props {
  onMessage: (text: string) => void;
  message: string;
}

type StatusFilter = "all" | InventoryStockStatus;
type DetailView = "manage" | "history";

const STATUS_LABELS: Record<InventoryItem["stockStatus"], string> = {
  in_stock: "In stock",
  low: "Low stock",
  out_of_stock: "Out of stock",
};

const STATUS_STYLES: Record<InventoryItem["stockStatus"], string> = {
  in_stock: "bg-emerald-100 text-emerald-800 border-emerald-200",
  low: "bg-amber-100 text-amber-800 border-amber-200",
  out_of_stock: "bg-red-100 text-red-800 border-red-200",
};

const FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in_stock", label: "In stock" },
  { id: "low", label: "Low stock" },
  { id: "out_of_stock", label: "Out of stock" },
];

const TRANSACTION_LABELS: Record<InventoryTransaction["type"], string> = {
  in: "Stock in",
  out: "Stock out",
  adjustment: "Adjustment",
  set: "Set quantity",
};

const MESSAGE_DISMISS_MS = 2000;

function stockPercent(item: InventoryItem): number {
  const target = Math.max(item.lowStockThreshold * 2, item.stockQuantity, 1);
  return Math.min(100, Math.round((item.stockQuantity / target) * 100));
}

export default function InventoryPanel({ onMessage, message }: Props) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [detailView, setDetailView] = useState<DetailView>("manage");
  const [localMessage, setLocalMessage] = useState("");
  const [localMessageType, setLocalMessageType] = useState<"success" | "error" | "info">("info");
  const [messageAnchor, setMessageAnchor] = useState<MessageAnchor | null>(null);
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selected = useMemo(
    () => items.find((item) => item._id === selectedId) ?? null,
    [items, selectedId]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !query || item.name.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || item.stockStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, search, statusFilter]);

  function notify(
    text: string,
    type: "success" | "error" | "info" = "success",
    anchor: MessageAnchor = "adjust"
  ) {
    setLocalMessage(text);
    setLocalMessageType(type);
    setMessageAnchor(anchor);

    if (messageTimerRef.current) {
      clearTimeout(messageTimerRef.current);
    }

    messageTimerRef.current = setTimeout(() => {
      setLocalMessage("");
      setMessageAnchor(null);
      messageTimerRef.current = null;
    }, MESSAGE_DISMISS_MS);
  }

  useEffect(() => {
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, []);

  async function loadInventory(keepSelectedId?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/inventory");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load inventory");

      const nextItems = (data.items || []) as InventoryItem[];
      setItems(nextItems);
      setSummary((data.summary || null) as InventorySummary | null);

      if (keepSelectedId && nextItems.some((item) => item._id === keepSelectedId)) {
        setSelectedId(keepSelectedId);
      } else if (!selectedId && nextItems.length > 0) {
        setSelectedId(nextItems[0]._id);
      } else if (selectedId && !nextItems.some((item) => item._id === selectedId)) {
        setSelectedId(nextItems[0]?._id ?? null);
      }
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(productId?: string) {
    const query = productId ? `?productId=${productId}&limit=30` : "?limit=30";
    const res = await fetch(`/api/admin/inventory/history${query}`);
    const data = await res.json();
    if (res.ok) {
      setHistory((data.history || []) as InventoryTransaction[]);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    if (detailView === "history" && selectedId) {
      loadHistory(selectedId);
    }
  }, [detailView, selectedId]);

  useEffect(() => {
    if (!filteredItems.length) return;
    if (!selectedId || !filteredItems.some((item) => item._id === selectedId)) {
      setSelectedId(filteredItems[0]._id);
    }
  }, [filteredItems, selectedId]);

  function updateSelectedLocal(patch: Partial<InventoryItem>) {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((item) => (item._id === selectedId ? { ...item, ...patch } : item))
    );
  }

  async function saveSettings(patch: Partial<InventoryItem>) {
    if (!selected) return;

    setSaving(true);
    const res = await fetch(`/api/admin/inventory/${selected._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      notify(data.error || "Failed to update inventory settings", "error", "lowStock");
      return;
    }

    setItems((prev) => prev.map((item) => (item._id === data.item._id ? data.item : item)));
    notify("Low stock alert saved", "success", "lowStock");
    await loadInventory(data.item._id);
  }

  async function handleAdjustStock() {
    if (!selected) return;

    const qty = Number(adjustQty);
    if (!adjustQty || Number.isNaN(qty) || qty < 0) {
      notify("Enter a valid quantity", "error", "adjust");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/admin/inventory/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selected._id,
        type: adjustType,
        quantity: qty,
        reason: adjustReason,
      }),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      notify(data.error || "Stock adjustment failed", "error", "adjust");
      return;
    }

    setItems((prev) => prev.map((item) => (item._id === data.item._id ? data.item : item)));
    setAdjustQty("");
    setAdjustReason("");
    notify(
      adjustType === "in"
        ? `Added ${qty} units to stock`
        : `Removed ${qty} units from stock`,
      "success",
      "adjust"
    );
    await loadInventory(data.item._id);
    if (detailView === "history") {
      await loadHistory(selected._id);
    }
  }

  async function saveLowStockAlert() {
    if (!selected) return;
    await saveSettings({ lowStockThreshold: selected.lowStockThreshold });
  }

  function applyStatusFilter(filter: StatusFilter) {
    setStatusFilter(filter);
    setLocalMessage("");
    setMessageAnchor(null);
  }

  return (
    <Panel
      title="Inventory"
      description="Track stock for dealer products. Search, filter, and update quantities quickly."
    >
      <div className="mb-4 rounded-xl border border-[#FF5A00]/20 bg-[#FFF8F3] px-4 py-3 text-sm text-[#666]">
        <p className="font-semibold text-[#111]">Quick guide</p>
        <p className="mt-1">
          1. Select a product · 2. Set low stock alert · 3. Add or remove stock with custom adjustment
        </p>
      </div>

      <ActionBar>
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className={inputClass + " pl-9"}
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
          onClick={() => loadInventory(selectedId || undefined)}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </ActionBar>

      {summary && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button type="button" onClick={() => applyStatusFilter("all")} className="text-left">
            <StatCard label="Total Products" value={summary.totalProducts} hint="Tap to show all" accent="gray" />
          </button>
          <button type="button" onClick={() => applyStatusFilter("in_stock")} className="text-left">
            <StatCard label="In Stock" value={summary.inStock} hint="Tap to filter" accent="green" />
          </button>
          <button type="button" onClick={() => applyStatusFilter("low")} className="text-left">
            <StatCard label="Low Stock" value={summary.lowStock} hint="Tap to filter" accent="orange" />
          </button>
          <button type="button" onClick={() => applyStatusFilter("out_of_stock")} className="text-left">
            <StatCard label="Out of Stock" value={summary.outOfStock} hint="Tap to filter" accent="blue" />
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SlidersHorizontal className="h-4 w-4 text-[#999]" />
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => applyStatusFilter(option.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              statusFilter === option.id
                ? "bg-[#111] text-white"
                : "border border-[#E6E6E6] bg-white text-[#666] hover:border-[#FF5A00]/40"
            }`}
          >
            {option.label}
            {option.id !== "all" && (
              <span className="ml-1 opacity-70">
                ({items.filter((item) => item.stockStatus === option.id).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && items.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[#DDD] bg-[#FAFAFA] px-6 py-10 text-center text-sm text-[#888]">
          Loading inventory...
        </div>
      ) : items.length === 0 ? (
        <Empty text="No dealer products yet. Add products in the Dealer Products tab first." />
      ) : filteredItems.length === 0 ? (
        <Empty
          text="No products match your search or filter."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="overflow-hidden rounded-xl border border-[#E6E6E6]">
            <div className="hidden grid-cols-[minmax(0,1.4fr)_100px_110px_90px] gap-3 border-b border-[#F0F0F0] bg-[#FAFAFA] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#888] md:grid">
              <span>Product</span>
              <span className="text-center">Stock</span>
              <span className="text-center">Status</span>
              <span className="text-right">Price</span>
            </div>
            <div className="max-h-[520px] overflow-y-auto">
              {filteredItems.map((item) => {
                const isSelected = item._id === selectedId;
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item._id);
                      setDetailView("manage");
                      setLocalMessage("");
                      setMessageAnchor(null);
                    }}
                    className={`grid w-full grid-cols-1 gap-3 border-b border-[#F0F0F0] p-4 text-left transition-all last:border-b-0 md:grid-cols-[minmax(0,1.4fr)_100px_110px_90px] md:items-center ${
                      isSelected ? "bg-[#FFF8F3]" : "bg-white hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#F4F4F5] ${
                          isSelected ? "ring-2 ring-[#FF5A00]" : ""
                        }`}
                      >
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="44px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-5 w-5 text-[#999]" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#111]">{item.name}</p>
                        <p className="text-xs text-[#888]">
                          {item.isActive ? "Active" : "Inactive"}
                        </p>
                      </div>
                    </div>

                    <div className="md:text-center">
                      <p className="text-[11px] font-semibold uppercase text-[#999] md:hidden">Stock</p>
                      <p className="text-sm font-bold text-[#111]">{item.stockQuantity} units</p>
                    </div>

                    <div className="md:text-center">
                      <p className="text-[11px] font-semibold uppercase text-[#999] md:hidden">Status</p>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[item.stockStatus]}`}
                      >
                        {STATUS_LABELS[item.stockStatus]}
                      </span>
                    </div>

                    <div className="md:text-right">
                      <p className="text-[11px] font-semibold uppercase text-[#999] md:hidden">Price</p>
                      <p className="text-sm font-semibold text-[#FF5A00]">{formatPrice(item.price)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="rounded-xl border border-[#E6E6E6] bg-white">
              <div className="border-b border-[#F0F0F0] p-4">
                <div className="flex items-start gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F4F4F5]">
                    {selected.imageUrl ? (
                      <Image
                        src={selected.imageUrl}
                        alt={selected.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Package className="h-6 w-6 text-[#999]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#111]">{selected.name}</p>
                    <p className="text-sm text-[#FF5A00]">{formatPrice(selected.price)}</p>
                    <span
                      className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[selected.stockStatus]}`}
                    >
                      {STATUS_LABELS[selected.stockStatus]}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-[#E6E6E6] bg-[#FAFAFA] p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#888]">Current stock</p>
                  <p className="mt-1 text-4xl font-bold text-[#111]">{selected.stockQuantity}</p>
                  <p className="mt-1 text-xs text-[#888]">
                    Alert when stock falls to {selected.lowStockThreshold} or below
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E6E6E6]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        selected.stockStatus === "out_of_stock"
                          ? "bg-red-500"
                          : selected.stockStatus === "low"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${stockPercent(selected)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailView("manage")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                      detailView === "manage"
                        ? "bg-[#111] text-white"
                        : "border border-[#E6E6E6] text-[#666]"
                    }`}
                  >
                    <Boxes className="mr-1 inline h-3.5 w-3.5" />
                    Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailView("history")}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold ${
                      detailView === "history"
                        ? "bg-[#111] text-white"
                        : "border border-[#E6E6E6] text-[#666]"
                    }`}
                  >
                    <History className="mr-1 inline h-3.5 w-3.5" />
                    History
                  </button>
                </div>
              </div>

              <div className="p-4">
                {detailView === "manage" ? (
                  <>
                    <Field
                      label="Low stock alert"
                      type="number"
                      value={String(selected.lowStockThreshold)}
                      hint="Warning when stock falls to this number or below"
                      onChange={(v) => {
                        const next = v === "" ? 0 : Math.max(0, Number(v) || 0);
                        updateSelectedLocal({ lowStockThreshold: next });
                      }}
                    />

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
                      onClick={saveLowStockAlert}
                      disabled={saving}
                    >
                      Save low stock alert
                    </Button>
                    {messageAnchor === "lowStock" && localMessage && (
                      <InlineFlash message={localMessage} type={localMessageType} />
                    )}

                    <div className="mt-5 rounded-xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
                      <p className="mb-1 text-sm font-bold text-[#111]">Adjust stock</p>
                      <p className="mb-3 text-xs text-[#888]">
                        Current stock: <span className="font-semibold text-[#111]">{selected.stockQuantity} units</span>
                      </p>

                      <div className="mb-3 flex gap-2">
                        {(["in", "out"] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setAdjustType(type)}
                            className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-semibold ${
                              adjustType === type
                                ? "bg-[#111] text-white"
                                : "border border-[#E6E6E6] bg-white text-[#666]"
                            }`}
                          >
                            {type === "in" ? (
                              <span className="inline-flex items-center justify-center gap-1">
                                <ArrowUp className="h-3.5 w-3.5" /> Add stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center gap-1">
                                <ArrowDown className="h-3.5 w-3.5" /> Remove stock
                              </span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-3">
                        <Field
                          label="Quantity"
                          type="number"
                          value={adjustQty}
                          onChange={setAdjustQty}
                        />
                        <Field
                          label="Reason (optional)"
                          value={adjustReason}
                          onChange={setAdjustReason}
                          placeholder="Restock, damaged, correction..."
                        />
                      </div>

                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={handleAdjustStock}
                        disabled={saving}
                      >
                        {saving ? "Updating..." : "Apply adjustment"}
                      </Button>
                      {messageAnchor === "adjust" && localMessage && (
                        <InlineFlash message={localMessage} type={localMessageType} />
                      )}
                    </div>

                    {selected.stockStatus === "low" && (
                      <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        Stock is running low. Consider restocking soon.
                      </div>
                    )}

                    {selected.stockStatus === "out_of_stock" && (
                      <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        This product is out of stock. Add units to make it available again.
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <p className="mb-3 text-sm font-bold text-[#111]">Recent changes</p>
                    {history.length === 0 ? (
                      <Empty text="No inventory changes recorded yet." />
                    ) : (
                      <div className="max-h-[420px] space-y-2 overflow-y-auto">
                        {history.map((entry) => (
                          <div
                            key={entry._id}
                            className="rounded-lg border border-[#E6E6E6] bg-[#FAFAFA] px-3 py-3 text-sm"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  entry.type === "in"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : entry.type === "out"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {TRANSACTION_LABELS[entry.type]}
                              </span>
                              <span className="text-[11px] text-[#888]">
                                {entry.createdAt
                                  ? new Date(entry.createdAt).toLocaleString("en-IN", {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    })
                                  : "—"}
                              </span>
                            </div>
                            <p className="mt-2 font-semibold text-[#111]">
                              {entry.previousStock} → {entry.newStock} units
                              {entry.quantity > 0 ? ` (${entry.quantity})` : ""}
                            </p>
                            {(entry.reason || entry.createdByName) && (
                              <p className="mt-1 text-xs text-[#666]">
                                {entry.reason || "No reason provided"}
                                {entry.createdByName ? ` · ${entry.createdByName}` : ""}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
