"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  advertisementHref,
  isExternalAdHref,
} from "@/lib/advertisement";
import { resolveMediaUrl } from "@/lib/media";
import { trackAdClick, trackAdView } from "@/services/catalog";
import type { Advertisement } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

function AdCta({
  ad,
  href,
  onNavigate,
  defaultCta,
}: {
  ad: Advertisement;
  href: string;
  onNavigate: () => void;
  defaultCta: string;
}) {
  const label = ad.buttonLabel?.trim() || defaultCta;
  const style = {
    backgroundColor: ad.ctaBackgroundColor ?? "#047857",
    color: ad.ctaTextColor ?? "#ffffff",
  };

  const className =
    "pointer-events-auto mt-4 inline-flex rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition hover:opacity-90";

  if (isExternalAdHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        onClick={onNavigate}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} style={style} onClick={onNavigate}>
      {label}
    </Link>
  );
}

export function BannerCarousel({
  ads,
  loading = false,
}: {
  ads: Advertisement[];
  loading?: boolean;
}) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [prevAds, setPrevAds] = useState(ads);
  const defaultCta = t("home.banner.defaultCta");

  if (prevAds !== ads) {
    setPrevAds(ads);
    setIndex(0);
  }

  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % ads.length), 6000);
    return () => clearInterval(timer);
  }, [ads.length]);

  useEffect(() => {
    const ad = ads[index];
    if (ad?.advertisementId) trackAdView(ad.advertisementId);
  }, [ads, index]);

  if (loading) {
    return (
      <section className="border-b border-slate-200/60 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="aspect-[21/7] min-h-[220px] w-full animate-pulse rounded-2xl bg-slate-200 sm:min-h-[280px] lg:min-h-[320px]" />
        </div>
      </section>
    );
  }

  if (!ads.length) return null;

  const ad = ads[index];
  const href = advertisementHref(ad);

  function handleClick() {
    if (ad.advertisementId) {
      void trackAdClick(ad.advertisementId, user?.userId);
    }
  }

  const titleStyle = ad.titleColor ? { color: ad.titleColor } : undefined;
  const subtitleStyle = ad.subtitleColor ? { color: ad.subtitleColor } : undefined;

  const image = (
    <Image
      src={resolveMediaUrl(ad.imageUrl)}
      alt={ad.title ?? t("home.banner.adAlt")}
      fill
      className="object-cover"
      priority
      sizes="100vw"
      unoptimized
    />
  );

  return (
    <section className="relative w-full overflow-hidden border-b border-slate-200/60 bg-slate-900">
      <div className="relative aspect-[21/7] min-h-[220px] w-full max-h-[420px] sm:min-h-[280px] lg:min-h-[320px]">
        <div key={ad.advertisementId ?? index} className="absolute inset-0 animate-fade-up">
          {href && !ad.buttonLabel ? (
            isExternalAdHref(href) ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 block"
                onClick={handleClick}
              >
                {image}
              </a>
            ) : (
              <Link
                href={href}
                className="absolute inset-0 block"
                onClick={handleClick}
              >
                {image}
              </Link>
            )
          ) : (
            image
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/25 to-transparent" />
        {(ad.title || ad.description || (href && ad.buttonLabel)) && (
          <div className="absolute bottom-0 inset-x-0 p-6 sm:p-10">
            <div className="mx-auto max-w-7xl">
              {ad.title && (
                <h2
                  className="text-2xl font-bold text-white sm:text-3xl"
                  style={titleStyle}
                >
                  {ad.title}
                </h2>
              )}
              {ad.description && (
                <p
                  className="mt-1 text-sm text-white/85 sm:text-base"
                  style={subtitleStyle}
                >
                  {ad.description}
                </p>
              )}
              {href && <AdCta ad={ad} href={href} onNavigate={handleClick} defaultCta={defaultCta} />}
            </div>
          </div>
        )}
      </div>
      {ads.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 z-10 flex justify-center gap-2">
          {ads.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t("home.banner.slideAria", "", { n: i + 1 })}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
