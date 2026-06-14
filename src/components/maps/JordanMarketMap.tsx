"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import type { MapVolumePoint } from "@/lib/jordan-governorates";
import {
  JORDAN_MAP_BOUNDS,
  getJordanMapDefaults,
  mergeGovernorateMapPoints,
} from "@/lib/jordan-governorates";
import { formatNumber } from "@/lib/format";
import "leaflet/dist/leaflet.css";

function JordanMapView({ hasVolumeData }: { hasVolumeData: boolean }) {
  const map = useMap();
  const { center, zoom } = getJordanMapDefaults();

  useEffect(() => {
    if (hasVolumeData) return;
    map.setView([center.lat, center.lng], zoom, { animate: false });
  }, [map, center.lat, center.lng, zoom, hasVolumeData]);

  return null;
}

function FitVolumeBounds({ points }: { points: MapVolumePoint[] }) {
  const map = useMap();
  const volumePoints = useMemo(() => points.filter((p) => p.volume > 0), [points]);

  useEffect(() => {
    if (volumePoints.length === 0) return;
    const bounds = volumePoints.map((p) => [p.lat, p.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 8 });
  }, [map, volumePoints]);

  return null;
}

function radiusForVolume(volume: number, max: number) {
  if (volume <= 0) return 7;
  const min = 12;
  const maxR = 42;
  if (max <= 0) return min;
  return min + (volume / max) * (maxR - min);
}

export function JordanMarketMap({
  points,
  height = 360,
  className = "",
}: {
  points: MapVolumePoint[];
  height?: number;
  className?: string;
}) {
  const { center, zoom } = getJordanMapDefaults();
  const displayPoints = useMemo(() => mergeGovernorateMapPoints(points), [points]);
  const volumePoints = useMemo(
    () => displayPoints.filter((p) => p.volume > 0),
    [displayPoints],
  );
  const maxVol = useMemo(
    () => Math.max(...volumePoints.map((p) => p.volume), 1),
    [volumePoints],
  );
  const hasVolumeData = volumePoints.length > 0;

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 shadow-inner ${className}`}
      style={{ height }}
      dir="ltr"
    >
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={6}
        maxZoom={10}
        maxBounds={JORDAN_MAP_BOUNDS as LatLngBoundsExpression}
        maxBoundsViscosity={1}
        scrollWheelZoom
        className="h-full w-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <JordanMapView hasVolumeData={hasVolumeData} />
        {hasVolumeData && <FitVolumeBounds points={displayPoints} />}
        {displayPoints.map((p) => {
          const active = p.volume > 0;
          return (
            <CircleMarker
              key={`${p.governorateId ?? p.name}-${p.lat}`}
              center={[p.lat, p.lng]}
              radius={radiusForVolume(p.volume, maxVol)}
              pathOptions={{
                color: active ? "#00044F" : "#94a3b8",
                fillColor: active ? "#FF9900" : "#cbd5e1",
                fillOpacity: active ? 0.55 : 0.35,
                weight: active ? 2 : 1,
              }}
            >
              {active && (
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -8]}
                  opacity={1}
                  className="!rounded-lg !border !border-orange-200 !bg-white !px-2 !py-1 !text-[11px] !font-semibold !text-[#00044F] !shadow"
                >
                  {formatNumber(p.volume)}
                </Tooltip>
              )}
              <Popup>
                <div className="text-end" dir="rtl" style={{ minWidth: 140 }}>
                  <strong>{p.name}</strong>
                  <p className="mt-1 text-sm text-slate-600">
                    {active
                      ? `الحجم: ${formatNumber(p.volume)} كغ`
                      : "لا توجد بيانات حجم في هذه الفترة"}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
