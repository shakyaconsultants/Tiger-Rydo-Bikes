import { getDealers } from "@/lib/dealers";
import DealerCard from "@/components/DealerCard";
import WhatsAppButton from "@/components/WhatsAppButton";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { DEALERSHIP_WHATSAPP } from "@/lib/constants";
import { dealershipWhatsAppMessage } from "@/lib/whatsapp";
import { LogIn } from "lucide-react";

export const metadata = {
  title: "Dealers — Tiger Rydo",
  description: "Find authorized Tiger Rydo dealers near you or apply for a dealership.",
};

export const dynamic = "force-dynamic";

export default async function DealersPage() {
  const dealers = await getDealers();

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
              DEALER NETWORK
            </p>
            <h1 className="mt-4 font-display text-5xl font-black text-[#111111] md:text-6xl">
              FIND A DEALER
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-[#7A7A7A]">
              Visit an authorized Tiger Rydo dealer for test rides, service, and support.
              Contact them directly on WhatsApp.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dealer/login">
              <Button variant="outline">
                <LogIn className="mr-2 h-4 w-4" />
                Dealer Login
              </Button>
            </Link>
            <WhatsAppButton
              phone={DEALERSHIP_WHATSAPP.phone}
              message={dealershipWhatsAppMessage("Tiger Rydo Team")}
              label={DEALERSHIP_WHATSAPP.label}
            />
          </div>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dealers.map((dealer) => (
            <DealerCard key={dealer._id || dealer.email} dealer={dealer} />
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-[#0A0A0A] p-8 text-center lg:p-12">
          <h2 className="font-display text-3xl font-black text-white">
            WANT TO BECOME A DEALER?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[#7A7A7A]">
            Join the Tiger Rydo network. Reach out on WhatsApp to explore dealership opportunities.
          </p>
          <div className="mt-8">
            <WhatsAppButton
              phone={DEALERSHIP_WHATSAPP.phone}
              message={dealershipWhatsAppMessage("Tiger Rydo Team")}
              label="Contact on WhatsApp"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
