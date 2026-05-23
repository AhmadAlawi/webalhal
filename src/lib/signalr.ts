import * as signalR from "@microsoft/signalr";
import { getHubUrl } from "./config";
import { getAccessToken } from "./auth-storage";
import {
  invokeHubWhenConnected,
  normalizeChatHubMessage,
  parseHubError,
  waitForHubConnected,
  type NormalizedChatMessage,
} from "./hub-utils";

export type HubName = "auctions" | "chat";

function trimBase(url: string): string {
  return url.replace(/\/$/, "");
}

export function createHubConnection(hub: HubName): signalR.HubConnection {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(getHubUrl(hub), {
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  conn.serverTimeoutInMilliseconds = 60_000;
  conn.keepAliveIntervalInMilliseconds = 15_000;

  return conn;
}

export type ChatHubHandlers = {
  onMessage: (msg: NormalizedChatMessage) => void;
  onConversationUpdated?: () => void;
};

/** اتصال محادثة — أحداث MessageCreated كما في تطبيق الموبايل */
export async function startChatHub(
  conversationId: number,
  handlers: ChatHubHandlers,
): Promise<signalR.HubConnection> {
  const conn = createHubConnection("chat");

  const join = async () => {
    await invokeHubWhenConnected(conn, "JoinConversation", conversationId);
    await conn.invoke("MarkAsRead", conversationId).catch(() => {});
  };

  const onMessageCreated = (payload: unknown) => {
    const msg = normalizeChatHubMessage(payload, conversationId);
    if (msg) {
      handlers.onMessage(msg);
      return;
    }
    const root = payload as Record<string, unknown> | null;
    const cid = Number(root?.conversationId ?? root?.message);
    if (cid === conversationId) {
      handlers.onConversationUpdated?.();
    }
  };

  conn.on("MessageCreated", onMessageCreated);
  conn.on("ConversationUpdated", (payload: unknown) => {
    const p = payload as Record<string, unknown> | null;
    const cid = Number(p?.conversationId ?? p?.conversation);
    if (Number.isFinite(cid) && cid === conversationId) {
      handlers.onConversationUpdated?.();
    }
  });

  conn.onreconnected(() => {
    void join();
    handlers.onConversationUpdated?.();
  });

  await conn.start();
  await join();

  return conn;
}

export async function stopChatHub(
  conn: signalR.HubConnection | null,
  conversationId: number,
) {
  if (!conn) return;
  try {
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("LeaveConversation", conversationId);
    }
  } catch {
    /* ignore */
  }
  conn.off("MessageCreated");
  conn.off("ConversationUpdated");
  try {
    await conn.stop();
  } catch {
    /* ignore */
  }
}

export type AuctionHubHandlers = {
  onPriceTick: (data: unknown) => void;
  onBidPlaced?: (data: unknown) => void;
  onError?: (message: string) => void;
  onConnectionState?: (state: "connected" | "reconnecting" | "disconnected") => void;
};

/**
 * اتصال مزاد حي — JoinAuction(auctionId, userId, inviteCode) مطابق للموبايل
 */
export async function startAuctionHub(
  auctionId: number,
  userId: number,
  inviteCode: string | null,
  handlers: AuctionHubHandlers,
): Promise<signalR.HubConnection> {
  const conn = createHubConnection("auctions");
  const code =
    inviteCode != null && String(inviteCode).trim() !== ""
      ? String(inviteCode).trim()
      : null;

  const join = async () => {
    await invokeHubWhenConnected(conn, "JoinAuction", auctionId, userId, code);
  };

  conn.off("PriceTick");
  conn.off("BidPlaced");
  conn.off("Error");

  conn.on("PriceTick", handlers.onPriceTick);
  if (handlers.onBidPlaced) conn.on("BidPlaced", handlers.onBidPlaced);

  conn.on("Error", (err: unknown) => {
    handlers.onError?.(parseHubError(err));
  });

  conn.onreconnecting(() => {
    handlers.onConnectionState?.("reconnecting");
  });

  conn.onreconnected(() => {
    handlers.onConnectionState?.("connected");
    void join();
  });

  conn.onclose(() => {
    handlers.onConnectionState?.("disconnected");
  });

  await conn.start();
  await waitForHubConnected(conn);
  await join();
  handlers.onConnectionState?.("connected");

  return conn;
}

export async function stopAuctionHub(
  conn: signalR.HubConnection | null,
  auctionId: number,
  userId?: number,
  inviteCode?: string | null,
) {
  if (!conn) return;
  try {
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("LeaveAuction", auctionId);
    }
  } catch {
    /* ignore */
  }
  conn.off("PriceTick");
  conn.off("BidPlaced");
  conn.off("Error");
  try {
    await conn.stop();
  } catch {
    /* ignore */
  }
  void userId;
  void inviteCode;
}

export { parseHubError, invokeHubWhenConnected, waitForHubConnected };
