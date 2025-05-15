"use client";
import React, { useEffect, useRef } from "react";
import { BorderTimer } from "@/components/BorderTimer";
import EyeOffIcon from "@/components/IconEye/IconEye";
import style from "./CameraFeed.module.css";
interface CameraFeedProps {
  ready: boolean;
  timeLeft: number;
  countdownTimeLeft: number;
  showFinalMessage: boolean;
  cameraRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  detect: (imageData: ImageData, trust: number) => void;
  allowedTrust: number;
  stopDetectionRef: React.MutableRefObject<() => void>;
}

const CameraFeed: React.FC<CameraFeedProps> = ({
  ready,
  timeLeft,
  countdownTimeLeft,
  showFinalMessage,
  cameraRef,
  canvasRef,
  detect,
  allowedTrust,
  stopDetectionRef
}) => {
  useEffect(() => {
  const video = cameraRef.current;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!video || !ctx || !ready) return;

  const waitForVideo = () => {
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(waitForVideo);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    if (stopDetectionRef.current) stopDetectionRef.current();

    const intervalId = setInterval(() => {
      if (!ready || video.readyState !== 4) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      detect(imageData, allowedTrust);
    }, 300);

    stopDetectionRef.current = () => clearInterval(intervalId);
  };

  waitForVideo();
}, [ready]);


  return (
    <div className={style.cameraContainer}>
      <video
        autoPlay
        muted
        ref={cameraRef}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "rotate(180deg)",
        }}
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      <BorderTimer timeLeft={timeLeft} initialTime={8} />

      {countdownTimeLeft > 0 && (
        <div className={style.warningMessage}>
          <h3>Sin actividad reconocida</h3>
          <EyeOffIcon size={120} />
          <p>Reinicio en {countdownTimeLeft}s.</p>
        </div>
      )}

      {showFinalMessage && (
        <div className={style.finalMessage}>
          <p>¡Proceso de lavado completo! 🙌</p>
          <h3>Reinicio en {countdownTimeLeft}s.</h3>
          <p>Presioná <strong>Enter</strong> para reiniciar ahora.</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(CameraFeed);
