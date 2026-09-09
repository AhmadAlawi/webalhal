"use client";

import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { useI18n } from "@/context/I18nContext";

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
  variant?: "default" | "onDark";
}) {
  const { t } = useI18n();
  const dim = SIZES[size];
  const inner = (
    <>
      <span
        className={clsx(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm",
          "rizq-logo-mark",
          variant === "onDark" && "ring-1 ring-white/10",
        )}
        style={{ width: dim.box, height: dim.box }}
      >
        <Image
          src="/rizq-logo.png"
          alt={t("brand.logoAlt")}
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
            {t("brand.name")}
          </span>
          <span
            className={clsx(
              "block text-xs leading-snug",
              variant === "onDark" ? "text-emerald-400" : "text-emerald-600",
            )}
          >
            {t("brand.tagline")}
          </span>
        </span>
      )}
    </>
  );

  const wrapClass = clsx("flex items-center gap-3", className);

  if (href) {
    return (
      <Link href={href} className={wrapClass} aria-label={t("brand.homeAria")}>
        {inner}
      </Link>
    );
  }

  return <div className={wrapClass}>{inner}</div>;
}
