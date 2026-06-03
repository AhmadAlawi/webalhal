"use client";

import Link from "next/link";
import { MessageCircle, Package, Truck } from "lucide-react";
import {
  linkedConversationLabel,
  type LinkedConversation,
} from "@/services/chat";

function relationIcon(relation?: string, contextType?: string) {
  const r = relation ?? "";
  const t = contextType ?? "";
  if (r === "pickup_handoff" || t === "transport_pickup") {
    return <Package className="h-4 w-4 text-amber-600" />;
  }
  if (r === "delivery_handoff" || t === "transport_delivery") {
    return <Truck className="h-4 w-4 text-emerald-600" />;
  }
  return <MessageCircle className="h-4 w-4 text-slate-600" />;
}

export function LinkedConversationsNav({
  links,
  currentConversationId,
}: {
  links: LinkedConversation[];
  currentConversationId: number;
}) {
  const others = links.filter((l) => l.conversationId !== currentConversationId);
  if (!others.length) return null;

  return (
    <section className="border-b border-emerald-100 bg-emerald-50/40 px-4 py-4">
      <p className="mb-3 text-sm font-semibold text-emerald-900">محادثات مرتبطة بالصفقة</p>
      <ul className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {others.map((link) => (
          <li key={link.conversationId}>
            <Link
              href={`/chat/${link.conversationId}`}
              className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50"
            >
              {relationIcon(link.relation, link.contextType)}
              {linkedConversationLabel(link)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
