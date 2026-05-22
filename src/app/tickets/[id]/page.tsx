"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getTicket, getTicketMessages, sendTicketMessage } from "@/services/ticketing";
import { useAuth } from "@/context/AuthContext";
import type { SupportTicket, TicketMessage } from "@/types/ticket";

export default function TicketDetailPage() {
  const { id } = useParams();
  const { user, requireAuth } = useAuth();
  const ticketId = Number(id);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = () => {
    getTicket(ticketId).then(setTicket).catch(() => setTicket(null));
    getTicketMessages(ticketId).then(setMessages).catch(() => setMessages([]));
  };

  useEffect(() => {
    if (!requireAuth() || !ticketId) return;
    load();
  }, [ticketId, requireAuth]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendTicketMessage(ticketId, text.trim());
      setText("");
      load();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader
        title={ticket?.subject || ticket?.title || `تذكرة #${id}`}
        backHref="/tickets"
      />
      <PageContainer className="py-6">
        {ticket && (
          <div className="mb-4 flex items-center gap-2">
            <StatusBadge status={ticket.status} />
            {ticket.createdAt && (
              <span className="text-xs text-slate-400">
                {new Date(ticket.createdAt).toLocaleString("ar-SY")}
              </span>
            )}
          </div>
        )}

        <ul className="mb-4 max-h-[50vh] space-y-2 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4">
          {messages.map((m, i) => (
            <li
              key={m.messageId ?? i}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                m.isStaff
                  ? "border border-gray-100 bg-slate-50"
                  : m.senderUserId === user?.userId
                    ? "ms-auto bg-emerald-600 text-white"
                    : "bg-slate-100"
              }`}
            >
              {m.senderName && !m.isStaff && m.senderUserId !== user?.userId && (
                <p className="mb-1 text-xs opacity-80">{m.senderName}</p>
              )}
              {m.content}
            </li>
          ))}
          {messages.length === 0 && (
            <li className="py-8 text-center text-sm text-slate-400">لا رسائل بعد</li>
          )}
        </ul>

        <form onSubmit={handleSend} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="رد على التذكرة..."
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5"
          />
          <Button type="submit" size="sm" disabled={sending}>
            إرسال
          </Button>
        </form>
      </PageContainer>
    </>
  );
}
