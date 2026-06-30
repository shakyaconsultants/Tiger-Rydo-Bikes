import mongoose, { Schema, models, model } from "mongoose";

export type OrderStatus = "pending" | "confirmed" | "shipped" | "cancelled";

export interface IOrder {
  dealerId: string;
  dealerName: string;
  dealerEmail: string;
  dealerCity: string;
  productSlug: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  status: OrderStatus;
}

const OrderSchema = new Schema<IOrder>(
  {
    dealerId: { type: String, required: true },
    dealerName: { type: String, required: true },
    dealerEmail: { type: String, required: true },
    dealerCity: { type: String, required: true },
    productSlug: { type: String, required: true },
    productName: { type: String, required: true },
    variantId: { type: String, required: true },
    variantName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Order = models.Order || model<IOrder>("Order", OrderSchema);
