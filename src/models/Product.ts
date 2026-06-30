import mongoose, { Schema, models, model } from "mongoose";

export interface IProductParameter {
  label: string;
  value: string;
}

export interface IBatteryVariant {
  id: string;
  name: string;
  capacity: string;
  range: number;
  price: number;
  chargeTime: string;
  chargePercent: string;
  motor: string;
  parameters: IProductParameter[];
}

export interface IProduct {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  featured: boolean;
  videoUrl: string;
  imageUrl?: string;
  batteryVariants: IBatteryVariant[];
}

const ProductParameterSchema = new Schema<IProductParameter>(
  { label: { type: String, required: true }, value: { type: String, required: true } },
  { _id: false }
);

const BatteryVariantSchema = new Schema<IBatteryVariant>(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    capacity: { type: String, required: true },
    range: { type: Number, required: true },
    price: { type: Number, required: true },
    chargeTime: { type: String, required: true },
    chargePercent: { type: String, required: true },
    motor: { type: String, required: true },
    parameters: [ProductParameterSchema],
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    featured: { type: Boolean, default: false },
    videoUrl: { type: String, required: true },
    imageUrl: { type: String },
    batteryVariants: [BatteryVariantSchema],
  },
  { timestamps: true }
);

export const Product = models.Product || model<IProduct>("Product", ProductSchema);

/** @deprecated Use Product model */
export const Scooter = Product;
