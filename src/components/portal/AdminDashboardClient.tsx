"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DealerLogoutButton from "@/components/DealerLogoutButton";
import Button from "@/components/ui/Button";
import { notifyContentUpdated } from "@/lib/content-sync";
import PlaceOrderPanel from "./PlaceOrderPanel";
import OrdersPanel from "./OrdersPanel";
import type {
  Dealer,
  DealerSession,
  Inquiry,
  Order,
  Product,
  SiteSettings,
} from "@/lib/types";
import { formatPrice, isMongoObjectId } from "@/lib/product-utils";
import ImageUploadField from "./ImageUploadField";
import {
  PortalShell,
  SimpleTabs,
  Panel,
  Field,
  Flash,
  Empty,
  ActionBar,
  StatCard,
  inputClass,
  requiredError,
  BRAND_ORANGE,
} from "./shared";

type Tab = "website" | "products" | "dealers" | "place-order" | "orders" | "messages";

interface Props {
  session: DealerSession;
  initialSettings: SiteSettings;
  initialProducts: Product[];
  initialDealers: Dealer[];
  initialOrders: Order[];
  initialInquiries: Inquiry[];
}

function newProduct(): Product {
  return {
    name: "",
    slug: `ebike-${Date.now()}`,
    tagline: "",
    description: "",
    featured: false,
    videoUrl: "",
    imageUrl: "",
    batteryVariants: [{
      id: "v1", name: "1.8 kWh", capacity: "1.8 kWh", range: 65, price: 74999,
      chargeTime: "5 hrs", chargePercent: "0-80%", motor: "2.5 kW", parameters: [],
    }],
  };
}

function newDealer(): Dealer {
  return {
    name: "",
    email: `dealer${Date.now()}@tigerrydo.com`,
    phone: "+91",
    whatsapp: "91",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isActive: true,
  };
}

