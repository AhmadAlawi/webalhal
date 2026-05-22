"use client";

import { useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { getConversations } from "@/services/chat";
import { useAuth } from "@/context/AuthContext";

export default function ChatListPage() {
  const { isAuthenticated, requireAuth } = useAuth();

  useEffect(() => {
    requireAuth();
  }, [requireAuth]);

  const { data: conversations = [], isLoading } = useSWR(
    isAuthenticated ? "chat:conversations" : null,
    getConversations,
    { refreshInterval: 30_000, revalidateOnFocus: true },
  );

  return (
    <>
      <PageHeader title="المحادثات" backHref="/" />
      <PageContainer className="py-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : (
          <ul className="card divide-y divide-slate-100 overflow-hidden p-0">
            {conversations.map((c) => (
              <li key={c.conversationId}>
                <Link
                  href={`/chat/${c.conversationId}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
                >
                  <span>
                    <p className="font-medium text-slate-900">
                      {c.title || `محادثة #${c.conversationId}`}
                    </p>
                    <p className="line-clamp-1 text-sm text-slate-500">{c.lastMessage}</p>
                  </span>
                  {(c.unreadCount ?? 0) > 0 && (
                    <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                      {c.unreadCount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
            {conversations.length === 0 && (
              <li className="py-16 text-center text-slate-500">لا توجد محادثات</li>
            )}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
