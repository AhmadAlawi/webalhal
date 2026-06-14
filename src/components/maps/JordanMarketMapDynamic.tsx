"use client";

import dynamic from "next/dynamic";
import type { MapVolumePoint } from "@/lib/jordan-governorates";

const JordanMarketMap = dynamic(
  () => import("./JordanMarketMap").then((m) => m.JordanMarketMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[360px] animate-pulse rounded-2xl bg-slate-100" />
    ),
  },
);

export function JordanMarketMapDynamic(props: {
  points: MapVolumePoint[];
  height?: number;
  className?: string;
}) {
  return <JordanMarketMap {...props} />;
}
