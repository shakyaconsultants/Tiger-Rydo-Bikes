import mongoose, { Schema, models, model } from "mongoose";

export interface IInquiry {
  name: string;
  email: string;
  phone?: string;
  scooter?: string;
  scooterName?: string;
  message: string;
  type: "contact" | "test-ride" | "newsletter";
}

const InquirySchema = new Schema<IInquiry>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    scooter: {
      type: String,
      default: "",
    },
    scooterName: {
      type: String,
      default: "",
    },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["contact", "test-ride", "newsletter"],
      default: "contact",
    },
  },
  { timestamps: true }
);

export const Inquiry = models.Inquiry || model<IInquiry>("Inquiry", InquirySchema);
