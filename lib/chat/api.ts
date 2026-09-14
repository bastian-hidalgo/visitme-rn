import { getBaseUrl } from "@/lib/getBaseUrl";
import { supabase } from "@/lib/supabase";
import type {
  ChatApiError,
  ChatConversation,
  ChatMessage,
  Page,
  ConversationStatus,
} from "./types";

const makeError = (
  message: string,
  status?: number,
  payload?: any,
): ChatApiError => {
  const error = new Error(message) as ChatApiError;
  error.status = status;
  error.code = payload?.error?.code;
  error.requestId = payload?.error?.requestId;
  return error;
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const { data, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !data.session?.access_token) {
    throw makeError("Tu sesión expiró. Inicia sesión nuevamente.", 401);
  }

  const baseUrl = getBaseUrl();
  const accessToken = data.session.access_token;
  const requestUrl = `${baseUrl}${path}`;

  console.log("[ChatAPI] Request", {
    method: init.method ?? "GET",
    url: requestUrl,
    userId: data.session.user.id,
    hasAuthorizationHeader: true,
    accessTokenLength: accessToken.length,
    expiresAt: data.session.expires_at ?? null,
  });

  const response = await fetch(requestUrl, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const payload = await response.json().catch(() => null);
  console.log("[ChatAPI] Response", {
    method: init.method ?? "GET",
    url: requestUrl,
    status: response.status,
    ok: response.ok,
    requestId: payload?.error?.requestId ?? null,
    errorCode: payload?.error?.code ?? null,
    errorMessage: payload?.error?.message ?? null,
  });

  if (!response.ok) {
    const message =
      payload?.error?.message ?? "No se pudo completar la operación.";
    throw makeError(message, response.status, payload);
  }
  return payload as T;
};

const unwrap = <T>(payload: any, key: string): T =>
  payload?.data ?? payload?.[key] ?? payload;

const extractConversationItems = (payload: any): any[] => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.conversations)) {
    return payload.data.conversations;
  }
  if (Array.isArray(payload?.conversations)) return payload.conversations;
  if (Array.isArray(payload)) return payload;
  return [];
};

const normalizeConversation = (raw: any): ChatConversation => {
  const lastMessage =
    raw?.last_message ?? raw?.latest_message ?? raw?.lastMessage ?? null;
  const preview =
    typeof raw?.last_message_preview === "string"
      ? raw.last_message_preview
      : null;
  const lastMessageAt = raw?.last_message_at ?? raw?.lastMessageAt ?? null;

  return {
    ...raw,
    last_message:
      lastMessage ??
      (preview
        ? {
            id: `${raw.id}-last-message-preview`,
            conversation_id: raw.id,
            body: preview,
            message_type: "text",
            created_at: lastMessageAt ?? raw.created_at,
          }
        : null),
    last_message_at: lastMessageAt,
    unread_count: Number(raw?.unread_count ?? raw?.unreadCount ?? 0),
  } as ChatConversation;
};

export const chatApi = {
  async listConversations(
    status?: ConversationStatus,
    cursor?: string,
  ): Promise<Page<ChatConversation>> {
    const params = new URLSearchParams({ limit: "20" });
    if (status) params.set("status", status);
    if (cursor) params.set("cursor", cursor);
    const payload = await request<any>(
      `/api/chat/conversations?${params.toString()}`,
    );
    const rawConversations = extractConversationItems(payload);

    console.log("[ChatAPI] Conversation list shape", {
      count: rawConversations.length,
      conversations: rawConversations.map((conversation) => ({
        id: conversation?.id ?? null,
        keys: Object.keys(conversation ?? {}),
        hasLastMessage: Boolean(
          conversation?.last_message ??
          conversation?.latest_message ??
          conversation?.lastMessage,
        ),
        hasLastMessagePreview:
          typeof conversation?.last_message_preview === "string",
        unreadCount:
          conversation?.unread_count ?? conversation?.unreadCount ?? null,
      })),
    });

    return {
      items: rawConversations.map(normalizeConversation),
      next_cursor:
        payload?.next_cursor ??
        payload?.meta?.next_cursor ??
        payload?.data?.next_cursor ??
        payload?.data?.meta?.next_cursor ??
        null,
    };
  },

  async getConversation(id: string): Promise<ChatConversation> {
    const payload = await request<any>(
      `/api/chat/conversations/${encodeURIComponent(id)}`,
    );
    return normalizeConversation(
      unwrap<ChatConversation>(payload, "conversation"),
    );
  },

  async listMessages(id: string, before?: string): Promise<Page<ChatMessage>> {
    const params = new URLSearchParams({ limit: "50" });
    if (before) params.set("before", before);
    const payload = await request<any>(
      `/api/chat/conversations/${encodeURIComponent(id)}/messages?${params.toString()}`,
    );
    return {
      items: (unwrap<ChatMessage[]>(payload, "messages") ?? []).filter(
        (message) => message.message_type !== "internal_note",
      ),
      next_cursor: payload?.next_cursor ?? payload?.meta?.next_cursor ?? null,
    };
  },

  async createConversation(input: {
    community_id: string;
    category: string;
    priority: "normal" | "high";
    subject?: string;
    body: string;
    client_message_id: string;
  }): Promise<ChatConversation> {
    console.log("[ChatAPI] Creating conversation", {
      communityId: input.community_id,
      category: input.category,
      hasSubject: Boolean(input.subject?.trim()),
    });

    const payload = await request<any>("/api/chat/conversations", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const conversation = unwrap<ChatConversation>(payload, "conversation");

    console.log("[ChatAPI] Conversation created", {
      conversationId: conversation?.id ?? null,
      requestedCommunityId: input.community_id,
      responseCommunityId:
        conversation?.community?.id ?? conversation?.community_id ?? null,
      responseCommunityName: conversation?.community?.name ?? null,
    });

    return conversation;
  },

  async sendMessage(
    conversationId: string,
    input: { body: string; message_type: "text"; client_message_id: string },
  ): Promise<ChatMessage> {
    return unwrap<ChatMessage>(
      await request<any>(
        `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
        {
          method: "POST",
          headers: { "Idempotency-Key": input.client_message_id },
          body: JSON.stringify(input),
        },
      ),
      "message",
    );
  },

  async markRead(conversationId: string, lastReadMessageId: string) {
    await request(
      `/api/chat/conversations/${encodeURIComponent(conversationId)}/read`,
      {
        method: "POST",
        body: JSON.stringify({ last_read_message_id: lastReadMessageId }),
      },
    );
  },
};
