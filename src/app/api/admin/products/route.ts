import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { requireSession } from "@/lib/api-auth";
import { revalidatePublicContent } from "@/lib/revalidate-public";
import { getProducts } from "@/lib/products";
import { unhideProductSlug } from "@/lib/siteSettings";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await getProducts();
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const product = await Product.create(body);
    await unhideProductSlug(product.slug);
    revalidatePublicContent();
    return NextResponse.json({ success: true, product: { ...product.toObject(), _id: String(product._id) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
