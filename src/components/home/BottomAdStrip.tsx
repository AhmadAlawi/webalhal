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
    <div className="relative aspect-[3/2] overflow-hidden rounded-lg border border-[#D7D9E2] bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-[#00066D]/20 hover:shadow-md">
      {img}
      {ad.title && (
        <p className="absolute bottom-0 inset-x-0 truncate bg-[#00066D]/82 px-2 py-1.5 text-center text-xs font-bold text-white">
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
    <section className="border-t border-[#D7D9E2] bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold text-[#8B5A00]">مساحات إعلانية</p>
            <h2 className="mt-1 text-2xl font-extrabold text-[#00066D]">إعلانات وشركاء</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {ads.map((ad) => (
            <BottomAdCard key={ad.advertisementId} ad={ad} />
          ))}
        </div>
      </div>
    </section>
  );
}
