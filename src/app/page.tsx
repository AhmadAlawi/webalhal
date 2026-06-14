import { Suspense } from "react";
import HomePageClient from "./HomePageClient";
import { HomeFallback } from "./HomeFallback";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePageClient />
    </Suspense>
  );
}
