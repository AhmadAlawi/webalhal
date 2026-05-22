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
import type { SupportTicket } from "@/types/ticket";

export default function TicketsPage() {
  const { requireAuth } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth()) return;
    getMyTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [requireAuth]);

  return (
    <>
      <PageHeader title="تذاكر الدعم" backHref="/account" />
      <PageContainer className="py-8">
        <div className="mb-6 flex justify-end">
          <Link href="/tickets/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              تذكرة جديدة
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
            title="لا توجد تذاكر"
            description="افتح تذكرة دعم وسنرد عليك في أقرب وقت"
            action={
              <Link href="/tickets/new">
                <Button>تذكرة جديدة</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {tickets.map((t) => (
              <li key={t.ticketId}>
                <Link
                  href={`/tickets/${t.ticketId}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-900">
                      {t.subject || t.title || `تذكرة #${t.ticketId}`}
                    </p>
                    {t.createdAt && (
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(t.createdAt).toLocaleString("ar-SY")}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={t.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
