"use client";
import React, { useEffect, useState } from "react";
import styles from "./TimeProgress.module.css";

interface ProgressProps {
  initialTime: number;
}

const ProgressTime: React.FC<ProgressProps> = ({ initialTime }) => {
  const [time, setTime] = useState(initialTime);

  useEffect(() => {
    setTime(initialTime); // Se actualiza cuando cambia initialTime
  }, [initialTime]);

  return (
    <div className={styles.progressContainer}>
      <div className={styles.text}>
        <p>{time}</p>
      </div>
    </div>
  );
};

export default ProgressTime;
