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
            "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
          variant === "secondary" &&
            "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
          variant === "outline" &&
            "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50",
          variant === "ghost" && "text-emerald-600 hover:bg-emerald-50",
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
