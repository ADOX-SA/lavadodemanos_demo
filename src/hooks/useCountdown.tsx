"use client";
import { useState, useEffect, useCallback } from "react";

interface UseCountdownProps {
  duration: number;
  onComplete?: () => void;
  onChange?: (timeLeft: number) => void;
}

const useCountdown = ({
  duration,
  onComplete,
  onChange,
}: UseCountdownProps) => {
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);
  const [isCountdownActive, setIsCountdownActive] = useState(false);

  // Maneja la cuenta atrás y dispara onComplete solo una vez al llegar a 0
  useEffect(() => {
    if (!isCountdownActive) return;

    if (countdownTimeLeft === 0) {
      onComplete?.();
      setIsCountdownActive(false);
      return;
    }

    const timerId = setInterval(() => {
      setCountdownTimeLeft((t) => Math.max(0, t - 1));
    }, 850); 

    return () => clearInterval(timerId);
  }, [isCountdownActive, countdownTimeLeft, onComplete]);

  // Notifica cada cambio de tiempo
  useEffect(() => {
    onChange?.(countdownTimeLeft);
  }, [countdownTimeLeft, onChange]);

  const startCountdown = useCallback(() => {
    if (!isCountdownActive) {
      setCountdownTimeLeft(duration);
      setIsCountdownActive(true);
    }
  }, [duration, isCountdownActive]);

  const stopCountdown = useCallback(() => {
    setIsCountdownActive(false);
    setCountdownTimeLeft(0);
  }, []);

  return {
    countdownTimeLeft,
    isCountdownActive,
    startCountdown,
    stopCountdown,
  };
};

export default useCountdown;
