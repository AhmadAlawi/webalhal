import type { ApiEnvelope } from "@/types";

/** يفكّ غلاف/أغلفة API المتداخلة حتى الوصول للحمولة الفعلية */
export function unwrapEnvelopeData<T = Record<string, unknown>>(
  body: unknown,
  maxDepth = 8,
): T {
  let node: unknown = body;

  for (let i = 0; i < maxDepth; i++) {
    if (node == null || typeof node !== "object") break;

    const o = node as Record<string, unknown>;

    if (hasPayloadFields(o)) {
      return o as T;
    }

    const inner = o.data;
    if (inner != null && typeof inner === "object") {
      node = inner;
      continue;
    }

    break;
  }

  return (node ?? {}) as T;
}

function hasPayloadFields(o: Record<string, unknown>): boolean {
  return (
    typeof o.accessToken === "string" ||
    typeof o.userId === "number" ||
    typeof o.registrationId === "string" ||
    (!("success" in o) && !("data" in o) && Object.keys(o).length > 0)
  );
}

export function isApiEnvelope(value: unknown): value is ApiEnvelope {
  return (
    value != null &&
    typeof value === "object" &&
    "success" in value &&
    "data" in value
  );
}
