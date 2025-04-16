"use client";
import { useEffect, useState, useCallback } from "react";

const useTimer = (duration: number, onComplete?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (onComplete) {
        onComplete();
      }
    }

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  // Memorizar las funciones para evitar que cambien entre renders
  const startTimer = useCallback(() => {
    setIsActive(true);
  }, []);

  const resetTimer = useCallback(() => {
    setTimeLeft(duration);
    setIsActive(false);
  }, [duration]);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    timeLeft,
    isActiveTimer: isActive,
    startTimer,
    resetTimer,
    pauseTimer,
  };
};

export default useTimer;
