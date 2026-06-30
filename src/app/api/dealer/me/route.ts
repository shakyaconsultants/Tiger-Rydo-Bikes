import { NextResponse } from "next/server";
import { getDealerSession } from "@/lib/auth";

export async function GET() {
  const dealer = await getDealerSession();
  if (!dealer) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ dealer });
}
