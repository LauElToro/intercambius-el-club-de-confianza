import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { notificacionesService } from "@/services/notificaciones.service";

const SOUND_PREF_KEY = "intercambius_notification_sound";
const POLL_MS = 12_000;
let sharedPrevNoLeidas: number | null = null;

function playNotificationSound() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SOUND_PREF_KEY) === "off") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.26);
    osc.onended = () => void ctx.close();
  } catch {
    // ignore autoplay / AudioContext errors
  }
}

/** Polling de notificaciones + sonido cuando aumentan las no leídas. */
export function useNotificationAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notificaciones", user?.id],
    queryFn: () => notificacionesService.getNotificaciones(15),
    enabled: !!user?.id,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });

  useEffect(() => {
    if (!user?.id || data == null) return;
    const current = data.noLeidas ?? 0;
    if (sharedPrevNoLeidas != null && current > sharedPrevNoLeidas) {
      playNotificationSound();
    }
    sharedPrevNoLeidas = current;
  }, [data?.noLeidas, user?.id]);

  return {
    noLeidas: data?.noLeidas ?? 0,
    notificaciones: data?.notificaciones ?? [],
    isLoading: !data && !!user?.id,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ["notificaciones"] }),
  };
}

export function setNotificationSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_PREF_KEY, enabled ? "on" : "off");
}

export function isNotificationSoundEnabled(): boolean {
  return localStorage.getItem(SOUND_PREF_KEY) !== "off";
}
