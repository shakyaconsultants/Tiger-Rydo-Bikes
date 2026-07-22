import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { updateInventorySettings } from "@/lib/inventory";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { lowStockThreshold, stockQuantity } = body;

    const update: {
      lowStockThreshold?: number;
      stockQuantity?: number;
    } = {};

    if (lowStockThreshold !== undefined) {
      update.lowStockThreshold = Math.max(0, Number(lowStockThreshold) || 0);
    }
    if (stockQuantity !== undefined) {
      update.stockQuantity = Math.max(0, Number(stockQuantity) || 0);
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const item = await updateInventorySettings(id, update);
    if (!item) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ error: "Failed to update inventory settings" }, { status: 500 });
  }
}
