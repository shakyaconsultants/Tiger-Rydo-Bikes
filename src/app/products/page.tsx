import { getCatalogProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export const metadata = {
  title: "Products — Tiger Rydo",
  description: "Explore Tiger Rydo electric scooters with multiple battery variants.",
};

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getCatalogProducts();

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
            PRODUCT LIST
          </p>
          <h1 className="mt-4 font-display text-5xl font-black text-[#111111] md:text-6xl">
            OUR SCOOTERS
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-[#7A7A7A]">
            Choose your scooty and pick the battery variant that fits your city ride.
            Each model offers multiple battery options with detailed parameters.
          </p>
          {products.length > 0 && (
            <p className="mt-2 text-sm text-[#999]">
              {products.length} e-bike{products.length !== 1 ? "s" : ""} available
            </p>
          )}
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
