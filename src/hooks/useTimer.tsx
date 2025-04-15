import { useEffect, useState } from "react";

const useTimer = (duration: number) => {
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
    }

    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const startTimer = () => {
    setIsActive(true);
  };

  const resetTimer = () => {
    setTimeLeft(duration);
    setIsActive(false);
  };

  const pauseTimer = () => {
    setIsActive(false);
  };

  return {
    timeLeft,
    isActiveTimer: isActive,
    startTimer,
    resetTimer,
    pauseTimer,
  };
};

export default useTimer;
