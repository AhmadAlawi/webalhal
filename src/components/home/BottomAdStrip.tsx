"use client";

import Image from "next/image";
import Link from "next/link";
import {
  advertisementHref,
  isExternalAdHref,
} from "@/lib/advertisement";
import { resolveMediaUrl } from "@/lib/media";
import { trackAdClick } from "@/services/catalog";
import type { Advertisement } from "@/types";
import { useAuth } from "@/context/AuthContext";

function BottomAdCard({ ad }: { ad: Advertisement }) {
  const { user } = useAuth();
  const href = advertisementHref(ad);
  const img = (
    <Image
      src={resolveMediaUrl(ad.imageUrl ?? ad.thumbnailUrl)}
      alt={ad.title ?? "إعلان"}
      fill
      sizes="(max-width: 640px) 50vw, 16vw"
      className="object-contain p-2"
      unoptimized
    />
  );

  function onClick() {
    if (ad.advertisementId) {
      void trackAdClick(ad.advertisementId, user?.userId);
    }
  }

  const shell = (
    <div className="relative aspect-[3/2] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md">
      {img}
      {ad.title && (
        <p className="absolute bottom-0 inset-x-0 truncate bg-black/50 px-2 py-1 text-center text-xs text-white">
          {ad.title}
        </p>
      )}
    </div>
  );

  if (!href) return shell;

  if (isExternalAdHref(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        onClick={onClick}
      >
        {shell}
      </a>
    );
  }

  return (
    <Link href={href} className="block" onClick={onClick}>
      {shell}
    </Link>
  );
}

export function BottomAdStrip({ ads }: { ads: Advertisement[] }) {
  if (!ads.length) return null;

  return (
    <section className="border-t border-gray-100 bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-lg font-bold text-slate-800">إعلانات وشركاء</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {ads.map((ad) => (
            <BottomAdCard key={ad.advertisementId} ad={ad} />
          ))}
        </div>
      </div>
    </section>
  );
}
