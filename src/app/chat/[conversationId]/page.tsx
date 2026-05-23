"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Flag, Truck } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import type { HubConnection } from "@microsoft/signalr";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { TransportAssignPanel } from "@/components/transport/TransportAssignPanel";
import { TransportHandoffBar } from "@/components/chat/TransportHandoffBar";
import { ReportConversationDialog } from "@/components/chat/ReportConversationDialog";
import { getConversation, getMessages, sendMessage } from "@/services/chat";
import type { ConversationDetail } from "@/services/chat";
import { startChatHub, stopChatHub } from "@/lib/signalr";
import type { NormalizedChatMessage } from "@/lib/hub-utils";
import { useAuth } from "@/context/AuthContext";

interface Message {
  messageId?: number;
  content: string;
  senderUserId?: number;
  createdAt?: string;
}

const DEAL_CONTEXT_TYPES = new Set(["auction", "tender", "direct", "tender_offer"]);

function resolveDealContext(conv: ConversationDetail | null) {
  if (!conv?.conversationId) return null;
  const orderType = conv.orderType ?? conv.contextType;
  const orderId = conv.orderId ?? conv.contextId;
  if (!orderType || orderId == null || !DEAL_CONTEXT_TYPES.has(orderType)) {
    return null;
  }
  return {
    conversationId: conv.conversationId,
    orderType,
    orderId,
    farmCityId: conv.farmCityId,
    farmGovernorateId: conv.farmGovernorateId,
  };
}

function appendMessage(prev: Message[], msg: Message): Message[] {
  if (msg.messageId != null && prev.some((m) => m.messageId === msg.messageId)) {
    return prev;
  }
  const last = prev[prev.length - 1];
  if (
    !msg.messageId &&
    last?.content === msg.content &&
    last?.senderUserId === msg.senderUserId
  ) {
    return prev;
  }
  return [...prev, msg];
}

function hubMsgToLocal(msg: NormalizedChatMessage): Message {
  return {
    messageId: msg.messageId,
    content: msg.content,
    senderUserId: msg.senderUserId,
    createdAt: msg.createdAt,
  };
}

export default function ChatConversationPage() {
  const { conversationId } = useParams();
  const { user, requireAuth } = useAuth();
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [hubReady, setHubReady] = useState(false);
  const [hubError, setHubError] = useState("");
  const [sending, setSending] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const connRef = useRef<HubConnection | null>(null);
  const convId = Number(conversationId);

  const dealContext = resolveDealContext(conversation);

  const reportedUserId =
    conversation?.otherUserId ??
    (user?.userId === conversation?.buyerUserId
      ? conversation?.sellerUserId
      : conversation?.buyerUserId) ??
    messages.find((m) => m.senderUserId && m.senderUserId !== user?.userId)?.senderUserId;

  const reloadMessages = useCallback(() => {
    if (!convId) return;
    getMessages(convId)
      .then((d) => setMessages(Array.isArray(d) ? (d as Message[]) : []))
      .catch(() => {});
  }, [convId]);

  const onHubMessage = useCallback((msg: NormalizedChatMessage) => {
    setMessages((prev) => appendMessage(prev, hubMsgToLocal(msg)));
  }, []);

  useEffect(() => {
    if (!requireAuth() || !convId) return;

    let cancelled = false;

    getConversation(convId)
      .then((c) => {
        if (!cancelled) setConversation(c);
      })
      .catch(() => {
        if (!cancelled) setConversation(null);
      });

    reloadMessages();

    startChatHub(convId, {
      onMessage: onHubMessage,
      onConversationUpdated: reloadMessages,
    })
      .then((conn) => {
        if (cancelled) {
          void stopChatHub(conn, convId);
          return;
        }
        connRef.current = conn;
        setHubReady(true);
        setHubError("");
      })
      .catch(() => {
        if (!cancelled) {
          setHubReady(false);
          setHubError("تعذر الاتصال الحي — الرسائل تُرسل عبر الخادم");
        }
      });

    return () => {
      cancelled = true;
      setHubReady(false);
      void stopChatHub(connRef.current, convId);
      connRef.current = null;
    };
  }, [convId, requireAuth, onHubMessage, reloadMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user?.userId || sending) return;
    const content = text.trim();
    setSending(true);
    setText("");

    const deliverViaHttp = async () => {
      await sendMessage(convId, { content, senderUserId: user.userId });
      setMessages((prev) =>
        appendMessage(prev, {
          messageId: Date.now(),
          content,
          senderUserId: user.userId,
          createdAt: new Date().toISOString(),
        }),
      );
    };

    try {
      const conn = connRef.current;
      if (conn?.state === signalR.HubConnectionState.Connected) {
        try {
          await conn.invoke("SendMessage", {
            conversationId: convId,
            senderUserId: user.userId,
            body: content,
          });
        } catch {
          await deliverViaHttp();
        }
      } else {
        await deliverViaHttp();
      }
    } catch {
      setText(content);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <PageHeader title={conversation?.title ?? "محادثة"} backHref="/chat" />

      <div className="flex flex-wrap gap-2 border-b border-gray-100 bg-white px-4 py-2">
        {dealContext && (
          <Link
            href={`/transport/flow?conversationId=${convId}&orderType=${dealContext.orderType}&orderId=${dealContext.orderId}`}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
          >
            <Truck className="h-3.5 w-3.5" />
            إدارة النقل (كامل)
          </Link>
        )}
        {user?.userId && reportedUserId && (
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            <Flag className="h-3.5 w-3.5" />
            إبلاغ
          </button>
        )}
      </div>

      {dealContext && <TransportAssignPanel deal={dealContext} />}

      {(conversation?.transportRequestId ||
        conversation?.transportStatus ||
        conversation?.orderType?.includes("transport")) && (
        <TransportHandoffBar
          conversationId={convId}
          transportStatus={conversation?.transportStatus}
        />
      )}

      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
        <section
          className="card flex flex-col overflow-hidden"
          style={{ minHeight: "calc(100vh - 14rem)", maxHeight: "calc(100vh - 10rem)" }}
        >
          {!hubReady && (
            <p className="border-b border-slate-100 bg-slate-50 px-4 py-2 text-center text-xs text-slate-500">
              {hubError || "جاري الاتصال بالمحادثة الحية..."}
            </p>
          )}
          <ul className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-4 py-6">
            {messages.length === 0 && (
              <li className="py-12 text-center text-sm text-slate-400">لا رسائل بعد — ابدأ المحادثة</li>
            )}
            {messages.map((m, i) => (
              <li
                key={m.messageId ?? `${m.createdAt}-${i}`}
                className={`max-w-[85%] px-4 py-2.5 text-sm shadow-sm ${
                  m.senderUserId === user?.userId
                    ? "chat-bubble-me ms-auto"
                    : "chat-bubble-other"
                }`}
              >
                {m.content}
              </li>
            ))}
          </ul>
          <form onSubmit={handleSend} className="flex gap-3 border-t border-slate-100 bg-white p-4">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="اكتب رسالة..."
              disabled={sending}
              className="input-field flex-1"
            />
            <Button type="submit" size="sm" disabled={sending}>
              إرسال
            </Button>
          </form>
        </section>
      </div>

      {showReport && user?.userId && reportedUserId && (
        <ReportConversationDialog
          conversationId={convId}
          reporterUserId={user.userId}
          reportedUserId={reportedUserId}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