export default function AdminDashboardClient({
  session,
  initialSettings,
  initialProducts,
  initialDealers,
  initialOrders,
  initialInquiries,
}: Props) {
  const [inquiries, setInquiries] = useState(initialInquiries);
  const [tab, setTab] = useState<Tab>("website");
  const [settings, setSettings] = useState(initialSettings);
  const [products, setProducts] = useState(initialProducts.length ? initialProducts : [newProduct()]);
  const [dealers, setDealers] = useState(initialDealers.length ? initialDealers : [newDealer()]);
  const [orders, setOrders] = useState(initialOrders);
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [selectedDealer, setSelectedDealer] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [websiteErrors, setWebsiteErrors] = useState<Record<string, string | undefined>>({});
  const [productErrors, setProductErrors] = useState<Record<string, string | undefined>>({});
  const [dealerErrors, setDealerErrors] = useState<Record<string, string | undefined>>({});
  const [orderLoading, setOrderLoading] = useState(false);

  const product = products[selectedProduct];
  const dealer = dealers[selectedDealer];
  const savedDealers = dealers.filter((d) => d._id);
  const router = useRouter();

  const orderStats = useMemo(() => {
    const active = orders.filter((o) => o.status !== "cancelled");
    const pending = orders.filter((o) => o.status === "pending");
    return {
      total: orders.length,
      pending: pending.length,
      totalValue: active.reduce((sum, o) => sum + o.totalPrice, 0),
    };
  }, [orders]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  useEffect(() => {
    setProducts(initialProducts.length ? initialProducts : [newProduct()]);
  }, [initialProducts]);

  useEffect(() => {
    setDealers(initialDealers.length ? initialDealers : [newDealer()]);
  }, [initialDealers]);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setInquiries(initialInquiries);
  }, [initialInquiries]);

  function afterContentChange() {
    notifyContentUpdated();
    router.refresh();
  }

  async function deleteInquiry(id: string) {
    if (!confirm("Delete this inquiry?")) return;

    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      setMessage("Failed to delete inquiry");
      return;
    }

    setMessage("Inquiry deleted");
    router.refresh();
  }

  async function saveSettings() {
    const errors: Record<string, string> = {};
    const brandErr = requiredError(settings.brandName, "Brand name");
    const tagErr = requiredError(settings.tagline, "Tagline");
    const heroErr = requiredError(settings.heroHighlight, "FUTURE highlight word");
    if (brandErr) errors.brandName = brandErr;
    if (tagErr) errors.tagline = tagErr;
    if (heroErr) errors.heroHighlight = heroErr;
    setWebsiteErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, accentColor: BRAND_ORANGE }),
    });
    setLoading(false);
    if (res.ok) {
      afterContentChange();
      setMessage("Website saved!");
    } else {
      setMessage("Save failed");
    }
  }

  async function saveProduct() {
    if (!product) return;
    const errors: Record<string, string> = {};
    const nameErr = requiredError(product.name, "Name");
    const tagErr = requiredError(product.tagline, "Tagline");
    if (nameErr) errors.name = nameErr;
    if (tagErr) errors.tagline = tagErr;
    setProductErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const isDbProduct = isMongoObjectId(product._id);
    const payload = {
      ...product,
      featured: Boolean(product.featured),
      videoUrl: product.videoUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ",
      description: product.description || product.tagline || product.name,
    };
    const { _id, ...createPayload } = payload;
    const updatePayload = { ...payload };
    delete (updatePayload as { _id?: string })._id;
    const res = await fetch(
      isDbProduct ? `/api/admin/products/${product._id}` : "/api/admin/products",
      {
        method: isDbProduct ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isDbProduct ? updatePayload : createPayload),
      }
    );
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Save failed");
      return;
    }
    setProducts((p) => p.map((x, i) => (i === selectedProduct ? data.product : x)));
    setMessage(isDbProduct ? "Product updated!" : "Product saved to website!");
    afterContentChange();
  }

  async function deleteProduct() {
    if (!product) return;
    if (!product._id) {
      setProducts((p) => p.filter((_, i) => i !== selectedProduct));
      setSelectedProduct(0);
      setMessage("Removed unsaved product");
      return;
    }
    if (!confirm(`Delete "${product.name}" from the website?`)) return;

    if (isMongoObjectId(product._id)) {
      const res = await fetch(`/api/admin/products/${product._id}`, { method: "DELETE" });
      if (!res.ok) {
        setMessage("Delete failed");
        return;
      }
    } else {
      const res = await fetch("/api/admin/products/hide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: product.slug }),
      });
      if (!res.ok) {
        setMessage("Delete failed");
        return;
      }
    }

    const next = products.filter((_, i) => i !== selectedProduct);
    setProducts(next.length ? next : [newProduct()]);
    setSelectedProduct(0);
    setMessage("Product removed from website");
    afterContentChange();
  }

  async function saveDealer() {
    if (!dealer) return;
    const errors: Record<string, string> = {};
    if (requiredError(dealer.name, "Name")) errors.name = requiredError(dealer.name, "Name")!;
    if (requiredError(dealer.email, "Email")) errors.email = requiredError(dealer.email, "Email")!;
    if (requiredError(dealer.phone, "Phone")) errors.phone = requiredError(dealer.phone, "Phone")!;
    if (requiredError(dealer.city, "City")) errors.city = requiredError(dealer.city, "City")!;
    if (requiredError(dealer.state, "State")) errors.state = requiredError(dealer.state, "State")!;
    if (requiredError(dealer.pincode, "Pincode")) errors.pincode = requiredError(dealer.pincode, "Pincode")!;
    if (requiredError(dealer.address, "Address")) errors.address = requiredError(dealer.address, "Address")!;
    setDealerErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const isNew = !dealer._id;
    const res = await fetch(isNew ? "/api/admin/dealers" : `/api/admin/dealers/${dealer._id}`, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dealer),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error || "Save failed");
      return;
    }
    setDealers((d) => d.map((x, i) => (i === selectedDealer ? data.dealer : x)));
    setMessage(isNew ? "Dealer added!" : "Dealer updated!");
    afterContentChange();
  }

  async function deleteDealer() {
    if (!dealer) return;
    if (!dealer._id) {
      setDealers((d) => d.filter((_, i) => i !== selectedDealer));
      setSelectedDealer(0);
      setMessage("Removed unsaved dealer");
      return;
    }
    if (!confirm(`Delete "${dealer.name}"?`)) return;

    const res = await fetch(`/api/admin/dealers/${dealer._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error || "Delete failed");
      return;
    }

    const next = dealers.filter((_, i) => i !== selectedDealer);
    setDealers(next.length ? next : [newDealer()]);
    setSelectedDealer(0);
    setMessage("Dealer deleted from website");
    afterContentChange();
  }

  async function updateOrderStatus(orderId: string, status: Order["status"]) {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    setOrders((o) => o.map((x) => (x._id === orderId ? { ...x, status } : x)));
    setMessage("Order updated");
    afterContentChange();
  }

  async function placeOrder(data: {
    productSlug: string;
    variantId: string;
    quantity: number;
    notes: string;
    dealerId?: string;
  }) {
    setOrderLoading(true);
    const res = await fetch("/api/dealer/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    setOrderLoading(false);
    if (!res.ok) {
      setMessage(result.error || "Order failed");
      return;
    }
    setOrders((prev) => [result.order, ...prev]);
    setMessage("Order placed!");
    setTab("orders");
    afterContentChange();
  }

  function updateProduct(patch: Partial<Product>) {
    setProducts((prev) =>
      prev.map((p, i) => (i === selectedProduct ? { ...p, ...patch } : p))
    );
  }

  function updateVariant(field: string, value: string | number) {
    if (!product?.batteryVariants[0]) return;
    const v = { ...product.batteryVariants[0], [field]: value };
    if (field === "name") v.capacity = String(value);
    updateProduct({ batteryVariants: [v, ...product.batteryVariants.slice(1)] });
  }

  function updateDealer(patch: Partial<Dealer>) {
    setDealers((prev) =>
      prev.map((d, i) => (i === selectedDealer ? { ...d, ...patch } : d))
    );
  }

  function addProduct() {
    setProducts((p) => [...p, newProduct()]);
    setSelectedProduct(products.length);
    setProductErrors({});
    setMessage("New product — fill details and click Save");
  }

  function addDealer() {
    setDealers((d) => [...d, newDealer()]);
    setSelectedDealer(dealers.length);
    setDealerErrors({});
    setMessage("New dealer — fill details and click Save");
  }

  return (
    <PortalShell title="Admin Dashboard" subtitle={session.email} badge="Admin & Dealer Portal">
      <div className="mb-4 flex justify-end">
        <DealerLogoutButton />
      </div>

      <Flash message={message} />

      <SimpleTabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "website", label: "Website" },
          { id: "products", label: "E-Bikes" },
          { id: "dealers", label: "Dealers" },
          { id: "place-order", label: "Place Order" },
          { id: "orders", label: "All Orders", count: orders.length },
          { id: "messages", label: "Messages" },
        ]}
      />

      {tab === "website" && (
        <Panel title="Website Content" description="Edit brand text and hero section copy.">
          <ActionBar>
            <Button size="sm" onClick={saveSettings} disabled={loading}>
              Save Website
            </Button>
          </ActionBar>

          <Field label="Brand name" required value={settings.brandName} error={websiteErrors.brandName}
            onChange={(v) => { setSettings({ ...settings, brandName: v }); setWebsiteErrors({}); }} />
          <Field label="Tagline" required value={settings.tagline} error={websiteErrors.tagline}
            onChange={(v) => { setSettings({ ...settings, tagline: v }); setWebsiteErrors({}); }} />
          <Field label="Sub tagline" value={settings.subTagline}
            onChange={(v) => setSettings({ ...settings, subTagline: v })} />
          <Field label="Hero title (e.g. RIDE THE)" value={settings.heroTitle}
            onChange={(v) => setSettings({ ...settings, heroTitle: v })} />
          <Field label="Hero highlight word (e.g. FUTURE)" required value={settings.heroHighlight} error={websiteErrors.heroHighlight}
            onChange={(v) => { setSettings({ ...settings, heroHighlight: v }); setWebsiteErrors((e) => ({ ...e, heroHighlight: undefined })); }} />
          <ImageUploadField
            label="Logo image"
            value={settings.logoUrl}
            folder="tiger-rydo/logos"
            hint="Upload your brand logo. The Cloudinary URL is saved when you click Save Website."
            onChange={(v) => setSettings({ ...settings, logoUrl: v })}
          />
        </Panel>
      )}

      {tab === "products" && (
        <Panel title="E-Bike Catalog" description="Manage products shown on the public website.">
          <ActionBar>
            <select
              className={inputClass + " max-w-[200px]"}
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(Number(e.target.value)); setProductErrors({}); }}
            >
              {products.map((p, i) => (
                <option key={p.slug + i} value={i}>
                  {p.name || `Product ${i + 1}`}
                  {!isMongoObjectId(p._id) && p._id ? " (default)" : ""}
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
              onClick={addProduct}
            >
              Add
            </Button>
            <Button size="sm" onClick={saveProduct} disabled={loading}>
              {isMongoObjectId(product?._id) ? "Save" : "Save to Website"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
              onClick={deleteProduct}
            >
              Delete
            </Button>
          </ActionBar>

          {product && (
            <>
              <Field label="Name" required value={product.name} error={productErrors.name}
                onChange={(v) => { updateProduct({ name: v }); setProductErrors((e) => ({ ...e, name: undefined })); }} />
              <ImageUploadField
                label="Product image"
                value={product.imageUrl || ""}
                folder="tiger-rydo/products"
                hint="Upload a product photo. The Cloudinary URL is saved when you click Save."
                onChange={(v) => updateProduct({ imageUrl: v })}
              />
              <Field label="Tagline" required value={product.tagline} error={productErrors.tagline}
                onChange={(v) => { updateProduct({ tagline: v }); setProductErrors((e) => ({ ...e, tagline: undefined })); }} />
              <Field label="Description" value={product.description} rows={2}
                onChange={(v) => updateProduct({ description: v })} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Battery" value={product.batteryVariants[0]?.name || ""}
                  onChange={(v) => updateVariant("name", v)} />
                <Field label="Price (₹)" value={String(product.batteryVariants[0]?.price || "")}
                  onChange={(v) => updateVariant("price", Number(v))} />
                <Field label="Range (km)" value={String(product.batteryVariants[0]?.range || "")}
                  onChange={(v) => updateVariant("range", Number(v))} />
              </div>
              <label className="mb-4 flex items-start gap-3 rounded-lg border border-[#FF5A00]/20 bg-[#FF5A00]/5 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={product.featured}
                  onChange={(e) => updateProduct({ featured: e.target.checked })}
                />
                <span>
                  <span className="font-semibold text-[#111]">Show on homepage</span>
                  <span className="mt-0.5 block text-xs text-[#888]">
                    Checked = shown on homepage. Unchecked = only on View All Products page.
                  </span>
                </span>
              </label>
            </>
          )}
        </Panel>
      )}

      {tab === "dealers" && (
        <Panel title="Dealer Network" description="Add and manage authorized dealers on the public site.">
          <ActionBar>
            <select
              className={inputClass + " max-w-[200px]"}
              value={selectedDealer}
              onChange={(e) => { setSelectedDealer(Number(e.target.value)); setDealerErrors({}); }}
            >
              {dealers.map((d, i) => (
                <option key={d.email + i} value={i}>{d.name || `Dealer ${i + 1}`}</option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              className="hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
              onClick={addDealer}
            >
              Add
            </Button>
            <Button size="sm" onClick={saveDealer} disabled={loading}>
              {dealer?._id ? "Save" : "Save New"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
              onClick={deleteDealer}
            >
              Delete
            </Button>
          </ActionBar>

          {dealer && (
            <>
              <Field label="Name" required value={dealer.name} error={dealerErrors.name}
                onChange={(v) => { updateDealer({ name: v }); setDealerErrors((e) => ({ ...e, name: undefined })); }} />
              <Field label="Email" required value={dealer.email} error={dealerErrors.email}
                onChange={(v) => { updateDealer({ email: v }); setDealerErrors((e) => ({ ...e, email: undefined })); }} />
              <Field label="Phone" required value={dealer.phone} error={dealerErrors.phone}
                onChange={(v) => { updateDealer({ phone: v }); setDealerErrors((e) => ({ ...e, phone: undefined })); }} />
              <Field label="WhatsApp number" value={dealer.whatsapp}
                onChange={(v) => updateDealer({ whatsapp: v })} />
              <Field label="City" required value={dealer.city} error={dealerErrors.city}
                onChange={(v) => { updateDealer({ city: v }); setDealerErrors((e) => ({ ...e, city: undefined })); }} />
              <Field label="State" required value={dealer.state} error={dealerErrors.state}
                onChange={(v) => { updateDealer({ state: v }); setDealerErrors((e) => ({ ...e, state: undefined })); }} />
              <Field label="Pincode" required value={dealer.pincode} error={dealerErrors.pincode}
                onChange={(v) => { updateDealer({ pincode: v }); setDealerErrors((e) => ({ ...e, pincode: undefined })); }} />
              <Field label="Address" required value={dealer.address} error={dealerErrors.address}
                onChange={(v) => { updateDealer({ address: v }); setDealerErrors((e) => ({ ...e, address: undefined })); }} />
            </>
          )}
        </Panel>
      )}

      {tab === "place-order" && (
        <PlaceOrderPanel
          products={products}
          dealers={savedDealers.length ? savedDealers : undefined}
          loading={orderLoading}
          onSubmit={placeOrder}
        />
      )}

      {tab === "orders" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total Orders" value={orderStats.total} hint="All dealers" accent="blue" />
            <StatCard label="Pending" value={orderStats.pending} hint="Awaiting action" accent="orange" />
            <StatCard
              label="Order Value"
              value={formatPrice(orderStats.totalValue)}
              hint="Excludes cancelled"
              accent="green"
            />
          </div>
          <OrdersPanel
            orders={orders}
            mode="admin"
            title="All Dealer Orders"
            description="View every order and update status."
            onStatusChange={updateOrderStatus}
          />
        </div>
      )}

      {tab === "messages" && (
        <Panel title="Customer Messages" description="Contact form and inquiry submissions.">
          {inquiries.length === 0 ? (
            <Empty text="No messages yet." />
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div
                  key={inq._id}
                  className="rounded-lg border border-[#1f1f1f] bg-[#0f0f0f] p-4"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-medium text-white">{inq.name}</p>

                      <div className="mt-1 space-y-1 text-xs text-[#9a9a9a]">
                        <p>Email: {inq.email}</p>
                        {inq.phone && <p>Phone: {inq.phone}</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteInquiry(inq._id!)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Scooter */}
                  {inq.type !== "newsletter" && (
                    <p className="text-xs text-[#FF5A00] mt-3">
                      Model:{" "}
                      {inq.scooterName?.trim()
                        ? inq.scooterName
                        : products.find((p) => p.slug === inq.scooter)?.name ||
                        inq.scooter}
                    </p>
                  )}

                  {/* Message */}
                  <p className="mt-2 text-sm text-[#cfcfcf] leading-relaxed">
                    {inq.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </PortalShell>
  );
}