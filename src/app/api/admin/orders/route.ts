import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { requireSession } from "@/lib/api-auth";
import { getAllOrders } from "@/lib/orders";

export async function GET() {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await getAllOrders();
  return NextResponse.json({ orders });
}

export async function PATCH(request: Request) {
  const session = await requireSession(["admin"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { orderId, status } = await request.json();
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true }).lean();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const doc = order as { _id: unknown } & Record<string, unknown>;
    return NextResponse.json({ success: true, order: { ...doc, _id: String(doc._id) } });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
