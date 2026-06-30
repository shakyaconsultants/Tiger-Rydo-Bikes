import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Inquiry } from "@/models/Inquiry";
import { requireSession } from "@/lib/api-auth";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(50).lean();
    return NextResponse.json({
      inquiries: inquiries.map((i) => ({
        ...i,
        _id: String(i._id),
        createdAt: i.createdAt?.toISOString?.() ?? undefined,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load inquiries" }, { status: 500 });
  }
}
