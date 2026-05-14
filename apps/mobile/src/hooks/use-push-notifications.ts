import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("appointments", {
      name: "Agendamentos",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function triggerNewBookingNotification(scheduledAt?: string) {
  const timeStr = scheduledAt
    ? new Date(scheduledAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
    : undefined;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Novo agendamento!",
      body: timeStr ? `Marcado para ${timeStr}` : "Verifique sua agenda",
      sound: "default",
    },
    trigger: null,
  });
}

export function usePushNotifications(venueId: string | undefined) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (!venueId) return;

    channelRef.current = supabase
      .channel(`notif-apts-${venueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `venue_id=eq.${venueId}`,
        },
        (payload) => {
          const apt = payload.new as { scheduled_at?: string };
          triggerNewBookingNotification(apt.scheduled_at);
        },
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [venueId]);
}
