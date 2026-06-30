import { connectDB } from "@/lib/mongodb";
import { Dealer } from "@/models/Dealer";
import { FALLBACK_DEALERS } from "@/lib/constants";
import type { Dealer as DealerType } from "@/lib/types";

function mapDealer(d: {
  _id: unknown;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isActive: boolean;
}): DealerType {
  return {
    _id: String(d._id),
    name: d.name,
    email: d.email,
    phone: d.phone,
    whatsapp: d.whatsapp,
    address: d.address,
    city: d.city,
    state: d.state,
    pincode: d.pincode,
    isActive: d.isActive,
  };
}

export async function getDealers(): Promise<DealerType[]> {
  try {
    await connectDB();
    const dealers = await Dealer.find({ isActive: true })
      .select("-password")
      .sort({ city: 1 })
      .lean();

    return dealers.map((d) => mapDealer(d as Parameters<typeof mapDealer>[0]));
  } catch {
    return FALLBACK_DEALERS;
  }
}
