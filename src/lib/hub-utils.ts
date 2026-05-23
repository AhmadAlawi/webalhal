import * as signalR from "@microsoft/signalr";

const HUB_CONNECT_TIMEOUT_MS = 20_000;

export async function waitForHubConnected(
  conn: signalR.HubConnection,
  timeoutMs = HUB_CONNECT_TIMEOUT_MS,
): Promise<void> {
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }

  const deadline = Date.now() + timeoutMs;
  const connected = signalR.HubConnectionState.Connected;
  for (;;) {
    const state = conn.state;
    if (state === connected) return;
    if (Date.now() > deadline) {
      throw new Error("انتهت مهلة الاتصال بالخادم الحي");
    }
    await new Promise((r) => setTimeout(r, 50));
  }
}

export async function invokeHubWhenConnected(
  conn: signalR.HubConnection,
  method: string,
  ...args: unknown[]
): Promise<unknown> {
  await waitForHubConnected(conn);
  return conn.invoke(method, ...args);
}

/** ترجمة أخطاء Hub (مزاد / شات) إلى رسائل عربية */
export function parseHubError(err: unknown): string {
  if (!err) return "حدث خطأ في الاتصال";

  let message = "";
  if (typeof err === "string") {
    message = err.trim().startsWith("{")
      ? (() => {
          try {
            const p = JSON.parse(err) as Record<string, unknown>;
            return String(p.message ?? p.title ?? p.detail ?? err);
          } catch {
            return err;
          }
        })()
      : err;
  } else if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    message = String(o.message ?? o.detail ?? o.title ?? "");
  }

  const lower = message.toLowerCase();
  if (
    lower.includes("government") ||
    lower.includes("سقف حكومي") ||
    lower.includes("لا يمكن تجاوز السقف")
  ) {
    return "لا يمكن تجاوز السقف الحكومي للسعر";
  }
  if (
    lower.includes("higher than") ||
    lower.includes("أعلى من السعر الحالي") ||
    lower.includes("يجب أن يكون المزايدة")
  ) {
    return "يجب أن تكون المزايدة أعلى من السعر الحالي للمزاد";
  }
  if (lower.includes("validation") || lower.includes("one or more")) {
    return "بيانات غير صالحة — تحقق من الحقول أو رمز الدعوة";
  }
  if (lower.includes("access") || lower.includes("private") || lower.includes("denied")) {
    return "لا يمكن الدخول — المزاد خاص أو غير مصرح لك";
  }

  return message || "حدث خطأ في الاتصال";
}

export interface NormalizedChatMessage {
  messageId?: number;
  content: string;
  senderUserId?: number;
  createdAt?: string;
}

export function normalizeChatHubMessage(
  raw: unknown,
  conversationId: number,
): NormalizedChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const root = raw as Record<string, unknown>;
  const candidate = (root.message ?? root.data ?? root) as Record<string, unknown>;

  const cid = Number(
    candidate.conversationId ?? root.conversationId ?? conversationId,
  );
  if (!Number.isFinite(cid) || cid !== conversationId) return null;

  const content = String(
    candidate.body ?? candidate.Body ?? candidate.text ?? candidate.content ?? "",
  ).trim();
  if (!content) return null;

  const messageId = Number(candidate.messageId ?? candidate.MessageId ?? candidate.id);
  const senderUserId = Number(
    candidate.senderUserId ?? candidate.SenderUserId ?? candidate.senderId,
  );

  return {
    messageId: Number.isFinite(messageId) ? messageId : undefined,
    content,
    senderUserId: Number.isFinite(senderUserId) ? senderUserId : undefined,
    createdAt: String(
      candidate.sentAt ?? candidate.SentAt ?? candidate.createdAt ?? candidate.CreatedAt ?? "",
    ) || undefined,
  };
}
