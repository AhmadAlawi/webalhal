"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createTicket } from "@/services/ticketing";
import { useAuth } from "@/context/AuthContext";

export default function NewTicketPage() {
  const { requireAuth } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!requireAuth()) return null;

  async function submit() {
    if (!subject.trim()) {
      setError("أدخل عنوان التذكرة");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const t = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
      });
      router.push(`/tickets/${t.ticketId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء التذكرة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="تذكرة دعم جديدة" backHref="/tickets" />
      <PageContainer narrow className="py-8">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <Input label="الموضوع" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">التصنيف</span>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2.5"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">عام</option>
              <option value="technical">تقني</option>
              <option value="payment">دفع</option>
              <option value="transport">نقل</option>
              <option value="auction">مزاد</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">التفاصيل</span>
            <textarea
              className="min-h-[120px] rounded-xl border border-gray-200 px-3 py-2.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة بالتفصيل..."
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={submit} disabled={saving}>
            {saving ? "جاري الإرسال..." : "إرسال التذكرة"}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
