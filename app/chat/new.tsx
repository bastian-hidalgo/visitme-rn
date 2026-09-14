import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { chatApi } from "@/lib/chat/api";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/providers/supabase-auth-provider";
import { useUser } from "@/providers/user-provider";
import type { CommunityMembershipRow } from "@/types/communities";

type CommunityOption = {
  id: string;
  name: string;
  slug: string;
};

const categories = [
  { value: "consulta_general", label: "Consulta general" },
  { value: "reservas", label: "Reservas" },
  { value: "mantencion", label: "Mantención" },
  { value: "administracion", label: "Administración" },
];

export default function NewChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, isLoading: authLoading } = useSupabaseAuth();
  const { communityId: activeCommunityId, communityName: activeCommunityName } =
    useUser();
  const [communities, setCommunities] = useState<CommunityOption[]>([]);
  const [communityId, setCommunityId] = useState<string | null>(
    activeCommunityId || null,
  );
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [category, setCategory] = useState(categories[0].value);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading || !session?.user.id) return;

    let active = true;
    const loadCommunities = async () => {
      setCommunitiesLoading(true);
      try {
        const { data, error: membershipsError } = await supabase
          .from("user_communities")
          .select("community:community_id(id, slug, name)")
          .eq("user_id", session.user.id)
          .returns<CommunityMembershipRow[]>();

        if (membershipsError) throw membershipsError;

        const options = (data ?? [])
          .map((entry) => entry.community)
          .filter(
            (
              community,
            ): community is {
              id: string;
              slug: string;
              name: string | null;
            } => Boolean(community?.id && community.slug),
          )
          .map((community) => ({
            id: community.id,
            slug: community.slug,
            name: community.name?.trim() || community.slug,
          }));

        if (!active) return;
        setCommunities(options);
        setCommunityId((current) => {
          if (current && options.some((option) => option.id === current)) {
            return current;
          }
          if (
            activeCommunityId &&
            options.some((option) => option.id === activeCommunityId)
          ) {
            return activeCommunityId;
          }
          return options.length === 1 ? options[0].id : null;
        });
      } catch (loadError) {
        console.error("[NewChat] Failed to load communities", loadError);
        if (active) setError("No pudimos cargar tus comunidades.");
      } finally {
        if (active) setCommunitiesLoading(false);
      }
    };

    void loadCommunities();
    return () => {
      active = false;
    };
  }, [activeCommunityId, authLoading, session?.user.id]);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === communityId),
    [communities, communityId],
  );

  const submit = async () => {
    if (!communityId) {
      setError("Selecciona la comunidad a la que quieres escribir.");
      return;
    }
    if (!body.trim()) {
      setError("Escribe el mensaje inicial.");
      return;
    }

    setSubmitting(true);
    setError(null);
    console.log("[NewChat] Creating conversation", {
      communityId,
      communityName: selectedCommunity?.name ?? null,
      category,
    });

    try {
      const conversation = await chatApi.createConversation({
        community_id: communityId,
        category,
        priority: "normal",
        subject: subject.trim() || undefined,
        body: body.trim(),
        client_message_id:
          clientMessageIdRef.current ??
          (clientMessageIdRef.current = Crypto.randomUUID()),
      });
      clientMessageIdRef.current = null;
      router.replace({
        pathname: "/chat/[id]" as never,
        params: { id: conversation.id },
      });
    } catch (cause) {
      const chatError = cause as {
        status?: number;
        code?: string;
        message?: string;
      };
      const message =
        chatError.status === 403 || chatError.code === "COMMUNITY_ACCESS_DENIED"
          ? "No tienes acceso a esta comunidad."
          : chatError.status === 404
            ? "La comunidad seleccionada no existe."
            : chatError.status === 422
              ? "No tienes un departamento activo en esta comunidad."
              : chatError.status === 400
                ? "Revisa la comunidad y el mensaje antes de continuar."
                : chatError.message || "No se pudo crear la conversación.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable onPress={() => router.back()}>
            <Text style={styles.back}>‹ Volver</Text>
          </Pressable>
          <Text style={styles.title}>Nueva conversación</Text>
          <Text style={styles.help}>
            Cuéntanos en qué podemos ayudarte. No uses este chat para
            emergencias.
          </Text>

          <Text style={styles.label}>Comunidad</Text>
          {communitiesLoading ? (
            <View style={styles.communityLoading}>
              <ActivityIndicator color="#7e22ce" />
              <Text style={styles.communityLoadingText}>
                Cargando tus comunidades…
              </Text>
            </View>
          ) : communities.length === 0 ? (
            <Text style={styles.communityEmpty}>
              No encontramos comunidades asociadas a tu cuenta.
            </Text>
          ) : (
            <View style={styles.communities}>
              {communities.map((community) => {
                const selected = community.id === communityId;
                return (
                  <Pressable
                    key={community.id}
                    onPress={() => setCommunityId(community.id)}
                    style={[
                      styles.community,
                      selected && styles.communitySelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.communityText,
                        selected && styles.communityTextSelected,
                      ]}
                    >
                      {community.name}
                    </Text>
                    {selected && <Text style={styles.selectedMark}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          )}
          {selectedCommunity && communities.length > 1 && (
            <Text style={styles.selectedCommunityHint}>
              Esta conversación será atendida por {selectedCommunity.name}.
            </Text>
          )}
          {communities.length === 1 &&
            !selectedCommunity &&
            activeCommunityName && (
              <Text style={styles.selectedCommunityHint}>
                {activeCommunityName}
              </Text>
            )}

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.categories}>
            {categories.map((item) => (
              <Pressable
                key={item.value}
                onPress={() => setCategory(item.value)}
                style={[
                  styles.category,
                  category === item.value && styles.categorySelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === item.value && styles.categoryTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Asunto (opcional)</Text>
          <TextInput
            value={subject}
            onChangeText={setSubject}
            style={styles.input}
            placeholder="Ej. Consulta sobre visitas"
            placeholderTextColor="#978d9f"
            maxLength={120}
          />
          <Text style={styles.label}>Mensaje</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            style={[styles.input, styles.textarea]}
            placeholder="Escribe tu consulta"
            placeholderTextColor="#978d9f"
            multiline
            textAlignVertical="top"
            maxLength={4000}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            disabled={submitting || communitiesLoading || !communityId}
            onPress={() => void submit()}
            style={[
              styles.submit,
              (submitting || communitiesLoading || !communityId) &&
                styles.disabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitText}>Enviar consulta</Text>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#fff" },
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, paddingBottom: 40 },
  back: { color: "#7e22ce", fontWeight: "600", fontSize: 16, marginBottom: 20 },
  title: { fontSize: 29, fontWeight: "700", color: "#21172a" },
  help: { color: "#6b6475", lineHeight: 20, marginTop: 8, marginBottom: 26 },
  label: {
    color: "#342a3b",
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 16,
  },
  communityLoading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
  },
  communityLoadingText: { color: "#6b6475" },
  communityEmpty: {
    color: "#b42318",
    lineHeight: 20,
    marginBottom: 4,
  },
  communities: { gap: 8 },
  community: {
    alignItems: "center",
    borderColor: "#ddd4e4",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  communitySelected: {
    backgroundColor: "#f3e8ff",
    borderColor: "#7e22ce",
  },
  communityText: { color: "#63596b", flex: 1, fontWeight: "600" },
  communityTextSelected: { color: "#6b21a8", fontWeight: "800" },
  selectedMark: { color: "#6b21a8", fontSize: 18, fontWeight: "800" },
  selectedCommunityHint: { color: "#6b6475", fontSize: 12, marginTop: 8 },
  categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  category: {
    borderWidth: 1,
    borderColor: "#ddd4e4",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categorySelected: { borderColor: "#7e22ce", backgroundColor: "#f3e8ff" },
  categoryText: { color: "#63596b" },
  categoryTextSelected: { color: "#6b21a8", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd4e4",
    borderRadius: 12,
    padding: 13,
    color: "#21172a",
    fontSize: 16,
  },
  textarea: { height: 150 },
  submit: {
    alignItems: "center",
    backgroundColor: "#7e22ce",
    borderRadius: 12,
    padding: 15,
    marginTop: 26,
  },
  disabled: { opacity: 0.6 },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
  error: { color: "#b42318", marginTop: 14 },
});
