"use client";
import React, { useEffect, useRef, useState } from "react";
import { Webcam } from "../utils/webcam";
import Loader from "@/components/loader";
import style from "../style/App.module.css";
import IconSteps from "@/components/IconSteps/IconSteps";
import ProgressTime from "@/components/TimeProgress/TimeProgress";
import labels from "../utils/labels.json";
import LogoAdox from "../../public/LogoAdox/Logo";
import TitleProject from "../../public/Titulo/Titulo";
import EyeOffIcon from "@/components/IconEye/IconEye";
import { BorderTimer } from "@/components/BorderTimer";
import useDetectorWorker from "@/hooks/useDetectorWorker";
import { useLavadoLogic } from "@/hooks/useLavadoLogic";
import { CameraFeed } from "@/components/CameraFeed";

export default function Home() {
  const modelName = "hands_model";
  const [modelUrl, setModelUrl] = useState<string | undefined>();
  const webcam = new Webcam();
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streaming, setStreaming] = useState<"camera" | null>(null);

  const {
    currentStep,
    completedSteps,
    averages,
    countdownTimeLeft,
    timeLeft,
    showFinalMessage,
    isCountdownActive,
    resetProcess,
    skipCurrentStep,
    setStepConfirmed,
    pauseTimer,
    startCountdown,
    stopCountdown,
    startTimer,
    setInitializing,
    setConsecutiveNoHandsFrames,
    setStepScores,
    stopDetectionRef,
    initializing,
    stepConfirmed
  } = useLavadoLogic();

  const { ready, detect, predictions } = useDetectorWorker(labels, modelUrl);
  const allowedTrust = 40;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setModelUrl(`${window.location.origin}/${modelName}/model.json`);
    }
  }, [modelName]);
 console.log('rerender')
   useEffect(() => {
    if (predictions.length > 0) {
      if (currentStep < labels.length - 1) stopCountdown();
      setConsecutiveNoHandsFrames(0);

      const boosted = predictions.map(p => {
        if (p.clase === labels[currentStep]) {
          return { ...p, score: Math.min(p.score + 30, 100) };
        } else {
          return { ...p, score: Math.max(p.score - 70, 0) };
        }
      });

      const best = boosted.reduce((max, p) => p.score > max.score ? p : max, boosted[0]);
      const isCurrent = labels.indexOf(best.clase) === currentStep;
      const isValid = best.score >= allowedTrust && isCurrent;

      if (isValid && !stepConfirmed) {
        setInitializing(true);
        setStepConfirmed(true);
        startTimer();
      }

      if (stepConfirmed && isCurrent) {
        setStepScores(prev => {
          const updated = [...prev];
          updated[currentStep] = [...updated[currentStep], best.score];
          return updated;
        });
      }
    } else {
      if (initializing && !isCountdownActive) {
        setConsecutiveNoHandsFrames(prev => {
          const updated = Math.min(prev + 1, 5);
          if (updated >= 5) {
            pauseTimer();
            setStepConfirmed(false);
            startCountdown();
          }
          return updated;
        });
      }
    }
  }, [predictions]);

  useEffect(() => {
    setStepConfirmed(false);
    pauseTimer();
  }, [currentStep]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    webcam.open(cameraRef.current!);
    setStreaming("camera");

    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        resetProcess();
      }
      if (event.key === " ") {
        skipCurrentStep();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showFinalMessage]);

  const fixedAverages = averages.map(avg => avg === 0 ? 62.5 : (avg === 1 ? 0 : avg));
  const generalAverage = (
    fixedAverages.reduce((acc, val) => acc + val, 0) / fixedAverages.length
  ).toFixed(1);

  return (
    <div className={style.centeredGrid}>
      {!ready && <Loader text="Cargando modelo..." progress={(0).toFixed(2)} />}

      <div className={style.header}>
        <TitleProject />
        <LogoAdox />
      </div>

      <div className={style.divider} />

      <div className={style.steps}>
        <p>Control de lavado de manos</p>
        <div>
          {labels.map((_, i) => (
            <IconSteps
              key={i}
              steps={i + 1}
              color={completedSteps[i] || i === currentStep ? "#AA4CF2" : "#D9D9D9"}
            />
          ))}
        </div>
      </div>

      <div className={style.contentText}>
        <p className={style.text}>Seguí el movimiento y ángulo de la imagen izquierda durante el tiempo indicado.</p>
      </div>

      <div className={style.container}>
        <div className={style.column}>
          <div className={style.content1}>
            <div>
              {completedSteps.every(v => v) ? (
                <div className={style.averages}>
                  <h3>Promedios de precisión por paso:</h3>
                  {fixedAverages.map((avg, i) => (
                    <div key={i} className={style.progressItem}>
                      <p>Paso {i + 1}: {avg.toFixed(1)}%</p>
                      <div className={style.progressBar}>
                        <div className={style.progressFill} style={{ width: `${avg}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className={style.generalAverage}>
                    <h4>Promedio general de lavado de manos: {generalAverage}%</h4>
                  </div>
                </div>
              ) : (
                <video key={currentStep} width="480" height="600" autoPlay muted loop>
                  <source src={`/Pasos/Paso${currentStep + 1}.mp4`} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              )}
            </div>
          </div>

          <CameraFeed 
              ready={ready}
              timeLeft={timeLeft}
              countdownTimeLeft={countdownTimeLeft}
              showFinalMessage={showFinalMessage}
              cameraRef={cameraRef}
              canvasRef={canvasRef}
              detect={detect}
              allowedTrust={allowedTrust}
              stopDetectionRef={stopDetectionRef}

          />

          <ProgressTime key={timeLeft} initialTime={timeLeft} />
        </div>
      </div>

      <div className={style.divider} />
    </div>
  );
}