"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Advertisement } from "@/types";
import { resolveMediaUrl } from "@/lib/media";
import { trackAdView } from "@/services/catalog";

function adHref(ad: Advertisement): string | null {
  if (ad.linkUrl) return ad.linkUrl;
  if (ad.navigationType === "internal_route" && ad.navigationValue) {
    return ad.navigationValue.startsWith("/") ? ad.navigationValue : `/${ad.navigationValue}`;
  }
  return null;
}

export function BannerCarousel({
  ads,
  loading = false,
}: {
  ads: Advertisement[];
  loading?: boolean;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % ads.length), 6000);
    return () => clearInterval(t);
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
  const href = adHref(ad);

  const image = (
    <Image
      src={resolveMediaUrl(ad.imageUrl)}
      alt={ad.title ?? "إعلان"}
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
          {href ? (
            <Link href={href} className="absolute inset-0 block">
              {image}
            </Link>
          ) : (
            image
          )}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {(ad.title || ad.description) && (
          <div className="pointer-events-none absolute bottom-0 inset-x-0 p-6 sm:p-10">
            <div className="mx-auto max-w-7xl">
              {ad.title && (
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{ad.title}</h2>
              )}
              {ad.description && (
                <p className="mt-1 text-sm text-white/80 sm:text-base">{ad.description}</p>
              )}
            </div>
          </div>
        )}
      </div>
      {ads.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2">
          {ads.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`شريحة ${i + 1}`}
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
