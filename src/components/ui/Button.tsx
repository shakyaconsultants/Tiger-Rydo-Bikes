import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", size = "md", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF5A00] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-[#FF5A00] text-white hover:bg-[#E65100] active:scale-[0.98]",
      secondary:
        "bg-[#111111] text-white hover:bg-[#2B2B2B] active:scale-[0.98]",
      outline:
        "border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-black",
      ghost: "text-[#111111] hover:text-[#FF5A00]",
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-sm",
      lg: "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
