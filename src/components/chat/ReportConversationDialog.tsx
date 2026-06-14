"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  REPORT_TYPE_OPTIONS,
  submitReport,
  type ReportType,
} from "@/services/reporting";
import { useI18n } from "@/context/I18nContext";

export function ReportConversationDialog({
  conversationId,
  reporterUserId,
  reportedUserId,
  onClose,
}: {
  conversationId: number;
  reporterUserId: number;
  reportedUserId: number;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [reportType, setReportType] = useState<ReportType>("Other");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError(t("chat.reportDialog.enterTitleDescription"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await submitReport({
        conversationId,
        reportedByUserId: reporterUserId,
        reportedUserId,
        reportType,
        title: title.trim(),
        description: description.trim(),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("chat.reportDialog.submitFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-slate-900">{t("chat.reportDialog.title")}</h3>
        {done ? (
          <>
            <p className="text-emerald-700">{t("chat.reportDialog.submitted")}</p>
            <Button fullWidth className="mt-4" onClick={onClose}>
              {t("common.close")}
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-600">{t("chat.reportDialog.reportType")}</span>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                {REPORT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(`chat.reportTypes.${o.value}`, o.label)}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label={t("chat.reportDialog.shortTitle")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <label className="block text-sm">
              <span className="font-medium text-slate-600">{t("chat.reportDialog.details")}</span>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? t("common.sending") : t("chat.reportDialog.submitReport")}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
