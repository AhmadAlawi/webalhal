"use client";

import { useState } from "react";
import { PackageCheck, PackageOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { transportDeliver, transportReceived } from "@/services/chat";

export function TransportHandoffBar({
  conversationId,
  transportStatus,
}: {
  conversationId: number;
  transportStatus?: string;
}) {
  const [loading, setLoading] = useState<"deliver" | "receive" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = transportStatus?.toLowerCase() ?? "";

  async function handleDeliver() {
    setLoading("deliver");
    setError(null);
    setMessage(null);
    try {
      await transportDeliver(conversationId);
      setMessage("تم تأكيد التسليم للناقل / المشتري");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تأكيد التسليم");
    } finally {
      setLoading(null);
    }
  }

  async function handleReceived() {
    setLoading("receive");
    setError(null);
    setMessage(null);
    try {
      await transportReceived(conversationId);
      setMessage("تم تأكيد استلام الشحنة");
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل تأكيد الاستلام");
    } finally {
      setLoading(null);
    }
  }

  if (status === "completed" || status === "delivered") {
    return (
      <div className="border-b border-emerald-100 bg-emerald-50/60 px-4 py-3 text-center text-sm text-emerald-800">
        اكتملت عملية النقل لهذه المحادثة
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
      <p className="mb-2 text-center text-xs font-medium text-slate-600">
        تأكيد تسليم / استلام الشحنة
      </p>
      <div className="mx-auto flex max-w-lg gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={loading != null}
          onClick={handleDeliver}
        >
          {loading === "deliver" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PackageOpen className="h-4 w-4" />
          )}
          تسليم
        </Button>
        <Button
          type="button"
          size="sm"
          className="flex-1"
          disabled={loading != null}
          onClick={handleReceived}
        >
          {loading === "receive" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <PackageCheck className="h-4 w-4" />
          )}
          استلام
        </Button>
      </div>
      {message && <p className="mt-2 text-center text-xs text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
