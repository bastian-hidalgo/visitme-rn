import { useUser } from "@/providers/user-provider";
import { deletePrivacyAccount, minimizePersonalData } from "@/lib/privacy/api";
import { logoutUser as logoutOneSignalUser } from "@/lib/notifications/oneSignal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { ExternalLink, Minimize2, Shield, Trash2 } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { logout, setUserData } = useUser();
  const [loading, setLoading] = useState(false);

  const minimize = () =>
    Alert.alert(
      "Minimizar mis datos",
      "Se eliminarán datos accesorios como RUT, salud, vehículos y mascotas. Se conservará lo necesario para tu cuenta y obligaciones de la comunidad.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar y purgar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await minimizePersonalData();
              await logoutOneSignalUser();
              const keys = await AsyncStorage.getAllKeys();
              await AsyncStorage.multiRemove(
                keys.filter((key) => key.startsWith("onesignal_")),
              );
              setUserData({ dataProcessingStatus: "minimized" });
              Alert.alert("Listo", "Tus datos accesorios fueron suprimidos.");
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "No se pudo completar la minimización.",
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );

  const removeAccount = () =>
    Alert.alert(
      "Eliminar cuenta",
      "La eliminación es definitiva. Las reservas y cobros necesarios pueden permanecer asociados a tu departamento para los gastos comunes.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar mi cuenta",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await deletePrivacyAccount();
              await logout();
            } catch (error) {
              Alert.alert(
                "Error",
                error instanceof Error
                  ? error.message
                  : "No se pudo procesar la eliminación.",
              );
              setLoading(false);
            }
          },
        },
      ],
    );

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ title: "Privacidad", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Shield size={28} color="#2563eb" />
          <Text style={styles.title}>Tus derechos de privacidad</Text>
          <Text style={styles.subtitle}>
            Conforme a la Ley N° 21.719 de Chile
          </Text>
        </View>
        <View style={styles.section}>
          <Pressable style={styles.row} onPress={minimize} disabled={loading}>
            <Minimize2 size={21} color="#d97706" />
            <View style={styles.copy}>
              <Text style={styles.rowTitle}>Minimizar datos personales</Text>
              <Text style={styles.desc}>
                Purga información accesoria conservando el acceso y los
                registros necesarios.
              </Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.row, styles.last]}
            onPress={removeAccount}
            disabled={loading}
          >
            <Trash2 size={21} color="#dc2626" />
            <View style={styles.copy}>
              <Text style={[styles.rowTitle, styles.danger]}>
                Eliminar cuenta de Visitme
              </Text>
              <Text style={styles.desc}>
                Baja definitiva, desvinculación de push y anonimización de tu
                perfil.
              </Text>
            </View>
          </Pressable>
        </View>
        {loading && <ActivityIndicator color="#2563eb" style={styles.loader} />}
        <Pressable
          style={styles.policy}
          onPress={() => router.push("/privacy-policy" as any)}
        >
          <Text style={styles.policyText}>Ver Política de Privacidad</Text>
          <ExternalLink size={17} color="#2563eb" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16 },
  card: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 16,
    padding: 22,
  },
  title: { color: "#1e293b", fontSize: 18, fontWeight: "800", marginTop: 9 },
  subtitle: { color: "#64748b", fontSize: 13, marginTop: 4 },
  section: { backgroundColor: "#fff", borderRadius: 14, paddingHorizontal: 16 },
  row: {
    alignItems: "center",
    borderBottomColor: "#e2e8f0",
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingVertical: 18,
  },
  last: { borderBottomWidth: 0 },
  copy: { flex: 1 },
  rowTitle: { color: "#1e293b", fontSize: 15, fontWeight: "700" },
  danger: { color: "#dc2626" },
  desc: { color: "#64748b", fontSize: 13, lineHeight: 19, marginTop: 4 },
  loader: { margin: 18 },
  policy: {
    alignItems: "center",
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    padding: 18,
  },
  policyText: { color: "#2563eb", fontWeight: "700" },
});
