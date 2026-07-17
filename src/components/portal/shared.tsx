import type { ReactNode } from "react";
import type { OrderStatus } from "@/lib/types";

export const BRAND_ORANGE = "#FF5A00";

export const inputClass =
  "w-full rounded-lg border border-[#E6E6E6] px-3 py-2.5 text-sm focus:border-[#FF5A00] focus:outline-none focus:ring-2 focus:ring-[#FF5A00]/20";

export const inputErrorClass =
  "w-full rounded-lg border border-red-400 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 bg-red-50/40";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-emerald-100 text-emerald-800 border-emerald-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export function PortalShell({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F4F4F5] pt-20">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 overflow-hidden rounded-2xl border border-[#E6E6E6] bg-white shadow-sm">
          <div className="h-1.5 bg-[#FF5A00]" />
          <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
            <div>
              {badge && (
                <span className="mb-2 inline-block rounded-full bg-[#FF5A00]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#FF5A00]">
                  {badge}
                </span>
              )}
              <h1 className="text-2xl font-bold text-[#111]">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-[#666]">{subtitle}</p>}
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SimpleTabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            active === t.id
              ? "bg-[#111] text-white shadow-md"
              : "border border-[#E6E6E6] bg-white text-[#666] hover:border-[#FF5A00]/40 hover:text-[#111]"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                active === t.id ? "bg-white/20 text-white" : "bg-[#F4F4F5] text-[#888]"
              }`}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Panel({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E6E6E6] bg-white p-6 shadow-sm">
      {(title || description) && (
        <div className="mb-5 border-b border-[#F0F0F0] pb-4">
          {title && <h2 className="text-lg font-bold text-[#111]">{title}</h2>}
          {description && <p className="mt-1 text-sm text-[#888]">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "orange",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "orange" | "blue" | "green" | "gray";
}) {
  const accents = {
    orange: "border-[#FF5A00]/30 bg-[#FF5A00]/5 text-[#FF5A00]",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    gray: "border-[#E6E6E6] bg-[#FAFAFA] text-[#666]",
  };

  return (
    <div className={`rounded-xl border p-4 ${accents[accent]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#111]">{value}</p>
      {hint && <p className="mt-1 text-xs opacity-70">{hint}</p>}
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  rows,
  required,
  error,
  hint,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  hint?: string;
  placeholder?: string;
}) {
  const cls = error ? inputErrorClass : inputClass;
  const fieldPlaceholder = error ? error : placeholder;

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-semibold text-[#333]">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {hint && !error && <p className="mb-1.5 text-xs text-[#888]">{hint}</p>}
      <div className={error ? "rounded-lg ring-1 ring-red-400" : ""}>
        {rows ? (
          <textarea
            className={cls}
            rows={rows}
            value={value}
            placeholder={fieldPlaceholder}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <input
            type={type}
            step={step}
            className={cls}
            value={value}
            placeholder={fieldPlaceholder}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
        {error && <p className="px-1 pb-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}

export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-[#F0F0F0] pb-4">
      {children}
    </div>
  );
}

export function Flash({ message, type = "info" }: { message: string; type?: "info" | "success" | "error" }) {
  if (!message) return null;
  const styles = {
    info: "bg-[#111] text-white",
    success: "bg-emerald-600 text-white",
    error: "bg-red-600 text-white",
  };
  return (
    <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${styles[type]}`}>
      {message}
    </div>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#DDD] bg-[#FAFAFA] px-6 py-10 text-center">
      <p className="text-sm text-[#888]">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function requiredError(value: string, label: string): string | undefined {
  if (!value.trim()) return `${label} is required`;
  return undefined;
}
