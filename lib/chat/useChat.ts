import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { supabase } from "@/lib/supabase";
import { chatApi } from "./api";
import type { ChatConversation, ChatMessage, Page } from "./types";

const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const byId = new Map<string, ChatMessage>();
  current.forEach((message) => byId.set(message.id, message));
  incoming.forEach((message) => {
    const existing = [...byId.values()].find(
      (item) =>
        item.id === message.id ||
        Boolean(
          item.client_message_id &&
          item.client_message_id === message.client_message_id,
        ),
    );
    if (existing && existing.id !== message.id) byId.delete(existing.id);
    byId.set(message.id, { ...existing, ...message, delivery_status: "sent" });
  });
  return [...byId.values()].sort((a, b) =>
    `${a.created_at}-${a.id}`.localeCompare(`${b.created_at}-${b.id}`),
  );
};

export const createClientMessageId = () => Crypto.randomUUID();

export function useChatConversation(conversationId: string) {
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const lastMessageRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const [conversationPage, messagePage] = await Promise.all([
        chatApi.getConversation(conversationId),
        chatApi.listMessages(conversationId),
      ]);
      setConversation(conversationPage);
      setMessages((current) => mergeMessages(current, messagePage.items));
      setNextCursor(messagePage.next_cursor ?? null);
      const last = messagePage.items[messagePage.items.length - 1];
      if (last) lastMessageRef.current = last.id;
      if (last)
        void chatApi.markRead(conversationId, last.id).catch(() => undefined);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo cargar el chat.",
      );
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadOlder = useCallback(async () => {
    if (!nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const page = await chatApi.listMessages(conversationId, nextCursor);
      setMessages((current) => mergeMessages(page.items, current));
      setNextCursor(page.next_cursor ?? null);
    } catch {
      // La página actual queda disponible; el usuario puede reintentar al volver a subir.
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, nextCursor]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel(`chat-conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (event) => {
          const message = event.new as ChatMessage;
          if (event.eventType === "DELETE") {
            setMessages((current) =>
              current.filter(
                (item) => item.id !== (event.old as ChatMessage).id,
              ),
            );
            return;
          }
          if (message.message_type === "internal_note") return;
          setMessages((current) => mergeMessages(current, [message]));
          lastMessageRef.current = message.id;
          void chatApi
            .markRead(conversationId, message.id)
            .catch(() => undefined);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_conversations",
          filter: `id=eq.${conversationId}`,
        },
        () => void refresh(),
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") void refresh();
      });

    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active") void refresh();
    };
    const listener = AppState.addEventListener("change", onAppStateChange);
    return () => {
      listener.remove();
      void supabase.removeChannel(channel);
    };
  }, [conversationId, refresh]);

  const sendMessage = useCallback(
    async (body: string, existingClientMessageId = createClientMessageId()) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const optimistic: ChatMessage = {
        id: `local-${existingClientMessageId}`,
        conversation_id: conversationId,
        body: trimmed,
        message_type: "text",
        client_message_id: existingClientMessageId,
        created_at: new Date().toISOString(),
        delivery_status: "sending",
      };
      setMessages((current) => mergeMessages(current, [optimistic]));
      try {
        const sent = await chatApi.sendMessage(conversationId, {
          body: trimmed,
          message_type: "text",
          client_message_id: existingClientMessageId,
        });
        setMessages((current) =>
          mergeMessages(current, [{ ...sent, delivery_status: "sent" }]),
        );
      } catch (cause) {
        setMessages((current) =>
          current.map((message) =>
            message.client_message_id === existingClientMessageId
              ? { ...message, delivery_status: "failed" }
              : message,
          ),
        );
        throw cause;
      }
    },
    [conversationId],
  );

  const retryMessage = useCallback(
    async (message: ChatMessage) => {
      if (!message.client_message_id) return;
      await sendMessage(message.body, message.client_message_id);
    },
    [sendMessage],
  );

  return useMemo(
    () => ({
      conversation,
      messages,
      loading,
      loadingOlder,
      error,
      connected,
      refresh,
      loadOlder,
      sendMessage,
      retryMessage,
    }),
    [
      conversation,
      messages,
      loading,
      loadingOlder,
      error,
      connected,
      refresh,
      loadOlder,
      sendMessage,
      retryMessage,
    ],
  );
}

export function useChatConversations() {
  const [page, setPage] = useState<Page<ChatConversation>>({
    items: [],
    next_cursor: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      setPage(await chatApi.listConversations());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No se pudieron cargar las conversaciones.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!page.next_cursor) return;
    const next = await chatApi.listConversations(undefined, page.next_cursor);
    setPage((current) => ({
      items: [...current.items, ...next.items],
      next_cursor: next.next_cursor,
    }));
  }, [page.next_cursor]);

  useEffect(() => {
    void refresh();
    const channel = supabase
      .channel("chat-resident-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations" },
        () => void refresh(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        () => void refresh(),
      )
      .subscribe();
    return () => void supabase.removeChannel(channel);
  }, [refresh]);

  return {
    conversations: page.items,
    nextCursor: page.next_cursor,
    loading,
    error,
    refresh,
    loadMore,
  };
}
