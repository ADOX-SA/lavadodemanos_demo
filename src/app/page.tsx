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

// import io from "socket.io-client";

export default function Home() {
  const allowedTrust = 50;
  const { startTimer, resetTimer, timeLeft, pauseTimer } = useTimer(2, () => {
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
      //TODO: Valida el ultimo paso y apaga la camara, pone un cartel inidicando que se reinicia en x cantidad de tiempo.
      stopDetectionRef.current?.();
      canvasRef.current
        ?.getContext("2d")
        ?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

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
      // Resetear confirmación al finalizar el tiempo
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

  const fixedAverages = averages.map(avg => (avg === 0 ? 62.5 : avg));
  const generalAverage = (
  fixedAverages.reduce((acc, val) => acc + val, 0) / fixedAverages.length
  ).toFixed(1);
  const [showFinalMessage, setShowFinalMessage] = useState(false);


  // const socket = io('http://localhost:4000');

  // Quiero que al detectar un movimiento valido de la mano, se inicie el temporizador y que al finalizar el tiempo, se reinicie el temporizador y se pase al siguiente paso.

  useEffect(() => {
    if (predicciones.length > 0) {
      if (currentStep < labels.length - 1) {
        stopCountdown(); //Esto rompe el temporizador del cartel de reinicio, y queda el cartel fijo en x segundos.
        // Porque cuando esta el cartel de reinicio, si detecta calquier paso activa esta funcion y cambia el valor del reinicio.
      }
      setConsecutiveNoHandsFrames(0); // Reiniciar el contador de frames sin detección
      const bestPrediction = predicciones.reduce((max, p) => (p.score > max.score ? p : max), predicciones[0]);
      const isCurrentStep = labels.indexOf(bestPrediction.clase) === currentStep;
      const isValid = bestPrediction.score >= allowedTrust && isCurrentStep;

      console.log("Clase:", bestPrediction.clase, "- Score:", bestPrediction.score);
      
      if (isValid && !stepConfirmed) {
        console.log("Si es valido y no esta confirmado.");
        if (currentStep < labels.length - 1) {
          console.log("Si es menor al paso 6. Inicializando...");
          setInitializing(true);
        }
        setStepConfirmed(true); // Confirmar el paso actual
        startTimer(); // Inicia el temporizador al confirmar el paso
      }
      if (stepConfirmed && isCurrentStep) {
        console.log("Si es el paso actual y ya esta confirmado.");
        // Acumular scores solo si es el paso actual (aunque el score sea bajo)
        setStepScores((prev) => {
          const newScores = [...prev];
          newScores[currentStep] = [
            ...newScores[currentStep],
            bestPrediction.score,
          ];
          return newScores;
        });
      }
    }
    // Si no esta detectando nada durante 5 frames
    else {
      if (!initializing) return;
      console.log("entro aca");
      setConsecutiveNoHandsFrames((prev) => Math.min(prev + 1, 5));
      if (consecutiveNoHandsFrames >= 5) {
        pauseTimer(); // Pausar el temporizador si no se detecta movimiento
        setStepConfirmed(false); // Resetear confirmación si no hay manos
        startCountdown(); // Iniciar cuenta regresiva de reinicio
      }
    }
  }, [predicciones]);
  // Quiero que si no se detecta movimiento valido de la mano, se pause el temporizador y se inicie una cuenta regresiva de 8 segundos, si no se detecta movimiento valido de la mano en ese tiempo, se reinicie el temporizador y vuelva al primer paso.

  // Manejo de detección y tiempos
  // useEffect(() => {
  //   if (predicciones.length === 0) {
  //     if (!isCountdownActive) {
  //       setConsecutiveNoHandsFrames((prev) => Math.min(prev + 1, 5));
  //     }
  //     setStepConfirmed(false); // Resetear confirmación si no hay manos
  //   } else {
  //     setConsecutiveNoHandsFrames(0);
  //     if (isCountdownActive) {
  //       stopCountdown();
  //       // setRestartCountdown(0); // Reiniciar el contador de reinicio
  //     }

  //     const bestPrediction = predicciones.reduce(
  //       (max, p) => (p.score > max.score ? p : max),
  //       predicciones[0]
  //     );
  //     const isCurrentStep =
  //       labels.indexOf(bestPrediction.clase) === currentStep;
  //     const isValid = bestPrediction.score >= allowedTrust && isCurrentStep;

  //     console.log(
  //       "Clase:",
  //       bestPrediction.clase,
  //       "- Score:",
  //       bestPrediction.score
  //     );

  //     // Lógica de confirmación de paso
  //     if (isValid && !stepConfirmed) {
  //       // Activa el inicializador solo en los pasos que son menores al paso 6
  //       if (currentStep < labels.length - 1) {
  //         setInitializing(true);
  //       }
  //       setStepConfirmed(true);
  //       startTimer(); // Inicia el temporizador al confirmar el paso
  //     }

  //     // Cambiar esto
  //     // La idea del promedio seria, que tome la cantidad total de todos los pasos incluyendo el actual
  //     // y que lo divida por la suma total del score del paso actual
  //     // y que lo multiplique por 100 para obtener el porcentaje podria ser esta idea. Porque esta calculando mal el promedio, es mas la cuenta esta mal, siempre va a dar bien.

  //     // Otra cosa que estaria bueno es hacer un informe al final del proceso de lavado
  //     // de los pasos que se hicieron en total en cada uno de los pasos, y que se muestre el promedio de cada paso. Esto ayuda a tener un registro para ver que pasos se
  //     // hicieron bien y cuales no.
  //     // Acumular scores solo si es el paso actual (aunque el score sea bajo)
  //   }
  // }, [predicciones, currentStep, isCountdownActive, stepConfirmed]);

  // Resetear confirmación al cambiar de paso
  useEffect(() => {
    setStepConfirmed(false);
    pauseTimer(); // Asegurar que el timer se reinicie al cambiar de paso
  }, [currentStep]);

  // Manejar reinicio por inactividad
  useEffect(() => {
    if (consecutiveNoHandsFrames === 5 && !isCountdownActive && initializing) {
      pauseTimer();
      startCountdown(); // Iniciar cuenta regresiva de reinicio
    }
  }, [consecutiveNoHandsFrames, isCountdownActive, initializing]);

  // Validar paso al terminar el tiempo

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


  // Manejo de teclado para reiniciar el proceso al presionar Enter
  useEffect(() => {
      webcam.open(cameraRef.current!);
      cameraRef.current!.style.display = "block";
      setStreaming("camera");
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter" && showFinalMessage) {
        stopCountdown();
        resetProcess();
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
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover", // Mantiene relación de aspecto cubriendo el contenedor
                  transform: "rotate(180deg)", // Rota 180 grados el video
                }}
              />
              <BorderTimer timeLeft={timeLeft} initialTime={8} />
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />

            <ProgressTime key={timeLeft} initialTime={timeLeft} />
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
        </div>
      </div>
      <div className={style.divider} />
    </div>
  );
}
