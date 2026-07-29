import mongoose, { Schema, models, model, Model } from "mongoose";
import type { ProductBrochure } from "@/lib/types";

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
  brochure?: ProductBrochure;
  createdAt?: Date;
  updatedAt?: Date;
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

const BrochureKeyFeaturesSchema = new Schema(
  {
    antiTheftAlarm: { type: Boolean, default: true },
    centralLocking: { type: Boolean, default: true },
    parkingSwitch: { type: Boolean, default: true },
    reverseGear: { type: Boolean, default: true },
    usbCharger: { type: Boolean, default: true },
  },
  { _id: false }
);

const BrochureSchema = new Schema(
  {
    enabled: { type: Boolean, default: false },
    coverTagline: { type: String, default: "CLEAN ENERGY COMMUTING" },
    brandName: { type: String, default: "Tiger Rydo" },
    logoUrl: { type: String, default: "" },
    speedCategory: {
      type: String,
      enum: ["slow_speed", "medium_speed", "high_speed"],
      default: "slow_speed",
    },
    shortDescription: { type: String, default: "" },
    colors: { type: [String], default: [] },
    galleryImages: {
      type: [
        new Schema(
          {
            url: { type: String, required: true },
            caption: { type: String, default: "" },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    mission: { type: String, default: "" },
    companyDescription: { type: String, default: "" },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    website: { type: String, default: "" },
    qrCodeUrl: { type: String, default: "" },
    socialLinks: { type: [String], default: [] },
    motor: { type: String, default: "" },
    speed: { type: String, default: "" },
    chassis: { type: String, default: "" },
    suspension: { type: String, default: "" },
    otherFeature: { type: String, default: "" },
    keyFeatures: { type: BrochureKeyFeaturesSchema, default: () => ({}) },
    brakeSystem: { type: String, default: "" },
    tyre: { type: String, default: "" },
    tyreSizeFront: { type: String, default: "" },
    tyreSizeRear: { type: String, default: "" },
    weight: { type: String, default: "" },
    speedometer: { type: String, default: "" },
    battery: { type: String, default: "" },
    charger: { type: String, default: "" },
    chargingTimeLithium: { type: String, default: "" },
    chargingTimeLeadAcid: { type: String, default: "" },
    headLight: { type: String, default: "" },
    highlightFeatures: { type: [String], default: [] },
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
    brochure: { type: BrochureSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) ||
  model<IProduct>("Product", ProductSchema);

/** @deprecated Use Product model */
export const Scooter = Product;
