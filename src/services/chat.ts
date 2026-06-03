import { apiGet, apiPost } from "@/lib/api";
import { asApiList } from "@/lib/api-list";
import { API } from "@/lib/api-endpoints";
import type { Conversation } from "@/types";

export interface LinkedConversation {
  conversationId: number;
  contextType?: string;
  contextId?: number;
  relation?: string;
  tenderId?: number;
}

export interface ConversationDetail extends Conversation {
  buyerUserId?: number;
  sellerUserId?: number;
  otherUserId?: number;
  orderType?: string;
  orderId?: number;
  contextType?: string;
  contextId?: number;
  tenderId?: number;
  farmCityId?: number;
  farmGovernorateId?: number;
  farmCity?: string;
  farmGovernorate?: string;
  transportRequestId?: number;
  transportStatus?: string;
  transportAssigned?: boolean;
  currentUserRole?: string;
  status?: string;
  linkedConversations?: LinkedConversation[];
}

const CONTEXT_LABELS: Record<string, string> = {
  order: "طلب بيع مباشر",
  direct: "بيع مباشر",
  auction: "مزاد",
  tender: "مناقصة",
  tender_offer: "عرض مناقصة",
  transport_delivery: "تسليم",
  transport_pickup: "استلام",
};

const LINK_RELATION_LABELS: Record<string, string> = {
  main_deal: "المحادثة الرئيسية",
  pickup_handoff: "استلام الشحنة",
  delivery_handoff: "تسليم الشحنة",
};

export function linkedConversationLabel(link: LinkedConversation): string {
  if (link.relation && LINK_RELATION_LABELS[link.relation]) {
    return LINK_RELATION_LABELS[link.relation];
  }
  const type = link.contextType?.toLowerCase() ?? "";
  if (CONTEXT_LABELS[type]) return CONTEXT_LABELS[type];
  return `محادثة #${link.conversationId}`;
}

function parseLinkedConversations(raw: unknown): LinkedConversation[] {
  if (!Array.isArray(raw)) return [];
  const out: LinkedConversation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const conversationId = Number(r.conversationId ?? r.ConversationId);
    if (!Number.isFinite(conversationId) || conversationId <= 0) continue;
    out.push({
      conversationId,
      contextType: (r.contextType ?? r.ContextType) as string | undefined,
      contextId: Number(r.contextId ?? r.ContextId) || undefined,
      relation: (r.relation ?? r.Relation) as string | undefined,
      tenderId: Number(r.tenderId ?? r.TenderId) || undefined,
    });
  }
  return out;
}

export function hasTransportLinkedChats(links?: LinkedConversation[]): boolean {
  return (links ?? []).some(
    (l) =>
      l.relation === "pickup_handoff" ||
      l.relation === "delivery_handoff" ||
      l.contextType === "transport_pickup" ||
      l.contextType === "transport_delivery",
  );
}

export function isTransportHandoffChat(conv: ConversationDetail | null): boolean {
  if (!conv) return false;
  const type = (conv.contextType ?? conv.orderType ?? "").toLowerCase();
  return type === "transport_pickup" || type === "transport_delivery";
}

export type DealUserRole = "buyer" | "seller" | "unknown";

export function resolveDealUserRole(
  conv: ConversationDetail | null,
  userId?: number,
): DealUserRole {
  const fromApi = conv?.currentUserRole?.toLowerCase();
  if (fromApi === "buyer" || fromApi === "seller") return fromApi;
  if (!userId || !conv) return "unknown";
  if (conv.buyerUserId === userId) return "buyer";
  if (conv.sellerUserId === userId) return "seller";
  return "unknown";
}

export function isPickupHandoffLink(link: LinkedConversation): boolean {
  return (
    link.relation === "pickup_handoff" || link.contextType === "transport_pickup"
  );
}

export function isDeliveryHandoffLink(link: LinkedConversation): boolean {
  return (
    link.relation === "delivery_handoff" ||
    link.contextType === "transport_delivery"
  );
}

/** استلام الشحنة → البائع فقط | تسليم الشحنة → المشتري فقط */
export function canUserAccessLinkedChat(
  link: LinkedConversation,
  role: DealUserRole,
): boolean {
  if (isPickupHandoffLink(link)) return role === "seller";
  if (isDeliveryHandoffLink(link)) return role === "buyer";
  return true;
}

export function filterLinkedConversationsForRole(
  links: LinkedConversation[],
  role: DealUserRole,
): LinkedConversation[] {
  return links.filter((l) => canUserAccessLinkedChat(l, role));
}

export function canUserAccessConversation(
  conv: ConversationDetail | null,
  role: DealUserRole,
): boolean {
  if (!conv || !isTransportHandoffChat(conv)) return true;
  const type = (conv.contextType ?? conv.orderType ?? "").toLowerCase();
  if (type === "transport_pickup") return role === "seller";
  if (type === "transport_delivery") return role === "buyer";
  return true;
}

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

export async function getChatUnreadCount(userId?: number): Promise<number> {
  try {
    const list = await getConversations(userId);
    return list.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
  } catch {
    return 0;
  }
}

export async function getConversation(conversationId: number) {
  const raw = await apiGet<unknown>(API.chat.conversation(conversationId));
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const normalized = normalizeConversation(raw);
  const linked = parseLinkedConversations(
    r.linkedConversations ?? r.LinkedConversations,
  );

  return {
    ...r,
    ...normalized,
    buyerUserId: Number(r.buyerUserId ?? r.BuyerUserId) || undefined,
    sellerUserId: Number(r.sellerUserId ?? r.SellerUserId) || undefined,
    tenderId: Number(r.tenderId ?? r.TenderId) || undefined,
    transportAssigned: Boolean(r.transportAssigned ?? r.TransportAssigned),
    transportRequestId:
      Number(r.transportRequestId ?? r.TransportRequestId) || undefined,
    transportStatus: (r.transportStatus ?? r.TransportStatus) as string | undefined,
    farmCity: (r.farmCity ?? r.FarmCity) as string | undefined,
    farmGovernorate: (r.farmGovernorate ?? r.FarmGovernorate) as string | undefined,
    currentUserRole: (r.currentUserRole ?? r.CurrentUserRole) as string | undefined,
    status: (r.status ?? r.Status) as string | undefined,
    linkedConversations: linked,
  } as ConversationDetail;
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
