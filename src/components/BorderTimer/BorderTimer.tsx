"use client";
import React from "react";
import styles from "./BorderTimer.module.css";

interface BorderTimerProps {
  timeLeft: number;
  initialTime: number;
}

const BorderTimer: React.FC<BorderTimerProps> = ({ timeLeft, initialTime }) => {
  const progress =
    Math.max(0, Math.min(1, (initialTime - timeLeft) / initialTime)) * 100;

  return (
    <div className={styles.borderWrapper}>
      <span
        className={styles.borderTop}
        style={{ width: `${Math.min(progress, 25) * 4}%` }}
      />
      <span
        className={styles.borderRight}
        style={{
          height: `${Math.max(0, progress - 25) * 4}%`,
        }}
      />
      <span
        className={styles.borderBottom}
        style={{
          width: `${Math.max(0, progress - 50) * 4}%`,
        }}
      />
      <span
        className={styles.borderLeft}
        style={{
          height: `${Math.max(0, progress - 75) * 4}%`,
        }}
      />
    </div>
  );
};

export default BorderTimer;
