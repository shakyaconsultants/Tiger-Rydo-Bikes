import { MessageCircle } from "lucide-react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  phone: string;
  message: string;
  label?: string;
  variant?: "primary" | "outline" | "floating";
  className?: string;
}

export default function WhatsAppButton({
  phone,
  message,
  label = "WhatsApp",
  variant = "primary",
  className = "",
}: WhatsAppButtonProps) {
  const url = buildWhatsAppUrl(phone, message);

  const styles = {
    primary:
      "inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1DA851] transition-colors",
    outline:
      "inline-flex items-center gap-2 rounded-lg border-2 border-[#25D366] px-6 py-3 text-sm font-semibold text-[#25D366] hover:bg-[#25D366]/10 transition-colors",
    floating:
      "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1DA851] transition-all hover:scale-105",
  };

  if (variant === "floating") {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.floating} ${className}`}
        aria-label={label}
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles[variant]} ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </a>
  );
}
