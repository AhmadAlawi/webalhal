import { apiGet, apiPost } from "@/lib/api";
import type { SupportTicket, TicketMessage } from "@/types/ticket";

function asArray<T>(data: T[] | { items?: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.items ?? [];
}

export async function getMyTickets() {
  const data = await apiGet<SupportTicket[] | { items?: SupportTicket[] }>(
    "/api/ticketing/tickets",
  );
  return asArray(data);
}

export async function getTicket(ticketId: number) {
  return apiGet<SupportTicket>(`/api/ticketing/tickets/${ticketId}`);
}

export async function createTicket(body: {
  subject: string;
  description?: string;
  category?: string;
  priority?: string;
}) {
  return apiPost<SupportTicket>("/api/ticketing/tickets", {
    title: body.subject,
    subject: body.subject,
    description: body.description,
    category: body.category ?? "general",
    priority: body.priority ?? "normal",
  });
}

export async function getTicketMessages(ticketId: number) {
  try {
    const data = await apiGet<TicketMessage[] | { items?: TicketMessage[] }>(
      `/api/ticketing/tickets/${ticketId}/messages`,
    );
    return asArray(data);
  } catch {
    return [] as TicketMessage[];
  }
}

export async function sendTicketMessage(ticketId: number, content: string) {
  return apiPost(`/api/ticketing/tickets/${ticketId}/messages`, { content });
}
