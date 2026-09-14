import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatConversations } from "@/lib/chat/useChat";
import type { ChatConversation } from "@/lib/chat/types";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";
import { ThemedView } from "@/components/themed-view";

const statusLabels: Record<string, string> = {
  open: "Abierta",
  assigned: "En atención",
  pending_resident: "Esperando tu respuesta",
  pending_internal: "En revisión",
  resolved: "Resuelta",
  closed: "Cerrada",
};

const dateLabel = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("es-CL", {
        day: "2-digit",
        month: "short",
      })
    : "";

export default function ChatListScreen() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useSupabaseAuth();
  const { conversations, loading, error, refresh, loadMore } =
    useChatConversations();

  const renderItem = useCallback(
    ({ item }: { item: ChatConversation }) => (
      <Pressable
        style={styles.card}
        onPress={() =>
          router.push({
            pathname: "/chat/[id]" as never,
            params: { id: item.id },
          })
        }
        accessibilityRole="button"
      >
        <Text style={styles.communityName}>
          {item.community?.name ||
            (item.community_id
              ? `Comunidad ${item.community_id}`
              : "Comunidad no disponible")}
        </Text>
        <View style={styles.cardHeader}>
          <Text style={styles.subject}>
            {item.subject || item.category || "Consulta a conserjería"}
          </Text>
          <Text style={styles.date}>
            {dateLabel(item.last_message_at || item.created_at)}
          </Text>
        </View>
        <Text numberOfLines={2} style={styles.preview}>
          {item.last_message?.body || "Sin mensajes todavía"}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.status}>
            {statusLabels[item.status] || item.status}
          </Text>
          {item.unread_count > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.unread_count}</Text>
            </View>
          )}
          {item.reopened && <Text style={styles.reopened}>Reabierta</Text>}
        </View>
      </Pressable>
    ),
    [router],
  );

  if (authLoading || !session)
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator color="#7e22ce" />
      </ThemedView>
    );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Chat</Text>
            <Text style={styles.subtitle}>Conversa con conserjería</Text>
          </View>
          <Pressable
            onPress={() => router.push("/chat/new" as never)}
            style={styles.newButton}
          >
            <Text style={styles.newButtonText}>Nueva</Text>
          </Pressable>
        </View>
        <Text style={styles.notice}>
          Este chat no reemplaza los canales de emergencia.
        </Text>
        {loading && conversations.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color="#7e22ce" />
          </View>
        ) : error && conversations.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.error}>{error}</Text>
            <Pressable onPress={() => void refresh()}>
              <Text style={styles.link}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={
              conversations.length ? styles.list : styles.emptyList
            }
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={() => void refresh()}
              />
            }
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>
                  Aún no tienes conversaciones
                </Text>
                <Text style={styles.emptyText}>
                  Crea una consulta y te responderemos por aquí.
                </Text>
              </View>
            }
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: { fontSize: 30, fontWeight: "700", color: "#17131f" },
  subtitle: { color: "#6b6475", marginTop: 3 },
  newButton: {
    backgroundColor: "#7e22ce",
    borderRadius: 22,
    paddingHorizontal: 17,
    paddingVertical: 11,
  },
  newButtonText: { color: "white", fontWeight: "700" },
  notice: { color: "#6b6475", fontSize: 12, marginBottom: 14 },
  list: { paddingBottom: 24, gap: 12 },
  emptyList: { flexGrow: 1 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee8f2",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  communityName: {
    color: "#6d28d9",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  subject: { flex: 1, fontSize: 16, fontWeight: "700", color: "#21172a" },
  date: { color: "#81788a", fontSize: 12 },
  preview: { color: "#5f5865", marginTop: 8, lineHeight: 20 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  status: { color: "#7e22ce", fontSize: 12, fontWeight: "600" },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7e22ce",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontSize: 12, fontWeight: "700" },
  reopened: { color: "#0f766e", fontSize: 12 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#21172a",
    textAlign: "center",
  },
  emptyText: { color: "#6b6475", textAlign: "center", marginTop: 8 },
  error: { color: "#b42318", textAlign: "center", marginBottom: 12 },
  link: { color: "#7e22ce", fontWeight: "700" },
});
