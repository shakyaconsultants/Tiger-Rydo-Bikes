import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Dealer } from "@/models/Dealer";
import { requireSession } from "@/lib/api-auth";
import { normalizeDealerInput } from "@/lib/dealer-input";
import { revalidatePublicContent } from "@/lib/revalidate-public";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const dealers = await Dealer.find().select("-password").sort({ city: 1 }).lean();
    return NextResponse.json({
      dealers: dealers.map((d) => ({ ...d, _id: String(d._id) })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load dealers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const data = normalizeDealerInput(body);
    const passwordHash = await bcrypt.hash(data.password || "dealer123", 10);
    const dealer = await Dealer.create({ ...data, password: passwordHash });
    revalidatePublicContent();
    const { password: _, ...safe } = dealer.toObject();
    return NextResponse.json({ success: true, dealer: { ...safe, _id: String(dealer._id) } });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("validation failed")
        ? "Please fill all required dealer fields (name, email, state, pincode, etc.)"
        : error instanceof Error
          ? error.message
          : "Failed to create dealer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
