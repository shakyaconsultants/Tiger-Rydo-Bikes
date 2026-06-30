import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Dealer } from "@/models/Dealer";
import { SiteSettings } from "@/models/SiteSettings";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Timestamp used by public pages to detect admin changes and auto-refresh. */
export async function GET() {
  try {
    await connectDB();
    const [product, dealer, settings] = await Promise.all([
      Product.findOne().sort({ updatedAt: -1 }).select("updatedAt").lean(),
      Dealer.findOne().sort({ updatedAt: -1 }).select("updatedAt").lean(),
      SiteSettings.findOne({ key: "main" }).select("updatedAt").lean(),
    ]);

    const times = [
      product?.updatedAt,
      dealer?.updatedAt,
      settings?.updatedAt,
    ]
      .filter(Boolean)
      .map((d) => new Date(d as Date).getTime());

    const version = times.length ? Math.max(...times) : Date.now();

    return NextResponse.json(
      { version },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { version: Date.now() },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
