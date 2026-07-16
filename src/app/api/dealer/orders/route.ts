import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models/Order";
import { Product, type IProduct } from "@/models/Product";
import { Dealer } from "@/models/Dealer";
import { requireSession } from "@/lib/api-auth";
import { getAllOrders, getDealerOrders } from "@/lib/orders";
import { getListedProductById } from "@/lib/listed-products";

interface CartItemInput {
  listedProductId: string;
  quantity: number;
}

async function resolveDealer(session: Awaited<ReturnType<typeof requireSession>>, dealerId?: string) {
  if (!session) throw new Error("No session");

  let orderDealer = {
    dealerId: session.id,
    dealerName: session.name,
    dealerEmail: session.email,
    dealerCity: session.city,
  };

  if (session.role === "admin" && dealerId) {
    const dealer = await Dealer.findById(dealerId).select("-password").lean();
    if (!dealer) {
      return null;
    }
    orderDealer = {
      dealerId: String(dealer._id),
      dealerName: dealer.name,
      dealerEmail: dealer.email,
      dealerCity: dealer.city,
    };
  }

  return orderDealer;
}

function serializeOrder(doc: { _id: unknown; createdAt?: Date } & Record<string, unknown>) {
  return {
    ...doc,
    _id: String(doc._id),
    createdAt: doc.createdAt?.toISOString(),
  };
}

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
    const body = await request.json();
    const { productSlug, variantId, quantity, notes, dealerId, listedProductId, cartItems } = body;

    const orderDealer = await resolveDealer(session, dealerId);
    if (!orderDealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    if (Array.isArray(cartItems) && cartItems.length > 0) {
      const orders = [];
      for (const item of cartItems as CartItemInput[]) {
        const listed = await getListedProductById(item.listedProductId);
        if (!listed || !listed.isActive) {
          return NextResponse.json(
            { error: `Product not found: ${item.listedProductId}` },
            { status: 404 }
          );
        }

        const qty = Math.max(1, Number(item.quantity) || 1);
        const order = await Order.create({
          ...orderDealer,
          productSlug: `listed-${listed._id}`,
          productName: listed.name,
          variantId: "default",
          variantName: "—",
          quantity: qty,
          unitPrice: listed.price,
          totalPrice: listed.price * qty,
          notes: notes || "",
          status: "pending",
        });
        orders.push(serializeOrder(order.toObject() as Parameters<typeof serializeOrder>[0]));
      }

      return NextResponse.json({ success: true, orders });
    }

    if (listedProductId) {
      const listed = await getListedProductById(listedProductId);
      if (!listed || !listed.isActive) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      const qty = Math.max(1, Number(quantity) || 1);
      const order = await Order.create({
        ...orderDealer,
        productSlug: `listed-${listed._id}`,
        productName: listed.name,
        variantId: "default",
        variantName: "—",
        quantity: qty,
        unitPrice: listed.price,
        totalPrice: listed.price * qty,
        notes: notes || "",
        status: "pending",
      });

      return NextResponse.json({
        success: true,
        order: serializeOrder(order.toObject() as Parameters<typeof serializeOrder>[0]),
      });
    }

    const productDoc = await Product.findOne({ slug: productSlug }).lean();
    if (!productDoc) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = productDoc as unknown as IProduct;

    const variant = product.batteryVariants.find((v) => v.id === variantId);
    if (!variant) {
      return NextResponse.json({ error: "Battery variant not found" }, { status: 404 });
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

    return NextResponse.json({
      success: true,
      order: serializeOrder(order.toObject() as Parameters<typeof serializeOrder>[0]),
    });
  } catch {
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
