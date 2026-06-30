import { connectDB } from "@/lib/mongodb";
import { Product, type IProduct } from "@/models/Product";
import { FALLBACK_PRODUCTS } from "@/lib/constants";
import { getHiddenProductSlugs } from "@/lib/siteSettings";
import type { Product as ProductType } from "@/lib/types";

export { formatPrice, getLowestPrice, isMongoObjectId } from "@/lib/product-utils";

function mapProduct(p: IProduct & { _id?: unknown }): ProductType {
  return {
    _id: p._id ? String(p._id) : undefined,
    name: p.name,
    slug: p.slug,
    tagline: p.tagline,
    description: p.description,
    featured: p.featured,
    videoUrl: p.videoUrl,
    imageUrl: p.imageUrl,
    batteryVariants: p.batteryVariants,
  };
}

function sortProducts(products: ProductType[]): ProductType[] {
  return [...products].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getProductsFromDb(): Promise<ProductType[]> {
  await connectDB();
  const dbProducts = await Product.find().sort({ featured: -1, name: 1 }).lean();
  return dbProducts.map((p) =>
    mapProduct(p as unknown as IProduct & { _id: unknown })
  );
}

/** DB products + default catalog items (DB wins on same slug). */
export function mergeWithFallbacks(
  fromDb: ProductType[],
  hiddenSlugs: Set<string>
): ProductType[] {
  const dbSlugs = new Set(fromDb.map((p) => p.slug));
  const fromFallback = FALLBACK_PRODUCTS.filter(
    (p) => !dbSlugs.has(p.slug) && !hiddenSlugs.has(p.slug)
  );
  return sortProducts([...fromDb, ...fromFallback]);
}

/** All products for public site and admin — saved + default catalog. */
export async function getProducts(): Promise<ProductType[]> {
  try {
    const [fromDb, hiddenSlugs] = await Promise.all([
      getProductsFromDb(),
      getHiddenProductSlugs(),
    ]);
    const merged = mergeWithFallbacks(fromDb, hiddenSlugs);
    if (merged.length > 0) return merged;
    return FALLBACK_PRODUCTS.filter((p) => !hiddenSlugs.has(p.slug));
  } catch {
    return FALLBACK_PRODUCTS;
  }
}

/** Homepage only — products with "Show on homepage" checked in admin. */
export async function getFeaturedProducts(): Promise<ProductType[]> {
  const products = await getProducts();
  return products.filter((p) => p.featured === true);
}

/** Full catalog — every product for /products, regardless of homepage flag. */
export async function getCatalogProducts(): Promise<ProductType[]> {
  return getProducts();
}

export async function getProductBySlug(slug: string): Promise<ProductType | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) || null;
}
