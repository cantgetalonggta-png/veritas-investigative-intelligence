import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { Colors } from "@/constants/theme";

const tabs: { name: "index" | "vault" | "analysis" | "team"; title: string; icon: React.ComponentProps<typeof MaterialIcons>["name"] }[] = [
  { name: "index", title: "Briefing", icon: "dashboard" },
  { name: "vault", title: "Vault", icon: "folder-shared" },
  { name: "analysis", title: "Signals", icon: "hub" },
  { name: "team", title: "Team", icon: "groups" },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.dark.tint,
        tabBarInactiveTintColor: Colors.dark.muted,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 7,
          paddingBottom: bottomPadding,
          height: 58 + bottomPadding,
          backgroundColor: Colors.dark.background,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginTop: 1 },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title, tabBarIcon: ({ color, size }) => <MaterialIcons name={tab.icon} size={size} color={color} /> }} />
      ))}
    </Tabs>
  );
}
