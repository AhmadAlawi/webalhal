"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ticket, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getMyTickets } from "@/services/ticketing";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import type { SupportTicket } from "@/types/ticket";

export default function TicketsPage() {
  const { t, language } = useI18n();
  const { requireAuth } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = language === "ar" ? "ar-SY" : "en-US";

  useEffect(() => {
    if (!requireAuth()) return;
    getMyTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [requireAuth]);

  return (
    <>
      <PageHeader title={t("tickets.title")} backHref="/account" />
      <PageContainer className="py-8">
        <div className="mb-6 flex justify-end">
          <Link href="/tickets/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t("tickets.newTicket")}
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 skeleton-shimmer rounded-2xl" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title={t("tickets.noTickets")}
            description={t("tickets.noTicketsDesc")}
            action={
              <Link href="/tickets/new">
                <Button>{t("tickets.newTicket")}</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {tickets.map((ticket) => (
              <li key={ticket.ticketId}>
                <Link
                  href={`/tickets/${ticket.ticketId}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {ticket.subject ||
                        ticket.title ||
                        t("tickets.ticketFallback", undefined, { id: ticket.ticketId })}
                    </p>
                    {ticket.createdAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(ticket.createdAt).toLocaleString(dateLocale)}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={ticket.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
