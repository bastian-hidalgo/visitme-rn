import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useChatConversation } from "@/lib/chat/useChat";
import type { ChatMessage } from "@/lib/chat/types";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";

const statusLabels: Record<string, string> = {
  open: "Abierta",
  assigned: "En atención",
  pending_resident: "Esperando tu respuesta",
  pending_internal: "En revisión",
  resolved: "Resuelta",
  closed: "Cerrada",
};
const dateLabel = (value: string) =>
  new Date(value).toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useSupabaseAuth();
  const chat = useChatConversation(conversationId);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const messageListRef = useRef<FlatList<ChatMessage>>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    });
  };

  useEffect(() => {
    if (!chat.messages.length) return;

    const frame = requestAnimationFrame(() => {
      messageListRef.current?.scrollToEnd({ animated: true });
    });

    return () => cancelAnimationFrame(frame);
  }, [chat.messages.length]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const keyboardShowSubscription = Keyboard.addListener(showEvent, () => {
      setTimeout(scrollToBottom, 80);
    });
    const keyboardHideSubscription = Keyboard.addListener(hideEvent, () => {
      setTimeout(scrollToBottom, 80);
    });

    return () => {
      keyboardShowSubscription.remove();
      keyboardHideSubscription.remove();
    };
  }, []);

  if (!conversationId)
    return (
      <View style={styles.center}>
        <Text>Conversación no encontrada.</Text>
      </View>
    );
  if (chat.loading && !chat.conversation)
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#7e22ce" />
      </View>
    );
  if (chat.error && !chat.conversation)
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{chat.error}</Text>
        <Pressable onPress={() => void chat.refresh()}>
          <Text style={styles.link}>Reintentar</Text>
        </Pressable>
      </View>
    );

  const send = async () => {
    if (!draft.trim() || sending) return;
    const value = draft;
    setDraft("");
    setSending(true);
    try {
      await chat.sendMessage(value);
    } catch {
      /* El mensaje queda visible como failed y puede reintentarse. */
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.message_type === "system")
      return (
        <View style={styles.system}>
          <Text style={styles.systemText}>{item.body}</Text>
        </View>
      );
    const local =
      item.id.startsWith("local-") || item.sender_id === session?.user.id;
    return (
      <View style={[styles.messageRow, local && styles.messageRowLocal]}>
        <View
          style={[
            styles.bubble,
            local ? styles.bubbleLocal : styles.bubbleOther,
          ]}
        >
          <Text style={[styles.body, local && styles.bodyLocal]}>
            {item.body}
          </Text>
          <View style={styles.messageMeta}>
            <Text style={[styles.time, local && styles.timeLocal]}>
              {dateLabel(item.created_at)}
            </Text>
            {local && item.delivery_status === "sending" && (
              <Text style={styles.time}>Enviando</Text>
            )}
            {local && item.delivery_status === "failed" && (
              <Pressable onPress={() => void chat.retryMessage(item)}>
                <Text style={styles.retry}>Reintentar</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.communityName} numberOfLines={1}>
              {chat.conversation?.community?.name ||
                (chat.conversation?.community_id
                  ? `Comunidad ${chat.conversation.community_id}`
                  : "Comunidad no disponible")}
            </Text>
            <Text numberOfLines={1} style={styles.title}>
              {chat.conversation?.subject ||
                chat.conversation?.category ||
                "Conversación"}
            </Text>
            <Text style={styles.status}>
              {statusLabels[chat.conversation?.status || ""] || ""} ·{" "}
              {chat.connected ? "Conectado" : "Reconectando…"}
              {(chat.conversation?.assignee?.name ||
                chat.conversation?.assigned_to_name) &&
                ` · ${chat.conversation.assignee?.name || chat.conversation.assigned_to_name}`}
            </Text>
          </View>
        </View>
        <FlatList
          ref={messageListRef}
          style={styles.messageList}
          data={chat.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messages}
          contentInsetAdjustmentBehavior="never"
          onLayout={scrollToBottom}
          onContentSizeChange={() => {
            if (chat.messages.length) scrollToBottom();
          }}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => void chat.loadOlder()}
          onEndReachedThreshold={0.15}
          ListHeaderComponent={
            chat.loadingOlder ? <ActivityIndicator color="#7e22ce" /> : null
          }
          ListFooterComponent={<View style={styles.messageListFooter} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.empty}>Todavía no hay mensajes.</Text>
            </View>
          }
        />
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.composerInput}
            placeholder="Escribe un mensaje"
            placeholderTextColor="#978d9f"
            multiline
            maxLength={4000}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={() => void send()}
            disabled={!draft.trim() || sending}
            style={[styles.send, (!draft.trim() || sending) && styles.disabled]}
          >
            <Text style={styles.sendText}>Enviar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee8f2",
  },
  back: { color: "#7e22ce", fontSize: 36, lineHeight: 32, paddingRight: 12 },
  headerText: { flex: 1 },
  communityName: {
    color: "#6d28d9",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  title: { color: "#21172a", fontSize: 18, fontWeight: "700" },
  status: { color: "#6b6475", fontSize: 12, marginTop: 4 },
  messageList: { flex: 1 },
  messages: { padding: 16, gap: 10, flexGrow: 1 },
  messageListFooter: { height: 24 },
  messageRow: { alignItems: "flex-start", width: "100%" },
  messageRowLocal: { alignItems: "flex-end" },
  bubble: { maxWidth: "82%", borderRadius: 16, padding: 12 },
  bubbleLocal: { backgroundColor: "#7e22ce", borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: "#f2edf5", borderBottomLeftRadius: 4 },
  body: { color: "#21172a", fontSize: 16, lineHeight: 21 },
  bodyLocal: { color: "white" },
  messageMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 5,
  },
  time: { color: "#877d8f", fontSize: 10 },
  timeLocal: { color: "#ead9f8" },
  retry: { color: "#f04438", fontSize: 11, fontWeight: "700" },
  system: { alignItems: "center", paddingHorizontal: 20, paddingVertical: 8 },
  systemText: {
    color: "#7b7184",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee8f2",
    backgroundColor: "#fff",
  },
  composerInput: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd4e4",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    color: "#21172a",
  },
  send: {
    backgroundColor: "#7e22ce",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  sendText: { color: "white", fontWeight: "700" },
  disabled: { opacity: 0.5 },
  empty: { color: "#6b6475" },
  error: { color: "#b42318", textAlign: "center", marginBottom: 12 },
  link: { color: "#7e22ce", fontWeight: "700" },
});
