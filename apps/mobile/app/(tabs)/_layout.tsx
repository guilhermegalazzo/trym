"use client";

import { Tabs, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Home, CalendarCheck2, Users, User } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth-store";
import { useVenue } from "@/hooks/use-venue";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { TabBarFab } from "@/components/ui/tab-bar-fab";

const ACTIVE = "#0F766E";
const INACTIVE = "#94a3b8";
const ICON_SIZE = 22;

function PushNotificationSetup() {
  const { data: venue } = useVenue();
  usePushNotifications(venue?.id);
  return null;
}

export default function TabsLayout() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator color={ACTIVE} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <>
      <PushNotificationSetup />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          height: 64,
          borderTopWidth: 1,
          borderTopColor: "#f1f5f9",
          backgroundColor: "#ffffff",
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => (
            <Home size={ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color }) => (
            <CalendarCheck2 size={ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-booking"
        options={{
          title: "",
          tabBarButton: () => <TabBarFab />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color }) => (
            <Users size={ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <User size={ICON_SIZE} color={color} strokeWidth={1.8} />
          ),
        }}
      />

      {/* Hide legacy screens from tab bar */}
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="activity" options={{ href: null }} />
    </Tabs>
    </>
  );
}
