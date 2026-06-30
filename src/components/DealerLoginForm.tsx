"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "./ui/Button";
import { AlertCircle, LogIn } from "lucide-react";

export default function DealerLoginForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required";
    if (!password) errors.password = "Password is required";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/dealer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      router.push(
        data.dealer.role === "admin" ? "/admin/dashboard" : "/dealer/dashboard"
      );
      router.refresh();
    } catch (error) {
      setStatus("error");
      setErrorMsg(error instanceof Error ? error.message : "Login failed");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-medium tracking-wider text-[#7A7A7A]">
          EMAIL <span className="text-red-400">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((f) => ({ ...f, email: undefined }));
          }}
          placeholder="abc@gmail.com"
          className="w-full rounded-lg border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-[#7A7A7A] focus:border-[#FF5A00] focus:outline-none"
        />
        {fieldErrors.email && (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-xs font-medium tracking-wider text-[#7A7A7A]">
          PASSWORD <span className="text-red-400">*</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((f) => ({ ...f, password: undefined }));
          }}
          placeholder={fieldErrors.password ? fieldErrors.password : "••••••••"}
          className="w-full rounded-lg border border-[#2B2B2B] bg-[#111111] px-4 py-3 text-sm text-white placeholder:text-[#7A7A7A] focus:border-[#FF5A00] focus:outline-none"
        />
        {fieldErrors.password && (
          <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
        )}
      </div>

      {status === "error" && (
        <div className="flex items-center gap-2 rounded-lg bg-red-900/30 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Signing in..." : "Sign In"}
        <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
