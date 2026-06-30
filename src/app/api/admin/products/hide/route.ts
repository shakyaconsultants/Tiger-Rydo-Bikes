import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { hideProductSlug } from "@/lib/siteSettings";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await request.json();
    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }

    await hideProductSlug(slug);
    revalidatePublicContent();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to hide product" }, { status: 500 });
  }
}
