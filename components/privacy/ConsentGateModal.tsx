import { registerPrivacyConsent } from "@/lib/privacy/api";
import { Check, ChevronRight, LogOut, Shield } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  userName?: string;
  communityName?: string;
  onConsentSuccess: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
  onOpenPrivacyPolicy: () => void;
};

export function ConsentGateModal({
  visible,
  userName = "Vecino/a",
  communityName = "tu comunidad",
  onConsentSuccess,
  onLogout,
  onOpenPrivacyPolicy,
}: Props) {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedMarketing, setAcceptedMarketing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);

  const submit = async () => {
    if (!acceptedTerms) {
      Alert.alert(
        "Atención",
        "Debes aceptar los Términos y la Política de Privacidad para continuar.",
      );
      return;
    }
    setLoading(true);
    console.log("[ConsentGateModal] Starting consent submission", {
      acceptedTerms,
      acceptedMarketing,
    });

    try {
      console.log("[ConsentGateModal] Registering consent with privacy API");
      const response = await registerPrivacyConsent(acceptedMarketing);
      console.log("[ConsentGateModal] Privacy API succeeded", {
        status: response.status,
        ok: response.ok,
      });

      console.log("[ConsentGateModal] Updating local user consent state");
      await onConsentSuccess();
      console.log("[ConsentGateModal] Consent flow completed");
    } catch (error) {
      console.error("[ConsentGateModal] Consent submission failed", {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        hasAcceptedTerms: acceptedTerms,
        hasAcceptedMarketing: acceptedMarketing,
      });
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "No fue posible registrar el consentimiento.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Shield size={38} color="#fff" />
          <Text style={styles.badge}>Ley N° 21.719 · Chile</Text>
          <Text style={styles.title}>Protección de tus datos</Text>
        </View>
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
          {showPolicy ? (
            <>
              <Pressable onPress={() => setShowPolicy(false)}>
                <Text style={styles.policyText}>
                  ← Volver al consentimiento
                </Text>
              </Pressable>
              <Text style={styles.cardTitle}>
                Política de Privacidad · v1.0-2026-12
              </Text>
              <Text style={styles.greeting}>
                Visitme trata los datos necesarios para gestionar accesos,
                visitas, encomiendas, reservas y comunicaciones operativas de tu
                comunidad. Solo tratamos datos sensibles de salud para auxilio y
                priorización en emergencias cuando entregas consentimiento
                explícito.
              </Text>
              <Text style={styles.greeting}>
                Puedes solicitar acceso, rectificación, actualización,
                oposición, portabilidad y supresión desde el Centro de
                Privacidad. Algunos registros deben conservarse por obligaciones
                legales y de copropiedad, asociados de forma limitada a tu
                departamento.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.greeting}>
                Hola <Text style={styles.bold}>{userName}</Text>. Visitme y la
                administración de{" "}
                <Text style={styles.linkText}>{communityName}</Text> usan tus
                datos para gestionar accesos, visitas, avisos y reservas.
              </Text>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  Usamos solo lo necesario para
                </Text>
                <Text style={styles.item}>
                  • Controlar accesos y mantener la seguridad.
                </Text>
                <Text style={styles.item}>
                  • Gestionar visitas, encomiendas y reservas.
                </Text>
                <Text style={styles.item}>
                  • Contactarte por asuntos de tu comunidad.
                </Text>
              </View>
              <Pressable
                style={styles.policy}
                onPress={() => {
                  setShowPolicy(true);
                  onOpenPrivacyPolicy();
                }}
                accessibilityRole="link"
              >
                <Text style={styles.policyText}>
                  Leer Política de Privacidad completa
                </Text>
                <ChevronRight size={18} color="#2563eb" />
              </Pressable>
              <Pressable
                style={styles.checkRow}
                onPress={() => setAcceptedTerms((value) => !value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedTerms }}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedTerms && styles.checkboxActive,
                  ]}
                >
                  {acceptedTerms && <Check size={15} color="#fff" />}
                </View>
                <Text style={styles.label}>
                  <Text style={styles.required}>* Obligatorio: </Text>Acepto los
                  Términos de Servicio y la Política de Tratamiento de Datos.
                </Text>
              </Pressable>
              <Pressable
                style={styles.checkRow}
                onPress={() => setAcceptedMarketing((value) => !value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: acceptedMarketing }}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedMarketing && styles.checkboxActive,
                  ]}
                >
                  {acceptedMarketing && <Check size={15} color="#fff" />}
                </View>
                <Text style={styles.label}>
                  Opcional: acepto recibir novedades y mejoras de Visitme.
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable style={styles.exit} onPress={onLogout} disabled={loading}>
            <LogOut size={18} color="#64748b" />
            <Text style={styles.exitText}>Rechazar y salir</Text>
          </Pressable>
          <Pressable
            style={[styles.submit, !acceptedTerms && styles.disabled]}
            onPress={submit}
            disabled={!acceptedTerms || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Aceptar y continuar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#2563eb",
    padding: 24,
    paddingTop: 52,
    alignItems: "center",
  },
  badge: { color: "#bfdbfe", fontSize: 12, fontWeight: "600", marginTop: 8 },
  title: { color: "#fff", fontSize: 21, fontWeight: "800", marginTop: 4 },
  body: { flex: 1, paddingHorizontal: 20 },
  bodyContent: { paddingVertical: 24, paddingBottom: 40 },
  greeting: { color: "#334155", fontSize: 15, lineHeight: 22 },
  bold: { fontWeight: "700" },
  linkText: { color: "#2563eb", fontWeight: "700" },
  card: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 20,
  },
  cardTitle: { color: "#1e293b", fontWeight: "700", marginBottom: 10 },
  item: { color: "#475569", fontSize: 13, lineHeight: 22 },
  policy: {
    alignItems: "center",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  policyText: { color: "#2563eb", fontWeight: "700" },
  checkRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  checkbox: {
    alignItems: "center",
    borderColor: "#94a3b8",
    borderRadius: 6,
    borderWidth: 2,
    height: 23,
    justifyContent: "center",
    width: 23,
  },
  checkboxActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  label: { color: "#334155", flex: 1, fontSize: 13, lineHeight: 19 },
  required: { color: "#dc2626", fontWeight: "700" },
  footer: {
    alignItems: "center",
    borderTopColor: "#e2e8f0",
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 16,
  },
  exit: { alignItems: "center", flexDirection: "row", gap: 6, padding: 12 },
  exitText: { color: "#64748b", fontWeight: "600" },
  submit: {
    alignItems: "center",
    backgroundColor: "#2563eb",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 13,
  },
  disabled: { opacity: 0.45 },
  submitText: { color: "#fff", fontWeight: "800" },
});
