import * as signalR from "@microsoft/signalr";
import { getHubUrl } from "./config";
import { getAccessToken } from "./auth-storage";

export type HubName = "auctions" | "chat";

export function createHubConnection(hub: HubName): signalR.HubConnection {
  return new signalR.HubConnectionBuilder()
    .withUrl(getHubUrl(hub), {
      accessTokenFactory: () => getAccessToken() ?? "",
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();
}

/** اتصال محادثة مع إعادة الانضمام بعد انقطاع الشبكة */
export async function startChatHub(
  conversationId: number,
  onMessage: (msg: unknown) => void,
): Promise<signalR.HubConnection> {
  const conn = createHubConnection("chat");

  const join = () => conn.invoke("JoinConversation", conversationId).catch(() => {});

  conn.on("ReceiveMessage", onMessage);
  conn.onreconnected(join);

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
  try {
    await conn.stop();
  } catch {
    /* ignore */
  }
}

/** اتصال مزاد حي */
export async function startAuctionHub(
  auctionId: number,
  inviteCode: string | null,
  handlers: {
    onPriceTick: (data: unknown) => void;
    onBidPlaced?: () => void;
  },
): Promise<signalR.HubConnection> {
  const conn = createHubConnection("auctions");

  const join = () =>
    conn.invoke("JoinAuction", auctionId, inviteCode || null).catch(() => {});

  conn.on("PriceTick", handlers.onPriceTick);
  if (handlers.onBidPlaced) conn.on("BidPlaced", handlers.onBidPlaced);
  conn.onreconnected(join);

  await conn.start();
  await join();

  return conn;
}

export async function stopAuctionHub(
  conn: signalR.HubConnection | null,
  auctionId: number,
) {
  if (!conn) return;
  try {
    if (conn.state === signalR.HubConnectionState.Connected) {
      await conn.invoke("LeaveAuction", auctionId);
    }
  } catch {
    /* ignore */
  }
  try {
    await conn.stop();
  } catch {
    /* ignore */
  }
}
