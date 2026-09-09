import { Stack, useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen
        options={{
          title: "Política de Privacidad",
          headerShown: true,
          headerBackTitle: "Volver",
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Política de Privacidad de Visitme</Text>
        <Text style={styles.updated}>Versión v1.0-2026-12 · Chile</Text>
        <Text style={styles.heading}>Responsable y finalidad</Text>
        <Text style={styles.text}>
          Visitme trata los datos necesarios para administrar accesos, visitas,
          encomiendas, reservas y comunicaciones operativas de tu comunidad. La
          administración de tu comunidad puede tratar información para cumplir
          sus obligaciones legales y de copropiedad.
        </Text>
        <Text style={styles.heading}>Datos que tratamos</Text>
        <Text style={styles.text}>
          Identificación y contacto, relación con la unidad, registros de
          acceso, reservas y preferencias de notificaciones. Los datos sensibles
          de salud solo se utilizan para auxilio y priorización en emergencias
          cuando entregas consentimiento explícito.
        </Text>
        <Text style={styles.heading}>Tus derechos</Text>
        <Text style={styles.text}>
          Puedes solicitar acceso, rectificación, actualización, oposición,
          portabilidad y supresión de tus datos desde el Centro de Privacidad o
          contactando a la administración. Algunos registros deben conservarse
          por obligaciones legales o para acreditar gastos comunes, y podrán
          quedar asociados de forma limitada a tu departamento.
        </Text>
        <Text style={styles.heading}>Conservación y seguridad</Text>
        <Text style={styles.text}>
          Conservamos la información solo durante el tiempo necesario para las
          finalidades informadas y aplicamos controles de acceso. Al eliminar tu
          cuenta desvinculamos las notificaciones y anonimizamos lo que deba
          conservarse.
        </Text>
        <Text style={styles.heading}>Contacto</Text>
        <Text style={styles.text}>
          Para ejercer tus derechos, utiliza el Centro de Privacidad o solicita
          atención a la administración de tu comunidad.
        </Text>
        <Text style={styles.close} onPress={() => router.back()}>
          Volver
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 22, paddingBottom: 48 },
  title: { color: "#1e293b", fontSize: 23, fontWeight: "800" },
  updated: { color: "#64748b", marginTop: 6 },
  heading: {
    color: "#1e293b",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 25,
    marginBottom: 7,
  },
  text: { color: "#475569", fontSize: 14, lineHeight: 22 },
  close: { color: "#2563eb", fontWeight: "700", marginTop: 28 },
});
