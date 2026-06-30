import { getDealers } from "@/lib/dealers";
import { NextResponse } from "next/server";

export async function GET() {
  const dealers = await getDealers();
  return NextResponse.json({ dealers });
}
