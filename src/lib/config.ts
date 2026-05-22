export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? "https://alhal.awnak.net";
}

export function getHubUrl(hub: "auctions" | "chat" | "tenders" | "direct"): string {
  return `${getApiBaseUrl()}/hubs/${hub}`;
}
