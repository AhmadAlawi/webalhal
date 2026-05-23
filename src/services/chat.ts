import { apiGet, apiPost } from "@/lib/api";
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

export async function getConversations() {
  const data = await apiGet<Conversation[] | { items: Conversation[] }>(
    API.chat.conversations,
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getConversation(conversationId: number) {
  return apiGet<ConversationDetail>(API.chat.conversation(conversationId));
}

export async function getMessages(conversationId: number) {
  const data = await apiGet<unknown>(API.chat.messages(conversationId));
  return Array.isArray(data) ? data : (data as { items?: unknown[] })?.items ?? [];
}

export async function sendMessage(
  conversationId: number,
  body: { content: string; senderUserId: number },
) {
  return apiPost(API.chat.messages(conversationId), body);
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
