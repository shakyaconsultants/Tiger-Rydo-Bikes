"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import Button from "@/components/ui/Button";
import type { Dealer, Product } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";
import { ActionBar, Empty, Panel, inputClass, inputErrorClass } from "./shared";

interface PlaceOrderPanelProps {
  products: Product[];
  dealers?: Dealer[];
  loading?: boolean;
  onSubmit: (data: {
    productSlug: string;
    variantId: string;
    quantity: number;
    notes: string;
    dealerId?: string;
  }) => Promise<void>;
}

export default function PlaceOrderPanel({
  products,
  dealers,
  loading = false,
  onSubmit,
}: PlaceOrderPanelProps) {
  const [productSlug, setProductSlug] = useState(products[0]?.slug || "");
  const [variantId, setVariantId] = useState(products[0]?.batteryVariants[0]?.id || "");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [dealerId, setDealerId] = useState(dealers?.[0]?._id || "");
  const [errors, setErrors] = useState<{
    product?: string;
    variant?: string;
    quantity?: string;
    dealer?: string;
  }>({});

  const selectedProduct = products.find((p) => p.slug === productSlug);
  const variants = selectedProduct?.batteryVariants || [];
  const unitPrice = variants.find((v) => v.id === variantId)?.price || 0;

  async function handleSubmit() {
    const nextErrors: typeof errors = {};
    if (dealers?.length && !dealerId) nextErrors.dealer = "Select a dealer";
    if (!productSlug) nextErrors.product = "Please select an e-bike";
    if (!variantId) nextErrors.variant = "Please select a battery variant";
    if (!quantity || quantity < 1) nextErrors.quantity = "Quantity is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      productSlug,
      variantId,
      quantity,
      notes,
      dealerId: dealers?.length ? dealerId : undefined,
    });
    setNotes("");
  }

  if (products.length === 0) {
    return (
      <Panel title="Place New Order" description="Order e-bikes for a dealer.">
        <Empty text="No e-bikes available to order. Add products in the E-Bikes tab first." />
      </Panel>
    );
  }

  return (
    <Panel
      title="Place New Order"
      description={
        dealers?.length
          ? "Select a dealer, e-bike, battery variant, and quantity."
          : "Select an e-bike, battery variant, and quantity."
      }
    >
      <ActionBar>
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          {loading ? "Placing order..." : "Place Order"}
        </Button>
      </ActionBar>

      <div className="grid gap-4 sm:grid-cols-2">
        {dealers && dealers.length > 0 && (
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-[#333]">
              Dealer <span className="text-red-500">*</span>
            </label>
            <select
              className={errors.dealer ? inputErrorClass : inputClass}
              value={dealerId}
              onChange={(e) => {
                setDealerId(e.target.value);
                setErrors((err) => ({ ...err, dealer: undefined }));
              }}
            >
              {dealers.map((d) => (
                <option key={d._id || d.email} value={d._id}>
                  {d.name} · {d.city}
                </option>
              ))}
            </select>
            {errors.dealer && <p className="mt-1 text-xs text-red-500">{errors.dealer}</p>}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#333]">
            E-Bike <span className="text-red-500">*</span>
          </label>
          <select
            className={errors.product ? inputErrorClass : inputClass}
            value={productSlug}
            onChange={(e) => {
              setProductSlug(e.target.value);
              const p = products.find((x) => x.slug === e.target.value);
              setVariantId(p?.batteryVariants[0]?.id || "");
              setErrors((err) => ({ ...err, product: undefined }));
            }}
          >
            {products.map((p) => (
              <option key={p.slug} value={p.slug}>{p.name}</option>
            ))}
          </select>
          {errors.product && <p className="mt-1 text-xs text-red-500">{errors.product}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#333]">
            Battery Variant <span className="text-red-500">*</span>
          </label>
          <select
            className={errors.variant ? inputErrorClass : inputClass}
            value={variantId}
            onChange={(e) => {
              setVariantId(e.target.value);
              setErrors((err) => ({ ...err, variant: undefined }));
            }}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — {formatPrice(v.price)} · {v.range} km
              </option>
            ))}
          </select>
          {errors.variant && <p className="mt-1 text-xs text-red-500">{errors.variant}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#333]">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            className={errors.quantity ? inputErrorClass : inputClass}
            value={quantity}
            onChange={(e) => {
              setQuantity(Number(e.target.value));
              setErrors((err) => ({ ...err, quantity: undefined }));
            }}
          />
          {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
        </div>

        <div className="flex items-end">
          <div className="w-full rounded-xl border border-[#FF5A00]/30 bg-[#FF5A00]/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-[#FF5A00]">Order Total</p>
            <p className="text-2xl font-bold text-[#111]">{formatPrice(unitPrice * quantity)}</p>
            <p className="text-xs text-[#888]">{formatPrice(unitPrice)} per unit</p>
          </div>
        </div>
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
    </Panel>
  );
}
