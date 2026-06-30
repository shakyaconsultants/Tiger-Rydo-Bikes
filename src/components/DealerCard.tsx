import { MapPin, Phone, Mail } from "lucide-react";
import WhatsAppButton from "./WhatsAppButton";
import type { Dealer } from "@/lib/types";
import { productInquiryMessage } from "@/lib/whatsapp";

interface DealerCardProps {
  dealer: Dealer;
}

export default function DealerCard({ dealer }: DealerCardProps) {
  return (
    <article className="rounded-2xl border border-[#E6E6E6] bg-white p-6 transition-all hover:border-[#FF5A00]/30 hover:shadow-lg">
      <h3 className="font-display text-xl font-black text-[#111111]">
        {dealer.name}
      </h3>
      <p className="mt-1 text-sm text-[#FF5A00]">
        {dealer.city}, {dealer.state}
      </p>

      <div className="mt-4 space-y-2 text-sm text-[#7A7A7A]">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5A00]" />
          {dealer.address}, {dealer.pincode}
        </p>
        <p className="flex items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-[#FF5A00]" />
          {dealer.phone}
        </p>
        <p className="flex items-center gap-2">
          <Mail className="h-4 w-4 shrink-0 text-[#FF5A00]" />
          {dealer.email}
        </p>
      </div>

      <div className="mt-6">
        <WhatsAppButton
          phone={dealer.whatsapp}
          message={productInquiryMessage("Tiger Rydo", "any model")}
          label="Contact on WhatsApp"
          className="w-full justify-center"
        />
      </div>
    </article>
  );
}
