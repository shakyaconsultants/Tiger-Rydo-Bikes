import { connectDB } from "@/lib/mongodb";
import { Order, type IOrder } from "@/models/Order";
import type { Order as OrderType } from "@/lib/types";

function mapOrder(o: IOrder & { _id?: unknown; createdAt?: Date; updatedAt?: Date }): OrderType {
  return {
    _id: o._id ? String(o._id) : undefined,
    dealerId: o.dealerId,
    dealerName: o.dealerName,
    dealerEmail: o.dealerEmail,
    dealerCity: o.dealerCity,
    productSlug: o.productSlug,
    productName: o.productName,
    variantId: o.variantId,
    variantName: o.variantName,
    quantity: o.quantity,
    unitPrice: o.unitPrice,
    totalPrice: o.totalPrice,
    notes: o.notes,
    status: o.status,
    createdAt: o.createdAt?.toISOString(),
  };
}

export async function getAllOrders(): Promise<OrderType[]> {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    return orders.map((o) => mapOrder(o as unknown as IOrder & { _id: unknown; createdAt?: Date }));
  } catch {
    return [];
  }
}

export async function getDealerOrders(dealerId: string): Promise<OrderType[]> {
  try {
    await connectDB();
    const orders = await Order.find({ dealerId }).sort({ createdAt: -1 }).lean();
    return orders.map((o) => mapOrder(o as unknown as IOrder & { _id: unknown; createdAt?: Date }));
  } catch {
    return [];
  }
}
