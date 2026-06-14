"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft, MapPin, ShieldCheck } from "lucide-react";
import { formatPrice } from "@/lib/auctionPricing";

interface ListingCardProps {
  href: string;
  title: string;
  imageUrl: string;
  price?: number;
  priceLabel?: string;
  location?: string;
  endTime?: string;
  badge?: string;
  /** سطر إضافي: كمية، وحدة، حالة — مطابق لتطبيق الموبايل */
  meta?: string;
}

export const ListingCard = memo(function ListingCard({
  href,
  title,
  imageUrl,
  price,
  priceLabel = "السعر",
  location,
  badge,
  meta,
}: ListingCardProps) {
  const cta =
    badge === "مزاد" ? "زايد الآن" : badge === "مناقصة" ? "تقديم عرض" : "اشتر الآن";

  return (
    <Link
      href={href}
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#D7D9E2] bg-white shadow-[0_12px_28px_rgba(0,6,109,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#00066D]/20 hover:shadow-[0_18px_38px_rgba(0,6,109,0.12)]"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F4F5FF]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 720px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {badge && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/92 px-3 py-1 text-xs font-extrabold text-[#00066D] shadow-sm backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5 text-[#FF9900]" />
            {badge}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 md:p-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 flex-1 text-right text-lg font-extrabold leading-7 text-[#00066D] md:text-xl">
            {title}
          </h3>
        </div>
        {meta && <p className="mt-1 text-right text-xs font-semibold text-[#8D90A0]">{meta}</p>}
        <div className="mt-3 flex flex-wrap justify-end gap-3 text-sm font-semibold text-[#777B8F]">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {location}
            </span>
          )}
        </div>
        <div className="mt-auto pt-5">
          {price != null && (
            <div className="mb-4 flex items-end justify-between gap-4 rounded-lg bg-[#F7F8FB] px-4 py-3">
              <p className="text-sm font-bold text-[#8D90A0]">{priceLabel}</p>
              <p className="text-2xl font-extrabold text-[#8B5A00]">
                {formatPrice(price)} JD
              </p>
            </div>
          )}
          <span className="flex items-center justify-center gap-2 rounded-lg bg-[#FF9900] px-5 py-3 text-sm font-extrabold text-[#00066D] transition group-hover:bg-[#00066D] group-hover:text-white">
            {cta}
            <ArrowUpLeft className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
});
