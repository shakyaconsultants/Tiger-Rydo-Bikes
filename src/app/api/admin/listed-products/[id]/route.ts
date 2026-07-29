import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { ListedProduct } from "@/models/ListedProduct";
import { requireSession } from "@/lib/api-auth";
import { normalizeBrochure } from "@/lib/brochure";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const { name, price, imageUrl, isActive, brochure } = body;

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = String(name).trim();
    if (price !== undefined) update.price = Number(price);
    if (imageUrl !== undefined) update.imageUrl = String(imageUrl).trim();
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (brochure !== undefined) update.brochure = normalizeBrochure(brochure);

    const product = await ListedProduct.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const doc = product as {
      _id: unknown;
      createdAt?: Date;
      updatedAt?: Date;
      brochure?: unknown;
    } & Record<string, unknown>;

    return NextResponse.json({
      success: true,
      product: {
        ...doc,
        _id: String(doc._id),
        brochure: normalizeBrochure(doc.brochure as Parameters<typeof normalizeBrochure>[0]),
        createdAt: doc.createdAt?.toISOString(),
        updatedAt: doc.updatedAt?.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const result = await ListedProduct.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
