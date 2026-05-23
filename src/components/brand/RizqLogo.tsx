import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";

const SIZES = {
  sm: { box: 36, img: 32 },
  md: { box: 44, img: 40 },
  lg: { box: 56, img: 52 },
  xl: { box: 80, img: 72 },
} as const;

export function RizqLogo({
  size = "md",
  showText = true,
  href = "/",
  className,
  variant = "default",
}: {
  size?: keyof typeof SIZES;
  showText?: boolean;
  href?: string | null;
  className?: string;
  /** على خلفية داكنة (فوتر) */
  variant?: "default" | "onDark";
}) {
  const dim = SIZES[size];
  const inner = (
    <>
      <span
        className={clsx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm",
          variant === "onDark" && "ring-1 ring-white/10",
        )}
        style={{ width: dim.box, height: dim.box }}
      >
        <Image
          src="/rizq-logo.png"
          alt="شعار رزق"
          width={dim.img}
          height={dim.img}
          className="object-contain"
          priority={size === "lg" || size === "xl"}
        />
      </span>
      {showText && (
        <span className="min-w-0 text-start">
          <span
            className={clsx(
              "block font-bold leading-tight",
              size === "sm" ? "text-base" : size === "lg" || size === "xl" ? "text-xl" : "text-lg",
              variant === "onDark" ? "text-white" : "text-slate-900",
            )}
          >
            رزق
          </span>
          <span
            className={clsx(
              "block text-xs leading-snug",
              variant === "onDark" ? "text-emerald-400" : "text-emerald-600",
            )}
          >
            سوق الهال
          </span>
        </span>
      )}
    </>
  );

  const wrapClass = clsx("flex items-center gap-3", className);

  if (href) {
    return (
      <Link href={href} className={wrapClass} aria-label="رزق — الصفحة الرئيسية">
        {inner}
      </Link>
    );
  }

  return <div className={wrapClass}>{inner}</div>;
}
