import { getProducts } from "@/lib/products";
import { NextResponse } from "next/server";

/** @deprecated Use /api/products */
export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ scooters: products, products });
}
