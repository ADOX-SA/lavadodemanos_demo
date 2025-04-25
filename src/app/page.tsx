"use client";
import React, { useRef, useState, useEffect } from "react";
import { Webcam } from "../utils/webcam";
import Loader from "@/components/loader";
import { detectVideo } from "../utils/detect";
import style from "../style/App.module.css";
import IconSteps from "@/components/IconSteps/IconSteps";
import ProgressTime from "@/components/TimeProgress/TimeProgress";
import labels from "../utils/labels.json";
import { soundSuccess } from "@/utils/func.utils";
import LogoAdox from "../../public/LogoAdox/Logo";
import TitleProject from "../../public/Titulo/Titulo";
import EyeOffIcon from "@/components/IconEye/IconEye";
import useTimer from "@/hooks/useTimer";
import { useAiModelContext } from "@/context/AiModelContext";
import useCountdown from "@/hooks/useCountdown";
import { BorderTimer } from "@/components/BorderTimer";
import confetti from "canvas-confetti";

export default function Home() {
  const allowedTrust = 40;
  const { startTimer, resetTimer, timeLeft, pauseTimer } = useTimer(5, () => {
    soundSuccess();
    const currentStepScores = stepScores[currentStep];
    const average =
      currentStepScores.length > 0
        ? currentStepScores.reduce((a, b) => a + b, 0) /
          currentStepScores.length
        : 0;
    setAverages((prev) => {
      const newAverages = [...prev];
      newAverages[currentStep] = average;
      return newAverages;
    });

    setCompletedSteps((prev) =>
      prev.map((v, i) => (i === currentStep ? true : v))
    );

    if (currentStep < labels.length - 1) {
      setCurrentStep((prev) => prev + 1);
      resetTimer(); // Reinicia el temporizador para el siguiente paso
      pauseTimer();
    } else {
      //TODO: Valida el ultimo paso, pone un cartel inidicando que se reinicia en x cantidad de tiempo.
      setInitializing(false);
      resetTimer();
      pauseTimer();
      setStepScores((prev) => {
        const newScores = [...prev];
        newScores[currentStep] = [];
        return newScores;
      });
      setStepConfirmed(false);
      setShowFinalMessage(true); // 👈 Mostrá el mensaje final
      startCountdown(); // 👈 Iniciá la cuenta regresiva
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
      });
    }
  });
  const { loading, model } = useAiModelContext();
  const { countdownTimeLeft, startCountdown, stopCountdown, isCountdownActive } = useCountdown({
    duration: 20,
    onComplete: () => {
      resetProcess();
    },
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(
    new Array(labels.length).fill(false)
  );
  const [predicciones, setPredicciones] = useState<
    { clase: string; score: number }[]
  >([]);

  const [streaming, setStreaming] = useState<"camera" | null>(null);
  const [consecutiveNoHandsFrames, setConsecutiveNoHandsFrames] = useState(0);
  const [stepScores, setStepScores] = useState<number[][]>(new Array(labels.length).fill([]).map(() => []));
  const [averages, setAverages] = useState<number[]>(new Array(labels.length).fill(0));
  const [stepConfirmed, setStepConfirmed] = useState(false);
  const [initializing, setInitializing] = useState(false);

  const stopDetectionRef = useRef<() => void>(() => {});
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const webcam = new Webcam();

  const fixedAverages = averages.map(avg => 
    avg === 0 ? 62.5 : (avg === 1 ? 0 : avg)
  );
    const generalAverage = (
  fixedAverages.reduce((acc, val) => acc + val, 0) / fixedAverages.length
  ).toFixed(1);
  const [showFinalMessage, setShowFinalMessage] = useState(false);


  useEffect(() => {
    if (predicciones.length > 0) {
      if (currentStep < labels.length - 1) {
        stopCountdown(); // ⏹️ Detenemos la cuenta regresiva de reinicio si hay detección válida
      }
  
      setConsecutiveNoHandsFrames(0); // 🧹 Reiniciar el contador de frames sin detección
  
      // 🎯 Aplicar boost al paso actual si coincide (siempre), para mejorar la detección
      const boostedPredicciones = predicciones.map((p) => {
        if (p.clase === labels[currentStep]) {
          // BOOST al paso actual
          return {
            ...p,
            score: Math.min(p.score + 30, 100),
          };
        } else {
          // PENALIZACIÓN a los otros pasos
          return {
            ...p,
            score: Math.max(p.score - 70, 0), // Asegurarse que no baje de 0
          };
        }
      });
      
  
      // 🔍 Determinar la mejor predicción
      const bestPrediction = boostedPredicciones.reduce(
        (max, p) => (p.score > max.score ? p : max),
        boostedPredicciones[0]
      );
  
      console.log("🚀 Best prediction (with boost if applicable):", bestPrediction);
  
      const isCurrentStep = labels.indexOf(bestPrediction.clase) === currentStep;
      const isValid = bestPrediction.score >= allowedTrust && isCurrentStep;
  
      if (isValid && !stepConfirmed) {
        console.log("✅ Paso válido detectado, inicializando...");
        setInitializing(true);
        setStepConfirmed(true); // Confirmamos este paso
        startTimer(); // ⏱️ Iniciamos el temporizador para validarlo
      }
  
      if (stepConfirmed && isCurrentStep) {
        console.log("📈 Acumulando score para promedio del paso actual");
        setStepScores((prev) => {
          const newScores = [...prev];
          newScores[currentStep] = [
            ...newScores[currentStep],
            bestPrediction.score,
          ];
          return newScores;
        });
      }
    } else {
      // 📉 Si no se detecta nada, acumulamos frames sin manos
      if (initializing) {
        console.log("👋 No se detectan manos, acumulando frames vacíos");
        setConsecutiveNoHandsFrames((prev) => Math.min(prev + 1, 5));
      }
    }
  }, [predicciones]);

  // Asegurar que el timer se reinicie al cambiar de paso
  useEffect(() => {
    setStepConfirmed(false);
    pauseTimer(); 
  }, [currentStep, pauseTimer]);

  // Manejar reinicio por inactividad
  useEffect(() => {
    if (consecutiveNoHandsFrames >= 5 && !isCountdownActive && initializing) {
      console.log("🔁 Pausando por inactividad");
      pauseTimer();
      setStepConfirmed(false);
      startCountdown(); // 🕒 Iniciamos cuenta regresiva para reiniciar
    }
  }, [consecutiveNoHandsFrames, isCountdownActive, initializing, pauseTimer, startCountdown,]);

  // Resetea todo a los valores inciales.
  const resetProcess = () => {
    console.log("Reiniciando todo el proceso...");
    setCurrentStep(0);
    setCompletedSteps(new Array(labels.length).fill(false));
    resetTimer();
    pauseTimer();
    setConsecutiveNoHandsFrames(0);
    stopCountdown();
    setStepScores(new Array(labels.length).fill([]).map(() => []));
    setAverages(new Array(labels.length).fill(0));
    setStepConfirmed(false);
    setInitializing(false);
    setShowFinalMessage(false);
  };

  // Pasa al paso sigueinte, sino hay siguiente reinicia todo el proceso.
  const skipCurrentStep = () => {
    setCurrentStep((prevStep) => {
      const nextStep = prevStep + 1;
      console.log("⏩ Saltando del paso", prevStep, "al", nextStep);
  
      setCompletedSteps((prev) =>
        prev.map((v, i) => (i === prevStep ? true : v))
      );
  
      setAverages((prev) => {
        const newAverages = [...prev];
        newAverages[prevStep] = 1;
        return newAverages;
      });
  
      if (nextStep < labels.length) {
        resetTimer();
        pauseTimer();
        return nextStep;
      } else {
        // Si ya estamos en el último paso, finalizar
        stopDetectionRef.current?.();
        canvasRef.current
          ?.getContext("2d")
          ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
        setInitializing(false);
        resetTimer();
        pauseTimer();
        setStepConfirmed(false);
        setShowFinalMessage(true);
        startCountdown();
  
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
        });
  
        return prevStep; // No avanzar más allá
      }
    });
  };

  // TODO: Arreglar esto...
  // Manejo de la tecla Enter para reiniciar el proceso al finalizar:
  // Usamos una ref para leer el valor actualizado de `showFinalMessage`
  // porque de la otra forma, al llegar al final y al reiniciar, la detección de fotogramas se detiene. Nose que onda con eso D:

  useEffect(() => {
    webcam.open(cameraRef.current!);
    cameraRef.current!.style.display = "block";
    setStreaming("camera");
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" ) {
        stopCountdown();
        resetProcess();
      }
      if(event.key === " ") {
        // hacer funcion que salte el paso actual.
        skipCurrentStep();
      }
    };
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showFinalMessage]);
  
  return (
    <div className={style.centeredGrid}>
      {loading.loading && (
        <Loader
          text="Cargando modelo..."
          progress={(loading.progress * 100).toFixed(2)}
        />
      )}
      <div className={style.header}>
        <TitleProject />
        <LogoAdox />
      </div>
      <div className={style.divider} />
      <div className={style.steps}>
        <p>Control de lavado de manos</p>
        <div>
          {labels.map((_, index) => (
            <IconSteps
              key={index}
              steps={index + 1}
              color={
                completedSteps[index]
                  ? "#AA4CF2"
                  : index === currentStep
                  ? "#AA4CF2"
                  : "#D9D9D9"
              }
            />
          ))}
        </div>
      </div>
      <div className={style.contentText}>
        <p className={style.text}>
          Seguí el movimiento y ángulo de la imagen izquierda durante el tiempo
          indicado.
        </p>
      </div>
      <div className={style.container}>
        <div className={style.column}>
          <div className={style.content1}>
          <div>
              {completedSteps.every((v) => v) ? (
                <div className={style.averages}>
                  <h3>Promedios de precisión por paso:</h3>
                  {fixedAverages.map((avg, index) => (
                    <div key={index} className={style.progressItem}>
                      <p>Paso {index + 1}: {avg.toFixed(1)}%</p>
                      <div className={style.progressBar}>
                        <div
                          className={style.progressFill}
                          style={{ width: `${avg}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className={style.generalAverage}>
                    <h4>Promedio general de lavado de manos: {generalAverage}%</h4>
                  </div>
                </div>
              ) : (
                <video
                  key={currentStep}
                  width="480"
                  height="600"
                  autoPlay
                  muted
                  loop
                >
                  <source
                    src={`/Pasos/Paso${currentStep + 1}.mp4`}
                    type="video/mp4"
                  />
                  Tu navegador no soporta el elemento de video.
                </video>
              )}
        </div>
          </div>
          <div>
            <div className={style.cameraContainer}>
              <video
                autoPlay
                muted
                ref={cameraRef}
                onPlay={() => {
                  if (!cameraRef.current || !canvasRef.current || !model)
                    return;
                  if (stopDetectionRef.current) stopDetectionRef.current();
                    stopDetectionRef.current = detectVideo(
                      cameraRef.current,
                      model,
                      canvasRef.current,
                      allowedTrust,
                      (pred) => setPredicciones(pred)
                    );
                  }
                }
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover", // Mantiene relación de aspecto cubriendo el contenedor
                  transform: "rotate(180deg)", // Rota 180 grados el video
                }}
              />

              {/* 2) El canvas (overlay para dibujar detecciones) */}
              {/* <canvas ref={canvasRef} style={{ display: "none" }} /> */}
              <canvas
                ref={canvasRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  pointerEvents: "none",    // para que no interfiera con clics
                  zIndex: 2,
                }}
              />

              {/* 3) El BorderTimer como borde alrededor del video */}
              <BorderTimer timeLeft={timeLeft} initialTime={8} />

              {/* Mensaje de inactividad */}
              {countdownTimeLeft > 0 && (
                <div className={style.warningMessage}>
                  <h3>Sin actividad reconocida</h3>
                  <EyeOffIcon size={120} />
                  <p>Reinicio en {countdownTimeLeft}s.</p>
                </div>
              )}

              {/* Mensaje final */}
              {showFinalMessage && (
                <div className={style.finalMessage}>
                  <p>¡Proceso de lavado completo! 🙌</p>
                  <h3>Reinicio en {countdownTimeLeft}s.</h3>
                  <p>Presioná <strong>Enter</strong> para reiniciar ahora.</p>
                </div>
              )}
            </div>
            
            {/* 6) Y fuera de la cámara puedes dejar el ProgressTime */}
            <ProgressTime key={timeLeft} initialTime={timeLeft} />
          </div>
        </div>
      </div>
      <div className={style.divider} />
    </div>
  );
}
