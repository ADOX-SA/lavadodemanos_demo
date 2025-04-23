"use client";
import { useState, useCallback, useRef } from "react";

const useCountdown = ({
  duration,
  onComplete,
  onChange,
}: {
  duration: number;
  onComplete?: () => void;
  onChange?: (timeLeft: number) => void;
}) => {
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null); // Guarda la referencia del intervalo

  const startCountdown = useCallback(() => {
    if (isCountdownActive) {
      return;
    }

    setCountdownTimeLeft(duration);
    setIsCountdownActive(true);

    // Inicia el intervalo y guarda la referencia
    intervalRef.current = setInterval(() => {
      setCountdownTimeLeft((prev) => {
        const newTimeLeft = prev > 0 ? prev - 1 : 0 // Asegúrate de que no sea negativo;
        onChange?.(newTimeLeft); // Llama a onChange con el nuevo tiempo restante
        console.log("newTimeLeft", newTimeLeft);
        if (newTimeLeft <= 0) {
          clearInterval(intervalRef.current!); // Limpia el intervalo cuando el tiempo se agota
          intervalRef.current = null;
          setIsCountdownActive(false);
          onComplete?.(); // Llama a onComplete cuando el tiempo se agota
        }
        return newTimeLeft;
      });
    }, 1000);
  }, [duration, isCountdownActive, onChange, onComplete]);

  const stopCountdown = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current); // Limpia el intervalo
      intervalRef.current = null;
    }
    setCountdownTimeLeft(0);
    setIsCountdownActive(false);
  }, []);

  return {
    countdownTimeLeft,
    isCountdownActive,
    startCountdown,
    stopCountdown,
  };
};

export default useCountdown;
