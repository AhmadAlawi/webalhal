import { apiGet, apiPost } from "@/lib/api";
import { asApiList } from "@/lib/api-list";
import { API } from "@/lib/api-endpoints";
import type { Conversation } from "@/types";

export interface ConversationDetail extends Conversation {
  buyerUserId?: number;
  sellerUserId?: number;
  otherUserId?: number;
  orderType?: string;
  orderId?: number;
  contextType?: string;
  contextId?: number;
  farmCityId?: number;
  farmGovernorateId?: number;
  farmCity?: string;
  farmGovernorate?: string;
  transportRequestId?: number;
  transportStatus?: string;
}

const CONTEXT_LABELS: Record<string, string> = {
  order: "طلب بيع مباشر",
  direct: "بيع مباشر",
  auction: "مزاد",
  tender: "مناقصة",
  tender_offer: "عرض مناقصة",
  transport_delivery: "نقل",
};

function contextTitle(raw: Record<string, unknown>): string | undefined {
  const type = String(
    raw.contextType ?? raw.ContextType ?? raw.orderType ?? raw.OrderType ?? "",
  ).toLowerCase();
  const ctxId = raw.contextId ?? raw.ContextId ?? raw.orderId ?? raw.OrderId;
  const label = CONTEXT_LABELS[type];
  if (label && ctxId != null) return `${label} #${ctxId}`;
  if (label) return label;
  return undefined;
}

function normalizeConversation(raw: unknown): Conversation | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = Number(
    r.conversationId ??
      r.ConversationId ??
      r.chatConversationId ??
      r.id ??
      r.Id,
  );
  if (!Number.isFinite(id) || id <= 0) return null;

  const lastMsg = r.lastMessage;
  const lastFromNested =
    lastMsg && typeof lastMsg === "object"
      ? String((lastMsg as Record<string, unknown>).body ?? "")
      : "";

  return {
    conversationId: id,
    title: (r.title ??
      r.Title ??
      r.otherPartyName ??
      r.OtherPartyName ??
      contextTitle(r)) as string | undefined,
    lastMessage: String(
      r.lastMessageBody ??
        r.LastMessageBody ??
        (lastFromNested || undefined) ??
        r.lastMessage ??
        r.LastMessage ??
        r.lastMessagePreview ??
        r.LastMessagePreview ??
        "",
    ).trim() || undefined,
    lastMessageAt: (r.lastMessageAt ?? r.LastMessageAt) as string | undefined,
    unreadCount: Number(r.unreadCount ?? r.UnreadCount ?? 0) || undefined,
    contextType: (r.contextType ?? r.ContextType ?? r.orderType ?? r.OrderType) as
      | string
      | undefined,
    contextId: Number(r.contextId ?? r.ContextId ?? r.orderId ?? r.OrderId) || undefined,
  };
}

async function fetchConversationList(path: string): Promise<Conversation[]> {
  const data = await apiGet<unknown>(path);
  return asApiList(data)
    .map(normalizeConversation)
    .filter((c): c is Conversation => c != null);
}

export async function getConversations(userId?: number) {
  const baseQs =
    userId != null
      ? `userId=${encodeURIComponent(String(userId))}&page=1&pageSize=50`
      : "page=1&pageSize=50";

  const paths = [
    `/api/Chat/conversations/summaries?${baseQs}`,
    `${API.chat.conversations}?${baseQs}`,
    `/api/Chat/conversations?${baseQs}`,
  ];

  for (const path of paths) {
    try {
      const list = await fetchConversationList(path);
      if (list.length) return list;
    } catch {
      /* next */
    }
  }
  return [];
}

export async function getConversation(conversationId: number) {
  const raw = await apiGet<ConversationDetail>(API.chat.conversation(conversationId));
  const normalized = normalizeConversation(raw);
  return { ...raw, ...normalized } as ConversationDetail;
}

export async function getMessages(conversationId: number) {
  const data = await apiGet<unknown>(API.chat.messages(conversationId));
  const list = asApiList(data);
  return list.map((m) => {
    const r = m as Record<string, unknown>;
    return {
      messageId: Number(r.messageId ?? r.MessageId ?? r.id),
      content: String(r.body ?? r.Body ?? r.content ?? r.Content ?? ""),
      senderUserId: Number(r.senderUserId ?? r.SenderUserId),
      createdAt: (r.createdAt ?? r.CreatedAt) as string | undefined,
    };
  });
}

export async function sendMessage(
  conversationId: number,
  body: { content: string; senderUserId: number },
) {
  return apiPost(API.chat.messages(conversationId), {
    conversationId,
    senderUserId: body.senderUserId,
    body: body.content,
  });
}

export async function transportDeliver(conversationId: number) {
  return apiPost(API.chat.transportDeliver(conversationId), {});
}

export async function transportReceived(conversationId: number) {
  return apiPost(API.chat.transportReceived(conversationId), {});
}

export function parseConversationIdFromOpen(res: unknown): number | undefined {
  const r = res as Record<string, unknown>;
  const inner = (r?.data as Record<string, unknown>)?.data ?? r?.data ?? r;
  const obj = inner as Record<string, unknown>;
  const id =
    obj?.conversationId ??
    obj?.chatConversationId ??
    obj?.chatId ??
    obj?.ChatId ??
    (obj?.conversation as Record<string, unknown>)?.conversationId ??
    (obj?.conversation as Record<string, unknown>)?.id ??
    obj?.id;
  const n = Number(id);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

/** POST /api/Chat/conversations/open أو /api/Chat/open/order/{orderId} */
export async function openConversation(
  contextType: string,
  contextId: number,
  opts?: { buyerUserId?: number; sellerUserId?: number },
) {
  if (contextType === "order") {
    const sp = new URLSearchParams();
    if (opts?.buyerUserId) sp.set("buyerUserId", String(opts.buyerUserId));
    if (opts?.sellerUserId) sp.set("sellerUserId", String(opts.sellerUserId));
    const qs = sp.toString() ? `?${sp}` : "";
    return apiPost<unknown>(`${API.chat.openOrder(contextId)}${qs}`, {});
  }

  return apiPost<unknown>(API.chat.open, {
    contextType,
    contextId,
    buyerUserId: opts?.buyerUserId,
    sellerUserId: opts?.sellerUserId,
  });
}
