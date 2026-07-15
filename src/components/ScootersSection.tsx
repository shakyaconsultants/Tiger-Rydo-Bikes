import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts, getCatalogProducts } from "@/lib/products";
import ProductCard from "./ProductCard";
import Button from "./ui/Button";

export default async function ScootersSection() {
  const [featured, allProducts] = await Promise.all([
    getFeaturedProducts(),
    getCatalogProducts(),
  ]);

  return (
    <section id="scooters" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
              OUR SCOOTERS
            </p>
            <h2 className="mt-4 font-display text-4xl font-black text-[#111111] md:text-5xl">
              BUILT FOR PERFORMANCE
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#7A7A7A]">
              Premium electric scooters with multiple battery variants. Pick your scooty,
              choose your range, explore full parameters.
            </p>
          </div>
          {allProducts.length > 0 && (
            <Link href="/products">
              <Button
                variant="outline"
                className="group hover:border-[#000000] hover:bg-[#FFF0E6] hover:text-[#FF5A00]"
              >
                View All Products
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          )}
        </div>

        {featured.length > 0 ? (
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : allProducts.length > 0 ? (
          <div className="mt-16 text-center">
            <p className="text-[#7A7A7A]">
              Browse our full range on the products page.
            </p>
            <Link href="/products" className="mt-6 inline-block">
              <Button>
                View All Products ({allProducts.length})
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <p className="mt-16 text-center text-[#7A7A7A]">
            E-bikes will appear here once added in the admin panel.
          </p>
        )}
      </div>
    </section>
  );
}
