import { apiGet, apiPost } from "@/lib/api";
import { API } from "@/lib/api-endpoints";

export interface PendingRatingItem {
  givenToUserId: number;
  givenToRole?: string;
  givenToName?: string;
  suggestedCategory?: string;
}

export interface PendingRatings {
  contextType: string;
  contextId: number;
  transportIncluded: boolean;
  transportRequestId?: number;
  pending: PendingRatingItem[];
}

function normalizePendingItem(raw: unknown): PendingRatingItem | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const givenToUserId = Number(r.givenToUserId ?? r.GivenToUserId);
  if (!Number.isFinite(givenToUserId) || givenToUserId <= 0) return null;
  return {
    givenToUserId,
    givenToRole: (r.givenToRole ?? r.GivenToRole) as string | undefined,
    givenToName: (r.givenToName ?? r.GivenToName) as string | undefined,
    suggestedCategory: (r.suggestedCategory ?? r.SuggestedCategory) as string | undefined,
  };
}

/** Parties the current user can still rate for a completed deal. */
export async function getPendingRatings(
  contextType: string,
  contextId: number,
): Promise<PendingRatings> {
  const qs = new URLSearchParams({ contextType, contextId: String(contextId) });
  const data = await apiGet<unknown>(`${API.ratings.pending}?${qs}`);
  const r = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
  const pendingRaw = r.pending ?? r.Pending;
  return {
    contextType: String(r.contextType ?? r.ContextType ?? contextType),
    contextId: Number(r.contextId ?? r.ContextId ?? contextId),
    transportIncluded: Boolean(r.transportIncluded ?? r.TransportIncluded),
    transportRequestId:
      Number(r.transportRequestId ?? r.TransportRequestId) || undefined,
    pending: Array.isArray(pendingRaw)
      ? pendingRaw.map(normalizePendingItem).filter((p): p is PendingRatingItem => p != null)
      : [],
  };
}

export async function submitRating(input: {
  contextType: string;
  contextId: number;
  givenToUserId: number;
  rating: number;
  comment?: string;
  ratingCategory?: string;
}) {
  return apiPost(API.ratings.submit, {
    contextType: input.contextType,
    contextId: input.contextId,
    givenToUserId: input.givenToUserId,
    rating: input.rating,
    comment: input.comment,
    ratingCategory: input.ratingCategory,
  });
}
