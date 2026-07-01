import Link from "next/link";
import DealerLoginForm from "@/components/DealerLoginForm";
import Logo from "@/components/Logo";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Login — Tiger Rydo",
};

export default function DealerLoginPage() {
  return (
    <div className="min-h-screen bg-black pt-24">
      <div className="mx-auto flex max-w-md flex-col px-6 py-16">
        <Link
          href="/dealers"
          className="mb-8 inline-flex items-center gap-2 text-sm text-[#7A7A7A] hover:text-[#FF5A00]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dealers
        </Link>

        <Logo variant="reverse" showTagline />

        <h1 className="mt-4 font-display text-3xl font-black text-white">
          LOGIN
        </h1>
        <p className="mt-1 text-sm text-[#7A7A7A]">
          Sign in with your admin or dealer account.
        </p>

        <div className="mt-8 rounded-2xl border border-[#2B2B2B] bg-[#111111] p-6 shadow-lg">
          <DealerLoginForm />
        </div>
      </div>
    </div>
  );
}
