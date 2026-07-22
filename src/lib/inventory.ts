import { connectDB } from "@/lib/mongodb";
import { ListedProduct, type IListedProduct } from "@/models/ListedProduct";
import { InventoryTransaction } from "@/models/InventoryTransaction";
import type {
  InventoryItem,
  InventoryStockStatus,
  InventoryTransaction as InventoryTransactionType,
} from "@/lib/types";

type ListedProductDoc = IListedProduct & {
  _id: unknown;
  createdAt?: Date;
  updatedAt?: Date;
};

export function getStockStatus(
  stockQuantity: number,
  lowStockThreshold: number
): InventoryStockStatus {
  if (stockQuantity <= 0) return "out_of_stock";
  if (stockQuantity <= lowStockThreshold) return "low";
  return "in_stock";
}

function toInventoryItem(doc: ListedProductDoc): InventoryItem {
  const stockQuantity = Number(doc.stockQuantity ?? 0);
  const lowStockThreshold = Number(doc.lowStockThreshold ?? 5);

  return {
    _id: String(doc._id),
    name: doc.name,
    price: doc.price,
    imageUrl: doc.imageUrl,
    isActive: doc.isActive,
    stockQuantity,
    lowStockThreshold,
    stockStatus: getStockStatus(stockQuantity, lowStockThreshold),
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

function toTransaction(
  doc: {
    _id: unknown;
    productId: string;
    productName: string;
    type: InventoryTransactionType["type"];
    quantity: number;
    previousStock: number;
    newStock: number;
    reason: string;
    createdBy: string;
    createdByName: string;
    createdAt?: Date;
  }
): InventoryTransactionType {
  return {
    _id: String(doc._id),
    productId: doc.productId,
    productName: doc.productName,
    type: doc.type,
    quantity: doc.quantity,
    previousStock: doc.previousStock,
    newStock: doc.newStock,
    reason: doc.reason,
    createdBy: doc.createdBy,
    createdByName: doc.createdByName,
    createdAt: doc.createdAt?.toISOString(),
  };
}

async function ensureAllProductsTracked() {
  await ListedProduct.updateMany(
    { $or: [{ trackInventory: { $ne: true } }, { trackInventory: { $exists: false } }] },
    { $set: { trackInventory: true } }
  );
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    await connectDB();
    await ensureAllProductsTracked();
    const docs = await ListedProduct.find().sort({ name: 1 }).lean();
    return docs.map((doc) => toInventoryItem(doc as unknown as ListedProductDoc));
  } catch {
    return [];
  }
}

export async function getInventoryItemById(id: string): Promise<InventoryItem | null> {
  try {
    await connectDB();
    const doc = await ListedProduct.findById(id).lean();
    if (!doc) return null;
    return toInventoryItem(doc as unknown as ListedProductDoc);
  } catch {
    return null;
  }
}

export async function getInventorySummary(items: InventoryItem[]) {
  return {
    totalProducts: items.length,
    inStock: items.filter((item) => item.stockStatus === "in_stock").length,
    lowStock: items.filter((item) => item.stockStatus === "low").length,
    outOfStock: items.filter((item) => item.stockStatus === "out_of_stock").length,
  };
}

export async function getInventoryHistory(
  productId?: string,
  limit = 50
): Promise<InventoryTransactionType[]> {
  try {
    await connectDB();
    const filter = productId ? { productId } : {};
    const docs = await InventoryTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map((doc) => toTransaction(doc as unknown as Parameters<typeof toTransaction>[0]));
  } catch {
    return [];
  }
}

export async function updateInventorySettings(
  productId: string,
  settings: {
    lowStockThreshold?: number;
    stockQuantity?: number;
  }
): Promise<InventoryItem | null> {
  await connectDB();

  const update: Record<string, unknown> = { trackInventory: true };
  if (settings.lowStockThreshold !== undefined) {
    update.lowStockThreshold = Math.max(0, Number(settings.lowStockThreshold) || 0);
  }
  if (settings.stockQuantity !== undefined) {
    update.stockQuantity = Math.max(0, Number(settings.stockQuantity) || 0);
  }

  const doc = await ListedProduct.findByIdAndUpdate(productId, update, { new: true }).lean();
  if (!doc) return null;
  return toInventoryItem(doc as unknown as ListedProductDoc);
}

export async function adjustInventoryStock(params: {
  productId: string;
  type: "in" | "out" | "set";
  quantity: number;
  reason: string;
  createdBy: string;
  createdByName: string;
}): Promise<{ item: InventoryItem; transaction: InventoryTransactionType } | { error: string }> {
  await connectDB();

  const product = await ListedProduct.findById(params.productId);
  if (!product) {
    return { error: "Product not found" };
  }

  const previousStock = Number(product.stockQuantity ?? 0);
  const qty = Math.max(0, Number(params.quantity) || 0);
  let newStock = previousStock;
  let transactionType: InventoryTransactionType["type"] = params.type;

  if (params.type === "in") {
    newStock = previousStock + qty;
  } else if (params.type === "out") {
    if (qty > previousStock) {
      return { error: `Cannot remove ${qty} units. Only ${previousStock} in stock.` };
    }
    newStock = previousStock - qty;
  } else {
    newStock = qty;
    transactionType = "set";
  }

  product.stockQuantity = newStock;
  product.trackInventory = true;
  await product.save();

  const transactionDoc = await InventoryTransaction.create({
    productId: String(product._id),
    productName: product.name,
    type: transactionType,
    quantity: qty,
    previousStock,
    newStock,
    reason: params.reason.trim(),
    createdBy: params.createdBy,
    createdByName: params.createdByName,
  });

  return {
    item: toInventoryItem(product.toObject() as unknown as ListedProductDoc),
    transaction: toTransaction(transactionDoc.toObject() as Parameters<typeof toTransaction>[0]),
  };
}
