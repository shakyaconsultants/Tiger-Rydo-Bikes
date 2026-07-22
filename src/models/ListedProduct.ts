import mongoose, { Schema, models, model } from "mongoose";

export interface IListedProduct {
  name: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
}

const ListedProductSchema = new Schema<IListedProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    trackInventory: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
  },
  { timestamps: true }
);

export const ListedProduct =
  models.ListedProduct || model<IListedProduct>("ListedProduct", ListedProductSchema);
