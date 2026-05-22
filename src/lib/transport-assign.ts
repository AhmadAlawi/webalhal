import { ApiClientError } from "@/lib/api";
import {
  assignTransport,
  findBuyerTransportForDeal,
} from "@/services/transport";
import type {
  AssignTransportPayload,
  AssignTransportResult,
  TransportRequestDetail,
} from "@/types/transport";

const ALREADY_ASSIGNED_RE =
  /already assigned|مُعيَّن|معين|assigned for this deal/i;

function isAlreadyAssignedError(err: ApiClientError): boolean {
  return (
    err.status === 400 &&
    (ALREADY_ASSIGNED_RE.test(err.message) ||
      err.code === "transport_already_assigned" ||
      err.code === "TransportAlreadyAssigned")
  );
}

function isAssignedStatus(req?: TransportRequestDetail | null): boolean {
  const s = req?.status?.toLowerCase();
  return s === "assigned" || s === "completed";
}

/**
 * تعيين ناقل مع التعامل مع حالة النجاح الجزئي:
 * التعيين يُحفظ في DB ثم يفشل خطوة لاحقة (شات) فيُرجع 500.
 */
export async function assignTransportWithRecovery(
  payload: AssignTransportPayload,
): Promise<AssignTransportResult> {
  try {
    const data = await assignTransport(payload);
    return {
      success: true,
      request: normalizeRequest(data),
      message: "تم تعيين الناقل بنجاح",
    };
  } catch (err) {
    if (!(err instanceof ApiClientError)) {
      return { success: false, message: "فشل تعيين الناقل" };
    }

    const shouldVerify =
      err.status >= 500 || isAlreadyAssignedError(err);

    if (shouldVerify) {
      const existing = await findBuyerTransportForDeal(
        payload.orderType,
        payload.orderId,
      ).catch(() => null);

      if (isAssignedStatus(existing)) {
        return {
          success: true,
          request: existing ?? undefined,
          recoveredFromServerError: err.status >= 500,
          message:
            err.status >= 500
              ? "تم تعيين الناقل. حدث خطأ أثناء فتح محادثات التسليم — يمكنك تحديث الصفحة أو متابعة من طلبات النقل."
              : "الناقل مُعيَّن مسبقاً لهذه الصفقة.",
        };
      }
    }

    if (isAlreadyAssignedError(err)) {
      return {
        success: false,
        message:
          "النقل مُعيَّن مسبقاً لهذه الصفقة. لا يمكن اختيار خط سعر آخر — راجع طلب النقل الحالي.",
      };
    }

    return {
      success: false,
      message: err.message || "فشل تعيين الناقل",
    };
  }
}

function normalizeRequest(data: unknown): TransportRequestDetail | undefined {
  if (!data || typeof data !== "object") return undefined;
  const d = data as Record<string, unknown>;
  const requestId = (d.requestId ?? d.RequestId) as number | undefined;
  if (!requestId) return undefined;
  return {
    requestId,
    status: (d.status ?? d.Status) as string | undefined,
    orderType: (d.orderType ?? d.OrderType) as string | undefined,
    orderId: (d.orderId ?? d.OrderId) as number | undefined,
    agreedPrice: (d.agreedPrice ?? d.AgreedPrice) as number | undefined,
    assignedTransportProviderId: (d.assignedTransportProviderId ??
      d.AssignedTransportProviderId) as number | undefined,
  };
}
