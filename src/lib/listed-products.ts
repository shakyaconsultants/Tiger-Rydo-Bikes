import { connectDB } from "@/lib/mongodb";
import { ListedProduct, type IListedProduct } from "@/models/ListedProduct";
import type { ListedProduct as ListedProductType } from "@/lib/types";

function toListedProduct(doc: IListedProduct & { _id: unknown; createdAt?: Date; updatedAt?: Date }): ListedProductType {
  return {
    _id: String(doc._id),
    name: doc.name,
    price: doc.price,
    imageUrl: doc.imageUrl,
    isActive: doc.isActive,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

export async function getListedProducts(activeOnly = false): Promise<ListedProductType[]> {
  try {
    await connectDB();
    const filter = activeOnly ? { isActive: true } : {};
    const docs = await ListedProduct.find(filter).sort({ createdAt: -1 }).lean();
    return docs.map((doc) =>
      toListedProduct(doc as unknown as IListedProduct & { _id: unknown; createdAt?: Date; updatedAt?: Date })
    );
  } catch {
    return [];
  }
}

export async function getListedProductById(id: string): Promise<ListedProductType | null> {
  try {
    await connectDB();
    const doc = await ListedProduct.findById(id).lean();
    if (!doc) return null;
    return toListedProduct(doc as unknown as IListedProduct & { _id: unknown; createdAt?: Date; updatedAt?: Date });
  } catch {
    return null;
  }
}
