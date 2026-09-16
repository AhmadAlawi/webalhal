"use client";

import { useEffect, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getPendingRatings, submitRating, type PendingRatingItem } from "@/services/ratings";
import { useI18n } from "@/context/I18nContext";

/**
 * Shows after a deal conversation closes: lets the current user rate every
 * counterparty the backend says is still pending for this context (works for
 * both the no-transport and in-app-transporter completion paths).
 */
export function PendingRatingCard({
  contextType,
  contextId,
}: {
  contextType: string;
  contextId: number;
}) {
  const { t } = useI18n();
  const [pending, setPending] = useState<PendingRatingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingByUser, setRatingByUser] = useState<Record<number, number>>({});
  const [commentByUser, setCommentByUser] = useState<Record<number, string>>({});
  const [submittingUserId, setSubmittingUserId] = useState<number | null>(null);
  const [doneUserIds, setDoneUserIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPendingRatings(contextType, contextId)
      .then((res) => {
        if (!cancelled) setPending(res.pending);
      })
      .catch(() => {
        if (!cancelled) setPending([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contextType, contextId]);

  const remaining = pending.filter((p) => !doneUserIds.has(p.givenToUserId));

  if (loading || remaining.length === 0) return null;

  async function handleSubmit(item: PendingRatingItem) {
    const rating = ratingByUser[item.givenToUserId] ?? 0;
    if (rating < 1) return;
    setSubmittingUserId(item.givenToUserId);
    setError(null);
    try {
      await submitRating({
        contextType,
        contextId,
        givenToUserId: item.givenToUserId,
        rating,
        comment: commentByUser[item.givenToUserId]?.trim() || undefined,
        ratingCategory: item.suggestedCategory,
      });
      setDoneUserIds((prev) => new Set(prev).add(item.givenToUserId));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("chat.rating.submitFailed"));
    } finally {
      setSubmittingUserId(null);
    }
  }

  return (
    <div className="mx-auto mb-4 w-full max-w-3xl px-4">
      <div className="card space-y-4 border border-amber-200 bg-amber-50/60 p-4">
        <p className="text-center text-sm font-semibold text-amber-900">
          {t("chat.rating.prompt")}
        </p>
        {remaining.map((item) => {
          const rating = ratingByUser[item.givenToUserId] ?? 0;
          return (
            <div key={item.givenToUserId} className="rounded-lg bg-white p-3 shadow-sm">
              <p className="mb-2 text-sm font-medium text-slate-800">
                {item.givenToName || `#${item.givenToUserId}`}
              </p>
              <div className="mb-2 flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setRatingByUser((prev) => ({ ...prev, [item.givenToUserId]: n }))
                    }
                    aria-label={String(n)}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <input
                value={commentByUser[item.givenToUserId] ?? ""}
                onChange={(e) =>
                  setCommentByUser((prev) => ({ ...prev, [item.givenToUserId]: e.target.value }))
                }
                placeholder={t("chat.rating.commentPlaceholder")}
                className="input-field mb-2 w-full text-sm"
              />
              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={rating < 1 || submittingUserId === item.givenToUserId}
                onClick={() => handleSubmit(item)}
              >
                {submittingUserId === item.givenToUserId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("chat.rating.submit")
                )}
              </Button>
            </div>
          );
        })}
        {error && <p className="text-center text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
