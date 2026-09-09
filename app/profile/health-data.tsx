import { supabase } from "@/lib/supabase";
import { useUser } from "@/providers/user-provider";
import { Check, Shield } from "lucide-react-native";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HealthDataScreen() {
  const router = useRouter();
  const { id } = useUser();
  const [electro, setElectro] = useState(false);
  const [mobility, setMobility] = useState(false);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!id) return;
    void (async () => {
      const { data } = await supabase
        .from("resident_profiles")
        .select("is_electro_dependent, has_reduced_mobility, additional_notes")
        .eq("user_id", id)
        .maybeSingle();
      if (data) {
        setElectro(Boolean(data.is_electro_dependent));
        setMobility(Boolean(data.has_reduced_mobility));
        setNotes(data.additional_notes ?? "");
      }
      setLoading(false);
    })();
  }, [id]);
  const hasSensitiveData = electro || mobility || notes.trim().length > 0;
  const save = async () => {
    if (!id) return;
    if (hasSensitiveData && !consent) {
      Alert.alert(
        "Consentimiento requerido",
        "Debes autorizar expresamente el tratamiento de estos datos para emergencias.",
      );
      return;
    }
    setSaving(true);
    const { error } = await (supabase.from("resident_profiles") as any).upsert(
      {
        user_id: id,
        is_electro_dependent: electro,
        has_reduced_mobility: mobility,
        additional_notes: notes.trim() || null,
        health_consent_at: hasSensitiveData ? new Date().toISOString() : null,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) Alert.alert("Error", "No pudimos guardar tu ficha.");
    else {
      Alert.alert("Listo", "Ficha de salud actualizada.");
      router.back();
    }
  };
  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{ title: "Datos de emergencia", headerShown: true }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.notice}>
          <Shield size={24} color="#2563eb" />
          <Text style={styles.noticeText}>
            Estos datos son opcionales y solo se usarán para auxilio y
            priorización en emergencias por conserjería y bomberos.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.heading}>Información de emergencia</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Soy electrodependiente</Text>
            <Switch value={electro} onValueChange={setElectro} />
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tengo movilidad reducida</Text>
            <Switch value={mobility} onValueChange={setMobility} />
          </View>
          <Text style={styles.label}>Información adicional</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="Indica solo lo necesario para una emergencia"
            placeholderTextColor="#94a3b8"
            style={styles.input}
          />
        </View>
        {hasSensitiveData && (
          <Pressable
            style={styles.consentRow}
            onPress={() => setConsent((value) => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: consent }}
          >
            <View style={[styles.checkbox, consent && styles.active]}>
              {consent && <Check size={14} color="#fff" />}
            </View>
            <Text style={styles.consentText}>
              <Text style={styles.bold}>
                Consentimiento explícito (Art. 16):{" "}
              </Text>
              Autorizo el uso de estos datos exclusivamente para auxilio y
              priorización en emergencias.
            </Text>
          </Pressable>
        )}
        <Pressable style={styles.button} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Guardar ficha</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 18, gap: 16 },
  loading: { alignItems: "center", flex: 1, justifyContent: "center" },
  notice: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    flexDirection: "row",
    gap: 10,
    padding: 15,
  },
  noticeText: { color: "#1e40af", flex: 1, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: "#fff", borderRadius: 14, gap: 16, padding: 18 },
  heading: { color: "#1e293b", fontSize: 17, fontWeight: "800" },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  label: { color: "#334155", fontSize: 14, fontWeight: "600" },
  input: {
    borderColor: "#cbd5e1",
    borderRadius: 8,
    borderWidth: 1,
    color: "#1e293b",
    minHeight: 90,
    padding: 12,
    textAlignVertical: "top",
  },
  consentRow: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  checkbox: {
    alignItems: "center",
    borderColor: "#94a3b8",
    borderRadius: 5,
    borderWidth: 2,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  active: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  consentText: { color: "#334155", flex: 1, fontSize: 13, lineHeight: 19 },
  bold: { fontWeight: "800" },
  button: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 9,
    padding: 14,
  },
  buttonText: { color: "#fff", fontWeight: "800" },
});
