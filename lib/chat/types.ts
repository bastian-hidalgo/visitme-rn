export type ConversationStatus =
  | "open"
  | "assigned"
  | "pending_resident"
  | "pending_internal"
  | "resolved"
  | "closed";

export type MessageType = "text" | "system" | "internal_note";
export type MessageDeliveryStatus = "sending" | "sent" | "failed";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  body: string;
  message_type: MessageType;
  sender_id?: string | null;
  sender_name?: string | null;
  client_message_id?: string | null;
  created_at: string;
  delivery_status?: MessageDeliveryStatus;
};

export type ChatCommunity = {
  id: string;
  name: string;
  slug?: string | null;
};

export type ChatAssignee = {
  name?: string | null;
};

export type ChatConversation = {
  id: string;
  community?: ChatCommunity | null;
  community_id?: string | null;
  assignee?: ChatAssignee | null;
  category?: string | null;
  subject?: string | null;
  status: ConversationStatus;
  last_message?: ChatMessage | null;
  latest_message?: ChatMessage | null;
  lastMessage?: ChatMessage | null;
  last_message_preview?: string | null;
  last_message_at?: string | null;
  unread_count: number;
  unreadCount?: number;
  assigned_to_name?: string | null;
  reopened?: boolean;
  created_at?: string | null;
};

export type Page<T> = {
  items: T[];
  next_cursor?: string | null;
};

export type ChatApiError = Error & {
  code?: string;
  status?: number;
  requestId?: string;
};

export const isVisibleResidentMessage = (message: ChatMessage) =>
  message.message_type !== "internal_note";
