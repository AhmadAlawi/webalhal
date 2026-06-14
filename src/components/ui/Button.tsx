import { clsx } from "clsx";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={clsx(
          "inline-flex items-center justify-center rounded-2xl font-semibold transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          fullWidth && "w-full",
          size === "sm" && "px-4 py-2 text-sm",
          size === "md" && "px-6 py-3 text-base",
          size === "lg" && "px-8 py-4 text-lg",
          variant === "primary" &&
            "bg-[#00066D] text-white shadow-[0_10px_22px_rgba(0,6,109,0.16)] hover:bg-[#00044F]",
          variant === "secondary" &&
            "bg-[#FFF3DC] text-[#8B5A00] hover:bg-[#FFE2AD]",
          variant === "outline" &&
            "border-2 border-[#00066D] text-[#00066D] hover:bg-[#F4F5FF]",
          variant === "ghost" && "text-[#00066D] hover:bg-[#F4F5FF]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
