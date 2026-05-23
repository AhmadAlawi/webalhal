import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import { BannerCarousel } from "@/components/home/BannerCarousel";

function HomeFallback() {
  return (
    <>
      <BannerCarousel ads={[]} loading />
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">
        جاري تحميل الرئيسية...
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePageClient />
    </Suspense>
  );
}
