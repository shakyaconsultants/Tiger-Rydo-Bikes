import mongoose, { Schema, models, model } from "mongoose";

export type InventoryTransactionType = "in" | "out" | "adjustment" | "set";

export interface IInventoryTransaction {
  productId: string;
  productName: string;
  type: InventoryTransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  createdBy: string;
  createdByName: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const InventoryTransactionSchema = new Schema<IInventoryTransaction>(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    type: { type: String, required: true, enum: ["in", "out", "adjustment", "set"] },
    quantity: { type: Number, required: true, min: 0 },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    reason: { type: String, default: "" },
    createdBy: { type: String, required: true },
    createdByName: { type: String, required: true },
  },
  { timestamps: true }
);

export const InventoryTransaction =
  models.InventoryTransaction ||
  model<IInventoryTransaction>("InventoryTransaction", InventoryTransactionSchema);
