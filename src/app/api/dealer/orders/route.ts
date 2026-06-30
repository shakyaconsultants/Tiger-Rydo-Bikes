import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product, type IProduct } from "@/models/Product";
import { Dealer } from "@/models/Dealer";
import { requireSession } from "@/lib/api-auth";
import { getAllOrders, getDealerOrders } from "@/lib/orders";

export async function GET() {
  const session = await requireSession(["admin", "dealer"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders =
    session.role === "admin"
      ? await getAllOrders()
      : await getDealerOrders(session.id);

  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  const session = await requireSession(["admin", "dealer"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const { productSlug, variantId, quantity, notes, dealerId } = await request.json();

    const productDoc = await Product.findOne({ slug: productSlug }).lean();
    if (!productDoc) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productDoc as unknown as IProduct;

    const variant = product.batteryVariants.find((v) => v.id === variantId);
    if (!variant) {
      return NextResponse.json({ error: "Battery variant not found" }, { status: 404 });
    }

    let orderDealer = {
      dealerId: session.id,
      dealerName: session.name,
      dealerEmail: session.email,
      dealerCity: session.city,
    };

    if (session.role === "admin" && dealerId) {
      const dealer = await Dealer.findById(dealerId).select("-password").lean();
      if (!dealer) {
        return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
      }
      orderDealer = {
        dealerId: String(dealer._id),
        dealerName: dealer.name,
        dealerEmail: dealer.email,
        dealerCity: dealer.city,
      };
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const order = await Order.create({
      ...orderDealer,
      productSlug: product.slug,
      productName: product.name,
      variantId: variant.id,
      variantName: variant.name,
      quantity: qty,
      unitPrice: variant.price,
      totalPrice: variant.price * qty,
      notes: notes || "",
      status: "pending",
    });

    const doc = order.toObject();
    return NextResponse.json({
      success: true,
      order: {
        ...doc,
        _id: String(doc._id),
        createdAt: doc.createdAt?.toISOString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
