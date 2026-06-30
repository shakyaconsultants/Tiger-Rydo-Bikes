import mongoose, { Schema, models, model } from "mongoose";

export interface IDealer {
  name: string;
  email: string;
  password: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
}

const DealerSchema = new Schema<IDealer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Dealer = models.Dealer || model<IDealer>("Dealer", DealerSchema);
