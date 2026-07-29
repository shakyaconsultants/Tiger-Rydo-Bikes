import mongoose, { Schema, models, model } from "mongoose";
import type { ProductBrochure } from "@/lib/types";

export interface IListedProduct {
  name: string;
  price: number;
  imageUrl: string;
  isActive: boolean;
  trackInventory: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  brochure?: ProductBrochure;
}

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
    speedCategory: {
      type: String,
      enum: ["slow_speed", "medium_speed", "high_speed"],
      default: "slow_speed",
    },
    shortDescription: { type: String, default: "" },
    colors: { type: [String], default: [] },
    galleryImageUrls: { type: [String], default: [] },
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

const ListedProductSchema = new Schema<IListedProduct>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    trackInventory: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    brochure: { type: BrochureSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const ListedProduct =
  models.ListedProduct || model<IListedProduct>("ListedProduct", ListedProductSchema);
