"use client";

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
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
}

export const ListingCard = memo(function ListingCard({
  href,
  title,
  imageUrl,
  price,
  priceLabel = "السعر",
  location,
  endTime,
  badge,
}: ListingCardProps) {
  return (
    <Link
      href={href}
      className="block overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-emerald-50">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
        {badge && (
          <span className="absolute top-3 start-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow-md">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 font-semibold text-slate-900">{title}</h3>
        {price != null && (
          <p className="mt-1 font-bold text-emerald-600">
            {priceLabel}: {formatPrice(price)} ل.س
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          {location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          )}
          {endTime && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(endTime).toLocaleDateString("ar-SY")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});
