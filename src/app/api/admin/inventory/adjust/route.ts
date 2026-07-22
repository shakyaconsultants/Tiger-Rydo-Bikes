import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { adjustInventoryStock } from "@/lib/inventory";

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { productId, type, quantity, reason } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    if (!["in", "out", "set"].includes(type)) {
      return NextResponse.json({ error: "Invalid adjustment type" }, { status: 400 });
    }
    if (quantity === undefined || Number(quantity) < 0 || Number.isNaN(Number(quantity))) {
      return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 });
    }

    const result = await adjustInventoryStock({
      productId: String(productId),
      type,
      quantity: Number(quantity),
      reason: String(reason ?? ""),
      createdBy: session.id,
      createdByName: session.name,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      item: result.item,
      transaction: result.transaction,
    });
  } catch {
    return NextResponse.json({ error: "Failed to adjust inventory" }, { status: 500 });
  }
}
