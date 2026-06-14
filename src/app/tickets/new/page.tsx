"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createTicket } from "@/services/ticketing";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";

const TICKET_CATEGORIES = ["general", "technical", "payment", "transport", "auction"] as const;

export default function NewTicketPage() {
  const { t } = useI18n();
  const { requireAuth } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!requireAuth()) return null;

  async function submit() {
    if (!subject.trim()) {
      setError(t("tickets.new.enterSubject"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const ticket = await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        category,
      });
      router.push(`/tickets/${ticket.ticketId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("tickets.new.createFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title={t("tickets.new.title")} backHref="/tickets" />
      <PageContainer narrow className="py-8">
        <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <Input
            label={t("tickets.new.subject")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{t("tickets.new.category")}</span>
            <select
              className="rounded-xl border border-gray-200 px-3 py-2.5"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {t(`tickets.categories.${cat}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{t("tickets.new.details")}</span>
            <textarea
              className="min-h-[120px] rounded-xl border border-gray-200 px-3 py-2.5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("tickets.new.detailsPlaceholder")}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button fullWidth onClick={submit} disabled={saving}>
            {saving ? t("common.sending") : t("tickets.new.submit")}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
