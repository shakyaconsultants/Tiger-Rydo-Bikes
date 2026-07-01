import Image from "next/image";

interface LogoProps {
  variant?: "primary" | "reverse" | "monochrome" | "icon";
  showTagline?: boolean;
  className?: string;
}

export default function Logo({
  variant = "primary",
  showTagline = false,
  className = "",
}: LogoProps) {
  const isReverse = variant === "reverse";
  const isMonochrome = variant === "monochrome";
  const isIconOnly = variant === "icon";

  const textColor = isReverse ? "#FFFFFF" : "#111111";
  const iconColor = isMonochrome ? textColor : "#FF5A00";

  if (isIconOnly) {
    return (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Tiger Rydo"
      >
        <circle
          cx="28"
          cy="28"
          r="14"
          stroke={iconColor}
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M4 36C12 28 20 18 32 8"
          stroke={iconColor}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M8 32C14 26 22 18 30 12"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    );
  }

  return (

    <div className={className}>
      <Image
        src={variant === "reverse"
          ? "/images/tiger logo white.png"
          : "/images/tiger logo.png"}
        alt="Tiger Rydo"
        width={220}
        height={70}
        priority
      />
    </div>

  );
}
