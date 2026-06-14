"use client";

import { useState } from "react";
import { PackageCheck, PackageOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { transportDeliver, transportReceived } from "@/services/chat";
import { useI18n } from "@/context/I18nContext";

export function TransportHandoffBar({
  conversationId,
  transportStatus,
}: {
  conversationId: number;
  transportStatus?: string;
}) {
  const { t } = useI18n();
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
      setMessage(t("transport.handoff.deliverConfirmed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.handoff.deliverFailed"));
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
      setMessage(t("transport.handoff.receiveConfirmed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("transport.handoff.receiveFailed"));
    } finally {
      setLoading(null);
    }
  }

  if (status === "completed" || status === "delivered") {
    return (
      <div className="border-b border-emerald-100 bg-emerald-50/60 px-4 py-3 text-center text-sm text-emerald-800">
        {t("transport.handoff.completed")}
      </div>
    );
  }

  return (
    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
      <p className="mb-2 text-center text-xs font-medium text-slate-600">
        {t("transport.handoff.confirmHandoff")}
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
          {t("transport.handoff.deliver")}
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
          {t("transport.handoff.receive")}
        </Button>
      </div>
      {message && <p className="mt-2 text-center text-xs text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
