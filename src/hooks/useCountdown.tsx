import { soundNotificacion } from "@/utils/func.utils";
import { useEffect, useState } from "react";

const useCountdown = ({
  duration,
  onComplete,
}: {
  duration: number;
  onComplete: () => void;
}) => {
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdownTimeLeft, setCountdownTimeLeft] = useState(0);

  const startCountdown = () => {
    setCountdownTimeLeft(duration);
    setIsCountdownActive(true);
  };
  const stopCountdown = () => {
    setCountdownTimeLeft(0);
    setIsCountdownActive(false);
  };

  useEffect(() => {
    // SE TRABA Y RE RENDERIZA 20 mil vece spor segundo
    let timer: NodeJS.Timeout;
    if (isCountdownActive && countdownTimeLeft > 0) {
      timer = setInterval(() => {
        setCountdownTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (countdownTimeLeft === 0 && isCountdownActive) {
      setIsCountdownActive(false);
      onComplete();
    }

    return () => clearInterval(timer);
  }, [isCountdownActive, countdownTimeLeft, onComplete]);

  return {
    countdownTimeLeft,
    isCountdownActive,
    setIsActive: setIsCountdownActive,
    stopCountdown,
    startCountdown,
  };
};
export default useCountdown;
