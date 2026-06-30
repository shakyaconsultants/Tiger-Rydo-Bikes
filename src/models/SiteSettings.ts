import mongoose, { Schema, models, model, Model } from "mongoose";

export interface ISiteSettings {
  key: string;
  brandName: string;
  fullName: string;
  tagline: string;
  subTagline: string;
  logoTagline: string;
  logoSubTagline: string;
  logoUrl: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  accentColor: string;
  hiddenProductSlugs?: string[];

  createdAt?: Date;
  updatedAt?: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    key: { type: String, default: "main", unique: true },
    brandName: { type: String, required: true },
    fullName: { type: String, required: true },
    tagline: { type: String, required: true },
    subTagline: { type: String, required: true },
    logoTagline: { type: String, required: true },
    logoSubTagline: { type: String, required: true },
    logoUrl: { type: String, default: "" },
    heroTitle: { type: String, required: true },
    heroHighlight: { type: String, required: true },
    heroSubtitle: { type: String, required: true },
    accentColor: { type: String, default: "#FF5A00" },
    hiddenProductSlugs: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  (models.SiteSettings as Model<ISiteSettings>) ||
  model<ISiteSettings>("SiteSettings", SiteSettingsSchema);