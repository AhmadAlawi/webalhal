"use client";

import dynamic from "next/dynamic";
import type { MapVolumePoint } from "@/lib/syria-governorates";

const SyriaMarketMap = dynamic(
  () => import("./SyriaMarketMap").then((m) => m.SyriaMarketMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] animate-pulse rounded-2xl bg-slate-100" />
    ),
  },
);

export function SyriaMarketMapDynamic(props: {
  points: MapVolumePoint[];
  height?: number;
  className?: string;
}) {
  return <SyriaMarketMap {...props} />;
}
