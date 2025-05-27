"use client";
import React from "react";
import styles from "./BorderTimer.module.css";

interface BorderTimerProps {
  timeLeft: number;
  initialTime: number;
}

const BorderTimer: React.FC<BorderTimerProps> = ({ timeLeft, initialTime }) => {
  const adjustedInitialTime = initialTime -1
  const adjustedTimeLeft = timeLeft - 1;
  const progress =
    Math.max(0, Math.min(1, (adjustedInitialTime - adjustedTimeLeft) / adjustedInitialTime)) * 100;

  return (
    <div className={styles.borderWrapper}>
      <span
        className={styles.borderTop}
        style={{ width: `${Math.min(progress, 25) * 4}%` }}
      />
      <span
        className={styles.borderRight}
        style={{
          height: `${Math.min(Math.max(0, progress - 25), 25) * 4}%`,
        }}
      />
      <span
        className={styles.borderBottom}
        style={{
          width: `${Math.min(Math.max(0, progress - 50), 25) * 4}%`,
        }}
      />
      <span
        className={styles.borderLeft}
        style={{
          height: `${Math.min(Math.max(0, progress - 75), 25) * 4}%`,
        }}
      />
    </div>
  );
};

export default BorderTimer;
