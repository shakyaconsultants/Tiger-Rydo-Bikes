import { redirect } from "next/navigation";
import { getDealerSession } from "@/lib/auth";
import { getProducts } from "@/lib/products";
import { getListedProducts } from "@/lib/listed-products";
import { getDealerOrders } from "@/lib/orders";
import DealerDashboardClient from "@/components/portal/DealerDashboardClient";

export const metadata = {
  title: "Dealer Dashboard — Tiger Rydo",
};

export default async function DealerDashboardPage() {
  const session = await getDealerSession();
  if (!session) redirect("/dealer/login");

  const [products, listedProducts, orders] = await Promise.all([
    getProducts(),
    getListedProducts(true),
    getDealerOrders(session.id),
  ]);

  return (
    <DealerDashboardClient
      session={session}
      products={products}
      listedProducts={listedProducts}
      initialOrders={orders}
    />
  );
}
