"use client";
import { useState, useEffect, useRef, useCallback } from "react";

interface UseCountdownProps {
  duration: number; // en segundos
  onComplete?: () => void;
  onChange?: (timeLeft: number) => void;
}

const useCountdown = ({ duration, onComplete, onChange }: UseCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const update = useCallback((now: number) => {
    if (startTimeRef.current === null) return;

    const elapsed = (now - startTimeRef.current) / 1000;
    const remaining = Math.max(duration - elapsed, 0);
    const rounded = Math.floor(remaining);

    setTimeLeft((prev) => {
      if (prev !== rounded) {
        onChange?.(rounded);
      }
      return rounded;
    });

    if (remaining <= 0) {
      setIsActive(false);
      onComplete?.();
    } else {
      rafIdRef.current = requestAnimationFrame(update);
    }
  }, [duration, onChange, onComplete]);

  useEffect(() => {
    if (!isActive) return;

    console.log("⏳ Countdown iniciado desde useEffect");
    rafIdRef.current = requestAnimationFrame(update);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isActive]);

  const startCountdown = useCallback(() => {
    if (!isActive) {
      console.log("🟢 startCountdown llamado. Duración:", duration);
      startTimeRef.current = performance.now();
      setTimeLeft(duration);
      setIsActive(true);
    }
  }, [isActive, duration]);

  const stopCountdown = useCallback(() => {
    console.log("🔴 stopCountdown llamado");
    setIsActive(false);
    setTimeLeft(0);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
  }, []);

  return {
    countdownTimeLeft: timeLeft,
    isCountdownActive: isActive,
    startCountdown,
    stopCountdown,
  };
};

export default useCountdown;
