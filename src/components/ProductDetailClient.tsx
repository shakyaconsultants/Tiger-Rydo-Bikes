"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/lib/types";
import BatteryVariantSelector from "./BatteryVariantSelector";
import ProductParameters from "./ProductParameters";
import ProductVideo from "./ProductVideo";
import WhatsAppButton from "./WhatsAppButton";
import Button from "./ui/Button";
import { formatPrice } from "@/lib/product-utils";
import { productInquiryMessage } from "@/lib/whatsapp";

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const [selectedId, setSelectedId] = useState(product.batteryVariants[0].id);
  const variant =
    product.batteryVariants.find((v) => v.id === selectedId) ||
    product.batteryVariants[0];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-[#7A7A7A] hover:text-[#FF5A00] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
              {product.tagline.toUpperCase()}
            </p>
            <h1 className="mt-2 font-display text-5xl font-black text-[#111111] md:text-6xl">
              {product.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#7A7A7A]">
              {product.description}
            </p>

            <div className="mt-8">
              <BatteryVariantSelector
                variants={product.batteryVariants}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>

            <div className="mt-8 rounded-2xl bg-[#0A0A0A] p-6">
              <p className="text-xs text-[#7A7A7A]">Selected variant price</p>
              <p className="font-display text-4xl font-black text-[#FF5A00]">
                {formatPrice(variant.price)}
              </p>
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-[#2B2B2B] pt-4">
                <div>
                  <p className="font-display text-2xl font-black text-white">{variant.range}</p>
                  <p className="text-[10px] tracking-wider text-[#7A7A7A]">KM RANGE</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-white">{variant.motor}</p>
                  <p className="text-[10px] tracking-wider text-[#7A7A7A]">MOTOR</p>
                </div>
                <div>
                  <p className="font-display text-2xl font-black text-white">{variant.chargeTime}</p>
                  <p className="text-[10px] tracking-wider text-[#7A7A7A]">CHARGE</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <WhatsAppButton
                phone="919876543210"
                message={productInquiryMessage(product.name, variant.name)}
                label="Enquire on WhatsApp"
              />
              <Link href="/dealers">
                <Button variant="outline">Find a Dealer</Button>
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            <ProductVideo videoUrl={product.videoUrl} title={product.name} />
            <ProductParameters parameters={variant.parameters} />
          </div>
        </div>
      </div>
    </div>
  );
}
