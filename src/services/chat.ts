import { apiGet, apiPost } from "@/lib/api";
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
    "/api/Chat/conversations",
  );
  return Array.isArray(data) ? data : data?.items ?? [];
}

export async function getConversation(conversationId: number) {
  return apiGet<ConversationDetail>(
    `/api/Chat/conversations/${conversationId}`,
  );
}

export async function getMessages(conversationId: number) {
  const data = await apiGet<unknown>(`/api/Chat/conversations/${conversationId}/messages`);
  return Array.isArray(data) ? data : (data as { items?: unknown[] })?.items ?? [];
}

export async function sendMessage(
  conversationId: number,
  body: { content: string; senderUserId: number },
) {
  return apiPost(`/api/Chat/conversations/${conversationId}/messages`, body);
}

export async function transportDeliver(conversationId: number) {
  return apiPost(`/api/Chat/conversations/${conversationId}/transport-deliver`, {});
}

export async function transportReceived(conversationId: number) {
  return apiPost(`/api/Chat/conversations/${conversationId}/transport-received`, {});
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

/** فتح محادثة لسياق صفقة — مطابق للموبايل POST /api/chat/open/{type}/{id} */
export async function openConversation(
  contextType: string,
  contextId: number,
  opts?: { buyerUserId?: number; sellerUserId?: number },
) {
  const sp = new URLSearchParams();
  if (opts?.buyerUserId) sp.set("buyerUserId", String(opts.buyerUserId));
  if (opts?.sellerUserId) sp.set("sellerUserId", String(opts.sellerUserId));
  const qs = sp.toString() ? `?${sp}` : "";
  const data = await apiPost<unknown>(
    `/api/chat/open/${encodeURIComponent(contextType)}/${contextId}${qs}`,
    {},
  );
  return data;
}
