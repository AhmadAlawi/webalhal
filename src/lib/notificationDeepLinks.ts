/**
 * توحيد روابط الإشعارات بين الويب والتطبيق (تجنب 404).
 */
export function resolveNotificationDeepLink(action?: string | null): string | null {
  if (!action?.trim()) return null;

  const raw = action.trim();

  if (raw.startsWith("/")) {
    return normalizeWebPath(raw);
  }

  const id = raw.match(/\d+/)?.[0];
  if (!id) return null;

  const lower = raw.toLowerCase();

  if (lower.includes("auction")) return `/auctions/${id}`;
  if (lower.includes("tender")) return `/tenders/${id}`;
  if (lower.includes("chat") || lower.includes("conversation")) return `/chat/${id}`;

  if (lower.includes("transport")) {
    if (lower.includes("inbox") || lower.includes("provider") || lower.includes("transporter")) {
      return `/transport/inbox/${id}`;
    }
    if (lower.includes("buyer") || lower.includes("request")) {
      return `/transport/requests/${id}`;
    }
    return `/transport/requests/${id}`;
  }

  if (lower.includes("direct") && (lower.includes("order") || lower.includes("orders"))) {
    return `/orders/direct/${id}`;
  }
  if (lower.includes("listing")) return `/direct/${id}/buy`;
  if (lower.includes("direct")) return `/direct/${id}/buy`;

  if (lower.includes("farm")) return `/farms/${id}`;
  if (lower.includes("notification")) return "/notifications";

  return null;
}

function normalizeWebPath(path: string): string | null {
  const p = path.split("?")[0];

  const transportRequest = p.match(/^\/transport-requests\/(\d+)\/?$/i);
  if (transportRequest) return `/transport/requests/${transportRequest[1]}`;

  const transportInbox = p.match(/^\/transport\/provider\/(\d+)\/?$/i);
  if (transportInbox) return `/transport/inbox/${transportInbox[1]}`;

  if (p.match(/^\/direct\/orders\/?$/i)) return "/orders/direct";
  const listing = p.match(/^\/listings\/(\d+)\/?$/i);
  if (listing) return `/direct/${listing[1]}/buy`;

  if (p.startsWith("/transport/") || p.startsWith("/auctions/") || p.startsWith("/tenders/")) {
    return p;
  }

  return p;
}
