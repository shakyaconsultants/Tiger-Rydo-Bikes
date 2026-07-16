import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { requireSession } from "@/lib/api-auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await requireSession(["admin", "dealer"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { id } = await params;
    const { status } = await request.json();

    if (status !== "cancelled") {
      return NextResponse.json({ error: "Dealers can only cancel orders" }, { status: 400 });
    }

    const orderFilter =
      session.role === "admin"
        ? { _id: id }
        : { _id: id, dealerId: session.id };

    const order = await Order.findOne(orderFilter);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Only pending orders can be cancelled" },
        { status: 400 }
      );
    }

    order.status = "cancelled";
    await order.save();

    const doc = order.toObject();
    return NextResponse.json({
      success: true,
      order: { ...doc, _id: String(doc._id), createdAt: doc.createdAt?.toISOString() },
    });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
