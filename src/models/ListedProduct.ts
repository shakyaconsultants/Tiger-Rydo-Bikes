import mongoose, { Schema, models, model } from "mongoose";

export interface IListedProduct {
  name: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
}

const ListedProductSchema = new Schema<IListedProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ListedProduct =
  models.ListedProduct || model<IListedProduct>("ListedProduct", ListedProductSchema);
