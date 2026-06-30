import type { IDealer } from "@/models/Dealer";

export function normalizeDealerInput(body: Partial<IDealer>): Omit<IDealer, "password"> & { password?: string } {
  return {
    name: body.name?.trim() || "",
    email: body.email?.trim().toLowerCase() || "",
    phone: body.phone?.trim() || "+91",
    whatsapp: body.whatsapp?.trim() || "91",
    address: body.address?.trim() || "",
    city: body.city?.trim() || "",
    state: body.state?.trim() || "",
    pincode: body.pincode?.trim() || "",
    isActive: body.isActive ?? true,
    password: body.password,
  };
}
