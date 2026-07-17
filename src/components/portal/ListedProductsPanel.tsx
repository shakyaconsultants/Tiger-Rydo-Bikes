"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Download } from "lucide-react";
import Button from "@/components/ui/Button";
import type { ListedProduct } from "@/lib/types";
import { formatPrice } from "@/lib/product-utils";
import { downloadListedProductsPdf } from "@/lib/listed-products-pdf";
import ImageUploadField from "./ImageUploadField";
import {
  ActionBar,
  Empty,
  Field,
  Panel,
  inputClass,
  requiredError,
} from "./shared";

function newListedProduct(): ListedProduct {
  return {
    name: "",
    price: 0,
    imageUrl: "",
    isActive: true,
  };
}

interface Props {
  initialProducts: ListedProduct[];
  onMessage: (text: string) => void;
  message: string;

}

export default function ListedProductsPanel({ initialProducts, onMessage, message }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(
    initialProducts.length ? initialProducts : [newListedProduct()]
  );
  const [selected, setSelected] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);


  const product = products[selected];
  const savedProducts = products.filter((p) => p._id);

  useEffect(() => {
    setProducts(initialProducts.length ? initialProducts : [newListedProduct()]);
  }, [initialProducts]);

  async function refreshProducts(keepSelectedId?: string) {
    const res = await fetch("/api/admin/listed-products");
    const data = await res.json();
    if (res.ok && Array.isArray(data.products)) {
      const next = data.products as ListedProduct[];
      setProducts(next.length ? next : [newListedProduct()]);
      if (keepSelectedId) {
        const idx = next.findIndex((p) => p._id === keepSelectedId);
        setSelected(idx >= 0 ? idx : 0);
      }
    }
    router.refresh();
  }

  function updateProduct(patch: Partial<ListedProduct>) {
    setProducts((prev) =>
      prev.map((p, i) => (i === selected ? { ...p, ...patch } : p))
    );
  }

  async function saveProduct() {
    if (!product) return;

    const nextErrors: Record<string, string> = {};
    const nameErr = requiredError(product.name, "Name");
    const imageErr = requiredError(product.imageUrl, "Image");
    if (nameErr) nextErrors.name = nameErr;
    if (imageErr) nextErrors.imageUrl = imageErr;
    if (product.price < 0 || Number.isNaN(product.price)) {
      nextErrors.price = "Valid price is required";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    const isNew = !product._id;
    const res = await fetch(
      isNew ? "/api/admin/listed-products" : `/api/admin/listed-products/${product._id}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      }
    );
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      onMessage(data.error || "Save failed");
      return;
    }

    setProducts((prev) =>
      prev.map((p, i) => (i === selected ? data.product : p))
    );
    onMessage(isNew ? "Product added!" : "Product updated!");
    await refreshProducts(data.product._id);
  }

  async function deleteProduct() {
    if (!product) return;

    if (!product._id) {
      const next = products.filter((_, i) => i !== selected);
      setProducts(next.length ? next : [newListedProduct()]);
      setSelected(0);
      onMessage("Removed unsaved product");
      return;
    }

    if (!confirm(`Delete "${product.name}"?`)) return;

    const res = await fetch(`/api/admin/listed-products/${product._id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      onMessage("Delete failed");
      return;
    }

    const next = products.filter((_, i) => i !== selected);
    setProducts(next.length ? next : [newListedProduct()]);
    setSelected(0);
    onMessage("Product deleted");
    await refreshProducts();
  }

  async function handleDownloadPdf() {
    setPdfLoading(true);
    try {
      await downloadListedProductsPdf(savedProducts);
      onMessage("PDF downloaded");
    } catch {
      onMessage("PDF download failed");
    } finally {
      setPdfLoading(false);
    }
  }

  function addProduct() {
    setProducts((prev) => {
      setSelected(prev.length);
      return [...prev, newListedProduct()];
    });
    setErrors({});
    onMessage("New product — fill details and click Save");
  }

  return (
    <Panel
      title="Dealer Products"
      description="Products visible only to admin and dealers — not shown on the public website. Use the dropdown to switch products, then click Delete to remove one."
    >
      <ActionBar>
        <select
          className={inputClass + " max-w-[220px]"}
          value={selected}
          onChange={(e) => {
            setSelected(Number(e.target.value));
            setErrors({});
          }}
        >
          {products.map((p, i) => (
            <option key={p._id || `new-${i}`} value={i}>
              {p.name || `Product ${i + 1}`}
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
          {product?._id ? "Save" : "Save Product"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
          onClick={deleteProduct}
        >
          Delete
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="hover:border-[#FF5A00] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
          onClick={handleDownloadPdf}
          disabled={pdfLoading || savedProducts.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          {pdfLoading ? "Generating..." : "Download PDF"}
        </Button>
      </ActionBar>

      {message && (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
          {message}
        </div>
      )}

      {product ? (
        <>
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <Field
                label="Name"
                required
                value={product.name}
                error={errors.name}
                onChange={(v) => {
                  updateProduct({ name: v });
                  setErrors((e) => ({ ...e, name: undefined }));
                }}
              />
            </div>

            <div>
              <Field
                label="Price (₹)"
                required
                type="number"
                step="0.01"
                value={String(product.price || "")}
                error={errors.price}
                onChange={(v) => {
                  updateProduct({
                    price: v === "" ? 0 : parseFloat(v),
                  });
                  setErrors((e) => ({ ...e, price: undefined }));
                }}
              />
            </div>
          </div>
          <ImageUploadField
            label="Product image"
            value={product.imageUrl}
            folder="tiger-rydo/listed-products"
            hint="Upload a product photo. Only name, price, and image are shown to dealers."
            onChange={(v) => {
              updateProduct({ imageUrl: v });
              setErrors((e) => ({ ...e, imageUrl: undefined }));
            }}
          />
          {errors.imageUrl && (
            <p className="-mt-3 mb-4 text-xs text-red-500">{errors.imageUrl}</p>
          )}
          <label className="mb-4 flex items-start gap-3 rounded-lg border border-[#E6E6E6] bg-white p-3 text-sm">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={product.isActive}
              onChange={(e) => updateProduct({ isActive: e.target.checked })}
            />
            <span>
              <span className="font-semibold text-[#111]">Active</span>
              <span className="mt-0.5 block text-xs text-[#888]">
                Inactive products are hidden from dealers.
              </span>
            </span>
          </label>
        </>
      ) : (
        <Empty text="Add a dealer product to get started." />
      )}

      {savedProducts.length > 0 && (
        <div className="mb-6 border-b border-[#E6E6E6] pb-6">
          <div className="mb-4">
            <p className="text-sm font-bold text-[#111]">Saved Products</p>
            <p className="text-xs text-[#888]">
              {savedProducts.length} product{savedProducts.length !== 1 ? "s" : ""} · click a card to edit
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {savedProducts.map((p) => {
              const index = products.findIndex((item) => item._id === p._id);
              const isSelected = index === selected;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    if (index >= 0) setSelected(index);
                  }}
                  className={`group overflow-hidden rounded-xl border bg-white text-left shadow-sm transition-all hover:shadow-md ${isSelected
                    ? "border-[#FF5A00] ring-2 ring-[#FF5A00]/25"
                    : "border-[#E6E6E6] hover:border-[#FF5A00]/50"
                    }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F4F5]">
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full min-h-[100px] items-center justify-center text-xs text-[#999]">
                        No image
                      </div>
                    )}

                  </div>
                  <div className="border-t border-[#F0F0F0] p-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#111]">
                      {p.name}
                    </p>
                    <p className="mt-1.5 text-sm font-bold text-[#FF5A00]">{formatPrice(p.price)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}


    </Panel>
  );
}
