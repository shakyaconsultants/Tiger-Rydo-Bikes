import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Dealer } from "@/models/Dealer";
import { requireSession } from "@/lib/api-auth";
import { normalizeDealerInput } from "@/lib/dealer-input";
import { revalidatePublicContent } from "@/lib/revalidate-public";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    const data = normalizeDealerInput(body);
    const update: Record<string, unknown> = { ...data };
    if (update.password) {
      update.password = await bcrypt.hash(String(update.password), 10);
    } else {
      delete update.password;
    }
    const dealer = await Dealer.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .select("-password")
      .lean();
    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }
    const doc = dealer as { _id: unknown } & Record<string, unknown>;
    revalidatePublicContent();
    return NextResponse.json({ success: true, dealer: { ...doc, _id: String(doc._id) } });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("validation failed")
        ? "Please fill all required dealer fields (name, email, state, pincode, etc.)"
        : "Failed to update dealer";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Dealer.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }
    revalidatePublicContent();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete dealer" }, { status: 500 });
  }
}
