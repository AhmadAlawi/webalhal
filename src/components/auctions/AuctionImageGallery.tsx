"use client";

import { useState } from "react";
import Image from "next/image";
import { getAuctionImages } from "@/lib/media";

type AuctionImageSource = Parameters<typeof getAuctionImages>[0];

export function AuctionImageGallery({
  auction,
  title,
  className = "",
}: {
  auction: AuctionImageSource | null;
  title?: string;
  className?: string;
}) {
  const images = auction ? getAuctionImages(auction) : ["/placeholder-crop.svg"];
  const [active, setActive] = useState(0);
  const safeIndex = active < images.length ? active : 0;

  return (
    <section className={`w-full bg-slate-900 ${className}`}>
      <div className="relative aspect-[16/9] w-full min-h-[220px] sm:min-h-[280px] lg:min-h-[360px] lg:max-h-[50vh]">
        <Image
          src={images[safeIndex]}
          alt={title ?? "صورة المزاد"}
          fill
          className="object-cover"
          unoptimized
          priority
          sizes="100vw"
        />
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/40 px-2 py-1.5 backdrop-blur-sm">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`صورة ${i + 1}`}
                className={`h-2 w-2 rounded-full transition ${
                  i === safeIndex ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
                onClick={() => setActive(i)}
              />
            ))}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto bg-slate-950/90 px-3 py-2 sm:px-6">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-28 ${
                i === safeIndex ? "border-emerald-400" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" unoptimized sizes="112px" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
