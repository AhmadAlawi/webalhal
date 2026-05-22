"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  acceptOffer,
  getTransportRequest,
  rejectOffer,
  notifyTransportRequest,
  getTransportTracking,
  cancelTransportRequest,
  type TransportTrackingPoint,
} from "@/services/transport";
import type { TransportOffer } from "@/services/transport";
import type { TransportRequestDetail } from "@/types/transport";
import { formatCurrency } from "@/lib/format";
import { useRequireAuth } from "@/hooks/useRequireAuth";

const STATUS_AR: Record<string, string> = {
  open: "مفتوح",
  negotiating: "تفاوض",
  assigned: "مُعيَّن",
  completed: "مكتمل",
  cancelled: "ملغى",
};

export default function TransportRequestDetailPage() {
  const { id } = useParams();
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [req, setReq] = useState<TransportRequestDetail | null>(null);
  const [offers, setOffers] = useState<TransportOffer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<number | null>(null);
  const [tracking, setTracking] = useState<TransportTrackingPoint[]>([]);
  const [notifyMsg, setNotifyMsg] = useState("");

  const requestId = Number(id);

  const load = () => {
    getTransportRequest(requestId)
      .then((d) => {
        setReq(d);
        setOffers((d as { offers?: TransportOffer[] })?.offers ?? []);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "تعذّر تحميل الطلب"),
      );
    getTransportTracking(requestId).then(setTracking).catch(() => setTracking([]));
  };

  async function handleNotify() {
    try {
      const res = await notifyTransportRequest(requestId);
      setNotifyMsg(
        res.notifiedTransporters != null
          ? `تم إشعار ${res.notifiedTransporters} ناقل`
          : res.notifyHint || "تم إرسال الإشعارات",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإشعار");
    }
  }

  async function handleCancel() {
    if (!confirm("إلغاء طلب النقل؟")) return;
    try {
      await cancelTransportRequest(requestId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الإلغاء");
    }
  }

  useEffect(() => {
    if (isLoading || !isAuthenticated || !requestId) return;
    load();
  }, [requestId, isLoading, isAuthenticated]);

  async function handleAccept(offerId: number) {
    setActing(offerId);
    try {
      await acceptOffer(offerId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل القبول");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(offerId: number) {
    setActing(offerId);
    try {
      await rejectOffer(offerId);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل الرفض");
    } finally {
      setActing(null);
    }
  }

  return (
    <>
      <PageHeader title={`طلب نقل #${id}`} backHref="/transport/requests" />
      <PageContainer className="py-6">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-red-700">{error}</p>
        )}
        {req && (
          <article className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <StatusBadge status={req.status} />
              <span className="text-sm text-slate-500">
                {STATUS_AR[req.status?.toLowerCase() ?? ""] ?? req.status}
              </span>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">من</dt>
                <dd className="font-medium">{req.fromRegion ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">إلى</dt>
                <dd className="font-medium">{req.toRegion ?? "—"}</dd>
              </div>
              {req.agreedPrice != null && (
                <div>
                  <dt className="text-slate-500">السعر المتفق</dt>
                  <dd className="font-medium text-emerald-600">
                    {formatCurrency(req.agreedPrice)}
                  </dd>
                </div>
              )}
              {req.productType && (
                <div>
                  <dt className="text-slate-500">المنتج</dt>
                  <dd className="font-medium">{req.productType}</dd>
                </div>
              )}
            </dl>
            {req.status?.toLowerCase() === "assigned" && (
              <p className="mt-6 text-sm text-emerald-700">
                تم تعيين الناقل. تابع التسليم من المحادثات.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleNotify}>
                إعادة إشعار الناقلين
              </Button>
              {["open", "negotiating"].includes(req.status?.toLowerCase() ?? "") && (
                <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                  إلغاء الطلب
                </Button>
              )}
            </div>
            {notifyMsg && <p className="mt-2 text-sm text-emerald-700">{notifyMsg}</p>}
            <Link
              href="/chat"
              className="mt-4 inline-block text-sm font-semibold text-emerald-600 hover:underline"
            >
              المحادثات
            </Link>
          </article>
        )}

        {tracking.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 font-semibold text-slate-900">تتبع الشحنة</h2>
            <ul className="space-y-2 rounded-xl border bg-white p-4">
              {tracking.map((p, i) => (
                <li key={p.trackingId ?? i} className="text-sm text-slate-600">
                  {p.recordedAt && new Date(p.recordedAt).toLocaleString("ar-SY")}
                  {p.latitude != null && p.longitude != null && (
                    <span className="ms-2">
                      ({p.latitude.toFixed(4)}, {p.longitude.toFixed(4)})
                    </span>
                  )}
                  {p.notes && <span className="block text-slate-500">{p.notes}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {offers.length > 0 && (
          <section>
            <h2 className="mb-4 font-semibold text-slate-900">عروض الناقلين</h2>
            <ul className="space-y-3">
              {offers.map((o) => (
                <li
                  key={o.offerId}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4"
                >
                  <div>
                    <p className="font-medium">
                      {o.transporterName || `ناقل #${o.transportProviderId ?? o.transporterId}`}
                    </p>
                    <p className="text-emerald-600 font-bold">
                      {formatCurrency(o.offeredPrice ?? 0)}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                  {o.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={acting === o.offerId}
                        onClick={() => handleAccept(o.offerId)}
                      >
                        قبول
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acting === o.offerId}
                        onClick={() => handleReject(o.offerId)}
                      >
                        رفض
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </PageContainer>
    </>
  );
}
