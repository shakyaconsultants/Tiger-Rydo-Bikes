"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/lib/types";
import {
  KEY_FEATURE_LABELS,
  normalizeBrochure,
  SPEC_ICON_CATEGORIES,
  speedCategoryLabel,
} from "@/lib/brochure";
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

const FALLBACK_COLORS = [
  { name: "Wine Red", hex: "#950C0C" },
  { name: "Silver White", hex: "#EBEBE4" },
  { name: "Carbon Black", hex: "#1E1E1E" },
  { name: "Metallic Grey", hex: "#9E9E9E" },
];

function colorHex(name: string): string {
  const known = FALLBACK_COLORS.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (known) return known.hex;
  const n = name.toLowerCase();
  if (n.includes("red") || n.includes("wine")) return "#950C0C";
  if (n.includes("white") || n.includes("ivory") || n.includes("silver")) return "#EBEBE4";
  if (n.includes("black") || n.includes("carbon")) return "#1E1E1E";
  if (n.includes("grey") || n.includes("gray")) return "#9E9E9E";
  return "#FF5A00";
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const brochure = useMemo(() => normalizeBrochure(product.brochure), [product.brochure]);
  const [selectedId, setSelectedId] = useState(product.batteryVariants[0]?.id || "");
  const variant =
    product.batteryVariants.find((v) => v.id === selectedId) || product.batteryVariants[0];

  const speedLabel = speedCategoryLabel(brochure.speedCategory);
  const storyText =
    brochure.shortDescription || product.description || "Built for clean urban mobility.";
  const highlights =
    brochure.highlightFeatures.length > 0
      ? brochure.highlightFeatures.slice(0, 6)
      : SPEC_ICON_CATEGORIES.slice(0, 3).map((c) => c.label);
  const colors =
    brochure.colors.length > 0
      ? brochure.colors.map((name) => ({ name, hex: colorHex(name) }))
      : FALLBACK_COLORS;
  const whatsappPhone = (brochure.phone || "+91 9125158769").replace(/\D/g, "") || "919125158769";

  const powertrain = [
    { label: "Motor", value: brochure.motor },
    { label: "Speed", value: brochure.speed },
    { label: "Chassis", value: brochure.chassis },
    { label: "Suspension", value: brochure.suspension },
  ];
  const battery = [
    { label: "Battery", value: brochure.battery },
    { label: "Charger", value: brochure.charger },
    { label: "Charging (Lithium)", value: brochure.chargingTimeLithium },
    { label: "Charging (Lead Acid)", value: brochure.chargingTimeLeadAcid },
    { label: "Head Light", value: brochure.headLight },
  ];
  const ride = [
    { label: "Brake System", value: brochure.brakeSystem },
    { label: "Tyre", value: brochure.tyre },
    {
      label: "Tyre Size",
      value: `${brochure.tyreSizeFront || ""} / ${brochure.tyreSizeRear || ""}`.replace(/^\s*\/\s*$/, "-"),
    },
    { label: "Weight", value: brochure.weight },
  ];
  const safety = KEY_FEATURE_LABELS.map(({ key, label }) => ({
    label,
    value: brochure.keyFeatures[key] ? "Yes" : "—",
  }));

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 pb-16 lg:px-8">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm text-[#7A7A7A] transition-colors hover:text-[#FF5A00]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Products
        </Link>

        <p className="mt-10 text-xs font-medium tracking-[0.28em] text-[#7A7A7A] uppercase">
          {brochure.coverTagline || "Clean Energy Commuting"}
        </p>
        <h1 className="mt-3 font-display text-5xl font-black tracking-tight text-[#111111] md:text-7xl">
          {product.name}
        </h1>
        <p className="mt-3 text-lg text-[#7A7A7A] md:text-xl">
          {product.tagline || "Elegance Electrified"}
        </p>

        <div className="relative mt-10 flex min-h-[280px] items-center justify-center md:min-h-[420px]">
          {product.imageUrl ? (
            <div className="relative h-[280px] w-full max-w-4xl md:h-[440px]">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 900px"
                className="object-contain drop-shadow-[0_28px_40px_rgba(0,0,0,0.18)]"
              />
            </div>
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-[#F7F7F7] text-[#7A7A7A]">
              Product image coming soon
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-[#E6E6E6] pt-8">
          <div>
            <p className="text-xs tracking-wider text-[#7A7A7A] uppercase">Starting at</p>
            <p className="mt-1 font-display text-4xl font-black text-[#FF5A00] md:text-5xl">
              {formatPrice(variant?.price ?? 0)}
            </p>
          </div>
          <p className="text-sm font-medium tracking-[0.2em] text-[#7A7A7A] uppercase">
            {speedLabel}
          </p>
        </div>
      </section>

      {/* STORY + GALLERY */}
      <section className="border-t border-[#F0F0F0] bg-[#FAFAFA]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl font-black text-[#111111] md:text-4xl">
              {product.name}
            </h2>
            <div className="mt-3 h-1 w-16 bg-[#FF5A00]" />
            <p className="mt-6 text-base leading-relaxed text-[#666666]">{storyText}</p>

            <ul className="mt-10 space-y-5">
              {highlights.map((feature) => (
                <li key={feature} className="flex gap-4 border-b border-[#E6E6E6] pb-5 last:border-0">
                  <span className="mt-1 h-6 w-6 shrink-0 rounded-full border-2 border-[#FF5A00]" />
                  <div>
                    <p className="font-semibold text-[#111111]">{feature}</p>
                    <p className="mt-1 text-sm text-[#7A7A7A]">Premium feature</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            {brochure.galleryImages.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {brochure.galleryImages.slice(0, 4).map((item) => (
                  <figure
                    key={item.url}
                    className="overflow-hidden rounded-2xl border border-[#E6E6E6] bg-white"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={item.url}
                        alt={item.caption || product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 40vw"
                        className="object-contain p-3"
                      />
                    </div>
                    {item.caption ? (
                      <figcaption className="border-t border-[#F0F0F0] px-3 py-2 text-center text-xs text-[#7A7A7A]">
                        {item.caption}
                      </figcaption>
                    ) : null}
                  </figure>
                ))}
              </div>
            ) : product.imageUrl ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-6"
                />
              </div>
            ) : null}

            <div className="mt-8">
              <p className="text-xs font-bold tracking-[0.2em] text-[#111111] uppercase">
                Available Colors
              </p>
              <div className="mt-4 flex flex-wrap gap-6">
                {colors.map((c) => (
                  <div key={c.name} className="flex flex-col items-center gap-2">
                    <span
                      className="h-8 w-8 rounded-full border border-[#E6E6E6] shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[11px] text-[#7A7A7A]">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SPECIFICATIONS */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <h2 className="font-display text-3xl font-black text-[#111111] md:text-4xl">
          SPECIFICATIONS
        </h2>
        <div className="mt-3 h-1 w-16 bg-[#FF5A00]" />

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <SpecCard title="POWERTRAIN" rows={powertrain} />
          <SpecCard title="BATTERY & ELECTRICAL" rows={battery} />
          <SpecCard title="RIDE & COMFORT" rows={ride} />
          <SpecCard title="SAFETY & FEATURES" rows={safety} />
        </div>

        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4">
          {SPEC_ICON_CATEGORIES.map(({ key, label }) => {
            const iconUrl = brochure.specIconImages?.[key] || "";
            return (
              <div key={key} className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#FF5A00] bg-[#FAFAFA] md:h-28 md:w-28">
                  {iconUrl ? (
                    <Image
                      src={iconUrl}
                      alt={label}
                      width={88}
                      height={88}
                      className="h-[70%] w-[70%] object-contain"
                    />
                  ) : (
                    <span className="text-[10px] tracking-wide text-[#BBBBBB] uppercase">Icon</span>
                  )}
                </div>
                <p className="mt-4 text-sm font-bold text-[#111111]">{label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* VARIANTS + VIDEO + CTA */}
      <section className="border-t border-[#F0F0F0] bg-[#FAFAFA]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-display text-2xl font-black text-[#111111]">Choose your battery</h2>
            <div className="mt-6">
              {product.batteryVariants.length > 0 ? (
                <BatteryVariantSelector
                  variants={product.batteryVariants}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ) : null}
            </div>

            <div className="mt-8 rounded-2xl bg-[#0A0A0A] p-6">
              <p className="text-xs text-[#7A7A7A]">Selected variant price</p>
              <p className="font-display text-4xl font-black text-[#FF5A00]">
                {formatPrice(variant?.price ?? 0)}
              </p>
              {variant ? (
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
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <WhatsAppButton
                phone={whatsappPhone}
                message={productInquiryMessage(product.name, variant?.name || "standard")}
                label="Enquire on WhatsApp"
              />
              <Link href="/dealers">
                <Button variant="outline">Find a Dealer</Button>
              </Link>
            </div>

            <div className="mt-8 space-y-2 text-sm text-[#7A7A7A]">
              {brochure.website ? <p>Web: {brochure.website}</p> : null}
              {brochure.phone ? <p>Phone: {brochure.phone}</p> : null}
              {brochure.email ? <p>Email: {brochure.email}</p> : null}
            </div>
          </div>

          <div className="space-y-8">
            {product.videoUrl ? (
              <ProductVideo videoUrl={product.videoUrl} title={product.name} />
            ) : null}
            {variant?.parameters?.length ? (
              <ProductParameters parameters={variant.parameters} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function SpecCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: string }>;
}) {
  const visible = rows.filter((r) => r.value?.trim());
  return (
    <div className="rounded-2xl border border-[#E6E6E6] bg-white p-6">
      <h3 className="text-sm font-bold tracking-wider text-[#FF5A00]">{title}</h3>
      <div className="mt-3 h-px w-full bg-[#E6E6E6]" />
      <dl className="mt-4 space-y-3">
        {visible.length > 0 ? (
          visible.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-[#7A7A7A]">{row.label}</dt>
              <dd className="max-w-[55%] text-right font-semibold text-[#111111]">{row.value}</dd>
            </div>
          ))
        ) : (
          <p className="text-sm text-[#AAAAAA]">Details coming soon</p>
        )}
      </dl>
    </div>
  );
}
