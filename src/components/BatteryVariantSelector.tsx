"use client";

import type { BatteryVariant } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";

interface BatteryVariantSelectorProps {
  variants: BatteryVariant[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function BatteryVariantSelector({
  variants,
  selectedId,
  onSelect,
}: BatteryVariantSelectorProps) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00] mb-3">
        BATTERY VARIANTS
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelect(variant.id)}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-[#FF5A00] bg-[#FF5A00]/5"
                  : "border-[#E6E6E6] bg-white hover:border-[#FF5A00]/40"
              }`}
            >
              <p className="font-display text-xl font-black text-[#111111]">
                {variant.name}
              </p>
              <p className="mt-1 text-sm text-[#7A7A7A]">{variant.range} km range</p>
              <p className="mt-2 font-semibold text-[#FF5A00]">
                {formatPrice(variant.price)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
