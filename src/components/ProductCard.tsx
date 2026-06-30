import Link from "next/link";
import { ArrowRight, Battery } from "lucide-react";
import Button from "./ui/Button";
import type { Product } from "@/lib/types";
import { formatPrice, getLowestPrice } from "@/lib/product-utils";
import Image from "next/image";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const lowestPrice = getLowestPrice(product);
  const variantCount = product.batteryVariants.length;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E6E6E6] bg-white transition-all hover:border-[#FF5A00]/30 hover:shadow-xl">
      {product.featured && (
        <span className="absolute top-4 right-4 z-10 rounded-full bg-[#FF5A00] px-3 py-1 text-xs font-bold text-white">
          FEATURED
        </span>
      )}

      <div className="relative flex h-64 items-center justify-center overflow-hidden bg-[#0A0A0A]">        {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105" />
      ) : (
        <MiniScooterSvg />
      )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium tracking-wider text-[#FF5A00]">
          {product.tagline.toUpperCase()}
        </p>
        <h3 className="mt-2 font-display text-2xl font-black text-[#111111]">
          {product.name}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[#7A7A7A]">
          {product.description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-sm text-[#2B2B2B]">
          <Battery className="h-4 w-4 text-[#FF5A00]" />
          <span>{variantCount} Battery Variant{variantCount > 1 ? "s" : ""}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {product.batteryVariants.map((v) => (
            <span
              key={v.id}
              className="rounded-full border border-[#E6E6E6] px-3 py-1 text-xs font-medium text-[#2B2B2B]"
            >
              {v.name}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-[#E6E6E6] pt-6">
          <div>
            <p className="text-xs text-[#7A7A7A]">Starting at</p>
            <p className="font-display text-xl font-black text-[#111111]">
              {formatPrice(lowestPrice)}
            </p>
          </div>
          <Link href={`/products/${product.slug}`}>
            <Button size="sm" className="group/btn">
              View Details
              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </article>
  );
}

function MiniScooterSvg() {
  return (
    <svg viewBox="0 0 200 120" className="h-28 w-44" aria-hidden="true">
      <rect x="60" y="40" width="80" height="40" rx="6" fill="#2B2B2B" />
      <line x1="100" y1="40" x2="100" y2="15" stroke="#7A7A7A" strokeWidth="3" />
      <circle cx="70" cy="85" r="18" stroke="#FF5A00" strokeWidth="2" fill="#111111" />
      <circle cx="130" cy="85" r="18" stroke="#FF5A00" strokeWidth="2" fill="#111111" />
      <circle cx="155" cy="50" r="5" fill="#FF5A00" />
    </svg>
  );
}
