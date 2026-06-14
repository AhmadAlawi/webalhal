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

const DEFAULT_CTA = "اعرف المزيد";

function AdCta({
  ad,
  href,
  onNavigate,
}: {
  ad: Advertisement;
  href: string;
  onNavigate: () => void;
}) {
  const label = ad.buttonLabel?.trim() || DEFAULT_CTA;
  const style = {
    backgroundColor: ad.ctaBackgroundColor ?? "#FF9900",
    color: ad.ctaTextColor ?? "#00066D",
  };

  const className =
    "pointer-events-auto mt-5 inline-flex rounded-lg px-5 py-2.5 text-sm font-extrabold shadow-md transition hover:opacity-90";

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
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 6000);
    return () => clearInterval(t);
  }, [ads.length]);

  useEffect(() => {
    const safeIndex = ads.length ? index % ads.length : 0;
    const ad = ads[safeIndex];
    if (ad?.advertisementId) trackAdView(ad.advertisementId);
  }, [ads, index]);

  if (loading) {
    return (
      <section className="bg-[#F7F8FB] py-8">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="aspect-[20/6] min-h-[220px] w-full animate-pulse rounded-lg bg-[#E6E8F0] sm:min-h-[260px] lg:min-h-[300px]" />
        </div>
      </section>
    );
  }

  if (!ads.length) return null;

  const safeIndex = index % ads.length;
  const ad = ads[safeIndex];
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
      alt={ad.title ?? "إعلان"}
      fill
      className="object-cover"
      priority
      sizes="(max-width: 1280px) 100vw, 1280px"
      unoptimized
    />
  );

  return (
    <section className="bg-[#F7F8FB] py-8">
      <div className="relative mx-auto aspect-[20/6] min-h-[220px] w-full max-w-7xl overflow-hidden rounded-lg border border-[#D7D9E2] bg-[#00066D] shadow-[0_18px_46px_rgba(0,6,109,0.12)] sm:min-h-[260px] lg:min-h-[300px]">
        <div key={ad.advertisementId ?? safeIndex} className="absolute inset-0 animate-fade-up">
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
        <div className="absolute inset-0 bg-gradient-to-l from-[#00066D]/82 via-[#00066D]/32 to-transparent" />
        {(ad.title || ad.description || (href && ad.buttonLabel)) && (
          <div className="absolute inset-y-0 right-0 flex w-full items-end p-5 sm:p-8 md:items-center">
            <div className="max-w-xl text-right">
              {ad.title && (
                <h2
                  className="text-2xl font-extrabold leading-tight text-white sm:text-4xl"
                  style={titleStyle}
                >
                  {ad.title}
                </h2>
              )}
              {ad.description && (
                <p
                  className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-white/82 sm:text-base"
                  style={subtitleStyle}
                >
                  {ad.description}
                </p>
              )}
              {href && <AdCta ad={ad} href={href} onNavigate={handleClick} />}
            </div>
          </div>
        )}
        {ads.length > 1 && (
          <div className="absolute bottom-5 inset-x-0 z-10 flex justify-center gap-2">
            {ads.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`شريحة ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === safeIndex ? "w-8 bg-[#FF9900]" : "w-2 bg-white/55 hover:bg-white/85"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
