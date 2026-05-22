"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  REPORT_TYPE_OPTIONS,
  submitReport,
  type ReportType,
} from "@/services/reporting";

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
  const [reportType, setReportType] = useState<ReportType>("Other");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("أدخل العنوان والوصف");
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
      setError(err instanceof Error ? err.message : "فشل إرسال البلاغ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-bold text-slate-900">الإبلاغ عن المحادثة</h3>
        {done ? (
          <>
            <p className="text-emerald-700">تم إرسال البلاغ. سيتم مراجعته من الفريق.</p>
            <Button fullWidth className="mt-4" onClick={onClose}>
              إغلاق
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-600">نوع البلاغ</span>
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
              >
                {REPORT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <Input label="عنوان مختصر" value={title} onChange={(e) => setTitle(e.target.value)} />
            <label className="block text-sm">
              <span className="font-medium text-slate-600">التفاصيل</span>
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
                إلغاء
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? "جاري الإرسال..." : "إرسال البلاغ"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
