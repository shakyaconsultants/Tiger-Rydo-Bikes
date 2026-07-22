import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { getInventoryHistory, getInventoryItems, getInventorySummary } from "@/lib/inventory";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getInventoryItems();
    const summary = await getInventorySummary(items);
    return NextResponse.json({ items, summary });
  } catch {
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}
