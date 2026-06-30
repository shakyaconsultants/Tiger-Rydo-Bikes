import type { Product } from "@/lib/types";

export function isMongoObjectId(id?: string): boolean {
  return !!id && /^[a-f0-9]{24}$/i.test(id);
}

export function getLowestPrice(product: Product): number {
  return Math.min(...product.batteryVariants.map((v) => v.price));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}
