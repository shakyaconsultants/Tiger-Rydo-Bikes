import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";
import { requireSession } from "@/lib/api-auth";
import { DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/siteSettings";
import { COLORS } from "@/lib/constants";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const existing = await SiteSettings.findOne({ key: "main" }).lean();

    const hiddenProductSlugs =
      (existing?.hiddenProductSlugs as string[]) ?? [];

    const settings = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      {
        key: "main",
        ...DEFAULT_SITE_SETTINGS,
        ...body,
        accentColor: COLORS.electricOrange,
        hiddenProductSlugs,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    revalidatePublicContent();
    return NextResponse.json({ success: true, settings });
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
