import { useEffect, useState } from 'react';

function secondsUntil(isoDate: string | undefined, nowMs = Date.now()): number {
  if (!isoDate) return 0;
  const target = new Date(isoDate).getTime();
  if (Number.isNaN(target)) return 0;
  return Math.max(0, Math.ceil((target - nowMs) / 1000));
}

function formatCooldown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) return `${seconds} s`;
  if (seconds === 0) return `${minutes} min`;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Cuenta regresiva hasta poder reenviar el código MFA (cooldown del servidor). */
export function useMfaResendCooldown(resendAvailableAt?: string) {
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(resendAvailableAt));

  useEffect(() => {
    setSecondsLeft(secondsUntil(resendAvailableAt));
    const timer = window.setInterval(() => {
      setSecondsLeft(secondsUntil(resendAvailableAt));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  return {
    canResend: secondsLeft <= 0,
    secondsLeft,
    cooldownLabel: formatCooldown(secondsLeft),
  };
}
