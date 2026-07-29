import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ListedProduct } from "@/models/ListedProduct";
import { requireSession } from "@/lib/api-auth";
import { getListedProducts } from "@/lib/listed-products";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await getListedProducts();
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
    const { name, price, imageUrl, isActive } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (price === undefined || Number(price) < 0) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }
    if (!imageUrl?.trim()) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    const product = await ListedProduct.create({
      name: name.trim(),
      price: Number(price),
      imageUrl: imageUrl.trim(),
      isActive: isActive !== false,
      trackInventory: true,
      stockQuantity: 0,
      lowStockThreshold: 5,
    });

    const doc = product.toObject();
    return NextResponse.json({
      success: true,
      product: {
        ...doc,
        _id: String(doc._id),
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
