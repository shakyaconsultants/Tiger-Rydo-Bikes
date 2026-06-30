"use client";

import { useState, FormEvent } from "react";
import Button from "./ui/Button";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          scooter: formData.get("scooter"),
          message: formData.get("message"),
          type: "test-ride",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setStatus("success");
      form.reset();
    } catch (error) {
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Failed to submit");
    }
  }

  return (
    <section id="contact" className="bg-[#0A0A0A] py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium tracking-[0.3em] text-[#FF5A00]">
              GET IN TOUCH
            </p>
            <h2 className="mt-4 font-display text-4xl font-black text-white md:text-5xl">
              BOOK A
              <br />
              TEST RIDE
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-[#7A7A7A]">
              Experience Tiger firsthand. Fill out the form and our team will
              get back to you within 24 hours.
            </p>

            <div className="mt-10 space-y-4">
              <InfoRow label="Email" value="hello@tigerrydo.com" />
              <InfoRow label="Phone" value="+91 1800-TIGER-01" />
              <InfoRow label="Hours" value="Mon–Sat, 9AM–6PM" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" name="name" required placeholder="Your name" />
              <Field label="Email" name="email" type="email" required placeholder="you@email.com" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Phone" name="phone" type="tel" placeholder="+91 98765 43210" />
              <div>
                <label htmlFor="scooter" className="mb-2 block text-xs font-medium tracking-wider text-[#7A7A7A]">
                  MODEL
                </label>
                <select
                  id="scooter"
                  name="scooter"
                  className="w-full rounded-lg border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-sm text-white focus:border-[#FF5A00] focus:outline-none"
                >
                  <option value="">Select a model</option>
                  <option value="tiger-e1">Tiger E1</option>
                  <option value="tiger-e1-pro">Tiger E1 Pro</option>
                  <option value="tiger-e1-lite">Tiger E1 Lite</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-xs font-medium tracking-wider text-[#7A7A7A]">
                MESSAGE
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={4}
                placeholder="Tell us about your riding needs..."
                className="w-full resize-none rounded-lg border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-[#7A7A7A] focus:border-[#FF5A00] focus:outline-none"
              />
            </div>

            {status === "success" && (
              <div className="flex items-center gap-2 rounded-lg bg-green-900/30 px-4 py-3 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                Thank you! We&apos;ll be in touch soon.
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4" />
                {errorMsg}
              </div>
            )}

            <Button type="submit" size="lg" disabled={status === "loading"} className="w-full sm:w-auto">
              {status === "loading" ? "Sending..." : "Submit Inquiry"}
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-xs font-medium tracking-wider text-[#7A7A7A]">
        {label.toUpperCase()}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-[#7A7A7A] focus:border-[#FF5A00] focus:outline-none"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-16 text-xs font-medium tracking-wider text-[#7A7A7A]">
        {label.toUpperCase()}
      </span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
