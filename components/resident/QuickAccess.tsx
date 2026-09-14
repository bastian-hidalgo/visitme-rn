import { LinearGradient } from "expo-linear-gradient";
import { Calendar, House, MessageCircle } from "lucide-react-native";
import { MotiPressable } from "moti/interactions";
import { MotiText, MotiView } from "moti";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { useChatConversations } from "@/lib/chat/useChat";

const QUICK_ACTIONS = [
  { id: "home", label: "Inicio", icon: House },
  { id: "reserve", label: "Reservar", icon: Calendar },
  { id: "chat", label: "Chat", icon: MessageCircle },
] as const;

interface Props {
  onNavigate: (id: string) => void;
  activeId?: string;
}

export default function QuickAccessBottom({ onNavigate, activeId }: Props) {
  const [selected, setSelected] = useState("home");
  const active = activeId ?? selected;
  const { conversations } = useChatConversations();
  const unreadCount = conversations.reduce(
    (total, conversation) => total + (conversation.unread_count || 0),
    0,
  );

  return (
    <LinearGradient
      colors={["#ffffff", "#f7f2ff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.inner}>
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          const isActive = active === action.id;

          return (
            <MotiPressable
              key={action.id}
              style={styles.pressable}
              onPress={() => {
                setSelected(action.id);
                onNavigate(action.id);
              }}
              animate={({ pressed }) => {
                "worklet";
                return {
                  scale: pressed ? 0.94 : 1,
                  opacity: pressed ? 0.82 : 1,
                };
              }}
            >
              <MotiView
                animate={{
                  width: isActive ? 94 : 46,
                  backgroundColor: isActive ? "#6d28d9" : "transparent",
                }}
                transition={{ type: "spring", damping: 18, stiffness: 220 }}
                style={styles.item}
              >
                <View style={styles.iconContainer}>
                  <Icon size={20} color={isActive ? "#ffffff" : "#6d28d9"} />
                  {action.id === "chat" && unreadCount > 0 && (
                    <View style={styles.badge}>
                      <MotiText style={styles.badgeText} numberOfLines={1}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </MotiText>
                    </View>
                  )}
                </View>

                {isActive && (
                  <MotiText
                    from={{ opacity: 0, translateX: -8 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ type: "timing", duration: 180 }}
                    style={styles.label}
                    numberOfLines={1}
                  >
                    {action.label}
                  </MotiText>
                )}
              </MotiView>
            </MotiPressable>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "82%",
    maxWidth: 360,
    borderRadius: 25,
    padding: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#e9d5ff",
    shadowColor: "#4c1d95",
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    minHeight: 48,
  },
  pressable: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  item: {
    height: 44,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    overflow: "visible",
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -6,
    right: -7,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    borderWidth: 2,
    borderColor: "#ffffff",
    zIndex: 10,
    elevation: 4,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "800",
  },
  label: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },
});
