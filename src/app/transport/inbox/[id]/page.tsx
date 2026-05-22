"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/lib/format";
import {
  getTransportRequest,
  submitTransportOffer,
} from "@/services/transport";
import type { TransportRequestDetail } from "@/types/transport";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

export default function TransportInboxDetailPage() {
  const { id } = useParams();
  const { user, requireAuth } = useAuth();
  const requestId = Number(id);
  const [req, setReq] = useState<TransportRequestDetail | null>(null);
  const [price, setPrice] = useState("");
  const [providerId, setProviderId] = useState<number | "">("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!requireAuth() || !requestId) return;
    getTransportRequest(requestId).then(setReq).catch(() => setReq(null));
  }, [requestId, requireAuth]);

  async function submitOffer() {
    if (!user?.userId || !providerId || !price) {
      setError("أدخل السعر ومعرف المزود");
      return;
    }
    setSending(true);
    setError("");
    setSuccess("");
    try {
      await submitTransportOffer({
        transportRequestId: requestId,
        transporterId: Number(providerId),
        offeredPrice: Number(price),
        estimatedPickupDate: new Date().toISOString(),
        estimatedDeliveryDate: new Date(Date.now() + 86400000).toISOString(),
      });
      setSuccess("تم إرسال العرض");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إرسال العرض");
    } finally {
      setSending(false);
    }
  }

  if (user?.roleId !== UserRole.Transport) {
    return (
      <PageContainer className="py-16 text-center text-red-600">للناقلين فقط</PageContainer>
    );
  }

  return (
    <>
      <PageHeader title={`طلب نقل #${id}`} backHref="/transport/inbox" />
      <PageContainer className="py-8">
        {!req ? (
          <p className="text-center text-slate-500">جاري التحميل...</p>
        ) : (
          <div className="space-y-6">
            <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge status={req.status} />
              </div>
              <p className="text-lg font-semibold">{req.productType || "طلب نقل"}</p>
              <p className="mt-2 text-slate-600">
                {req.fromRegion} → {req.toRegion}
              </p>
              {req.weightKg != null && (
                <p className="mt-1 text-sm text-slate-500">الوزن: {req.weightKg} كغ</p>
              )}
            </article>

            {(req.status === "open" || req.status === "negotiating") && (
              <section className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-6">
                <h2 className="mb-4 font-semibold text-slate-900">تقديم عرض</h2>
                <Input
                  label="معرف مزود النقل (TransportProviderId)"
                  type="number"
                  value={providerId === "" ? "" : String(providerId)}
                  onChange={(e) =>
                    setProviderId(e.target.value ? Number(e.target.value) : "")
                  }
                />
                <Input
                  label="السعر المقترح (ل.س)"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
                {success && <p className="text-sm text-emerald-700">{success}</p>}
                <Button fullWidth className="mt-4" onClick={submitOffer} disabled={sending}>
                  إرسال العرض
                </Button>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </>
  );
}
