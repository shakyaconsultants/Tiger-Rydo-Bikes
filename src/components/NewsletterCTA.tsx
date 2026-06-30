"use client";

import { useState, FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import Button from "./ui/Button";
import { BRAND } from "@/lib/constants";

export default function NewsletterCTA() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="bg-[#FF5A00] py-16">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <h2 className="font-display text-3xl font-black text-white md:text-4xl">
          {BRAND.motto}
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-white/80">
          Stay updated on new models, features, and exclusive offers.
        </p>

        <form onSubmit={handleSubmit} className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="flex-1 rounded-lg border-0 bg-white/20 px-4 py-3 text-sm text-white placeholder:text-white/60 backdrop-blur focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <Button
            type="submit"
            variant="secondary"
            disabled={status === "loading"}
            className="bg-[#111111] hover:bg-[#0A0A0A]"
          >
            Subscribe
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        {status === "success" && (
          <p className="mt-3 text-sm text-white/90">You&apos;re subscribed!</p>
        )}
        {status === "error" && (
          <p className="mt-3 text-sm text-white/90">Something went wrong. Try again.</p>
        )}
      </div>
    </section>
  );
}
