import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { getDealerSession } from "@/lib/auth";
import { getProducts } from "@/lib/products";
import { getAllOrders } from "@/lib/orders";
import { getSiteSettings } from "@/lib/siteSettings";
import { Dealer } from "@/models/Dealer";
import { Inquiry } from "@/models/Inquiry";
import AdminDashboardClient from "@/components/portal/AdminDashboardClient";
import type { Dealer as DealerType, Inquiry as InquiryType } from "@/lib/types";

export const metadata = {
  title: "Admin Dashboard — Tiger Rydo",
};

export default async function AdminDashboardPage() {
  const session = await getDealerSession();
  if (!session) redirect("/dealer/login");
  if (session.role !== "admin") redirect("/dealer/dashboard");

  const [settings, products, orders] = await Promise.all([
    getSiteSettings(),
    getProducts(),
    getAllOrders(),
  ]);

  let dealers: DealerType[] = [];
  let inquiries: InquiryType[] = [];

  try {
    await connectDB();

    const [dealerDocs, inquiryDocs] = await Promise.all([
      Dealer.find().select("-password").sort({ city: 1 }).lean(),
      Inquiry.find().sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    dealers = dealerDocs.map((d) => ({
      _id: String(d._id),
      name: d.name,
      email: d.email,
      phone: d.phone,
      whatsapp: d.whatsapp,
      address: d.address,
      city: d.city,
      state: d.state,
      pincode: d.pincode,
      isActive: d.isActive,
    }));

    inquiries = inquiryDocs.map((i) => ({
      _id: String(i._id),
      name: i.name,
      email: i.email,
      phone: i.phone,
      scooter: i.scooter,
      scooterName: i.scooterName,
      message: i.message,
      type: i.type,
      createdAt: i.createdAt?.toISOString(),
    }));
  } catch {
    // Empty lists if database unavailable
  }

  return (
    <AdminDashboardClient
      session={session}
      initialSettings={settings}
      initialProducts={products}
      initialDealers={dealers}
      initialOrders={orders}
      initialInquiries={inquiries}
    />
  );
}
