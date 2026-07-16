import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getListedProducts } from "@/lib/listed-products";

export async function GET() {
  const session = await requireSession(["admin", "dealer"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await getListedProducts(true);
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}
