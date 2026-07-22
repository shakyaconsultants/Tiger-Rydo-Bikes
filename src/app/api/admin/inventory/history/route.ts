import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getInventoryHistory } from "@/lib/inventory";

export async function GET(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || undefined;
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
    const history = await getInventoryHistory(productId, limit);
    return NextResponse.json({ history });
  } catch {
    return NextResponse.json({ error: "Failed to load inventory history" }, { status: 500 });
  }
}
