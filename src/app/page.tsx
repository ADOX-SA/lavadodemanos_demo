"use client";
import React, { useRef, useState, useEffect } from "react";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";
import { Webcam } from "../utils/webcam";
import Loader from "@/components/loader";
import { detectVideo } from "../utils/detect";
import style from '../style/App.module.css';
import IconSteps from "@/components/IconSteps/IconSteps";
import ProgressTime from "@/components/TimeProgress/TimeProgress";
import labels from "../utils/labels.json";
import { soundNotificacion, soundSuccess } from "@/utils/func.utils";
import LogoAdox from "../../public/LogoAdox/Logo";
import TitleProject from "../../public/Titulo/Titulo";
import EyeOffIcon from "@/components/IconEye/IconEye";

export default function Home() {
  const time = 15;
  const allowedTrust = 50;
  const [remainingTime, setRemainingTime] = useState(time);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Array(labels.length).fill(false));
  const [predicciones, setPredicciones] = useState<{ clase: string; score: number }[]>([]);
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [model, setModel] = useState<{ net: tf.GraphModel | null; inputShape: number[] }>({ net: null, inputShape: [1, 0, 0, 3] });
  const [timerStarted, setTimerStarted] = useState(false);
  const [streaming, setStreaming] = useState<"camera" | null>(null);
  const [consecutiveNoHandsFrames, setConsecutiveNoHandsFrames] = useState(0);
  const [restartCountdown, setRestartCountdown] = useState(0);
  const [countdownActive, setCountdownActive] = useState(false);
  const [stepScores, setStepScores] = useState<number[][]>(new Array(labels.length).fill([]).map(() => []));
  const [averages, setAverages] = useState<number[]>(new Array(labels.length).fill(0));
  const [stepConfirmed, setStepConfirmed] = useState(false); 
  const [initializing, setInitializing] = useState(false);

  const stopDetectionRef = useRef<() => void>(() => {});
  const cameraRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const webcam = new Webcam();
  const modelName = "hands_model";

  // Cargar modelo
  useEffect(() => {
    let isMounted = true;
    tf.ready().then(async () => {
      try {
        const yolov8 = await tf.loadGraphModel(
          `${window.location.href}/${modelName}/model.json`,
          { onProgress: (fractions) => isMounted && setLoading({ loading: true, progress: fractions }) }
        );

      const inputShape = yolov8.inputs?.[0]?.shape;
      if (!inputShape) {
        throw new Error("No se pudo obtener la forma del modelo.");
      }

        const dummyInput = tf.ones(inputShape);
        const warmupResults = yolov8.execute(dummyInput);

        if (isMounted) {
          setLoading({ loading: false, progress: 1 });
          setModel({ net: yolov8, inputShape });
        }

        tf.dispose([warmupResults, dummyInput]);
      } catch (error) {
        console.error("Error cargando el modelo:", error);
      }
    });

    return () => { isMounted = false; };
  }, []);

  // Temporizador principal
  useEffect(() => {
    if (timerStarted) {
      intervalRef.current = setInterval(() => {
        setRemainingTime(prev => Math.max(prev - 1, 0));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerStarted]);

  // Manejo de detección y tiempos
  useEffect(() => {
    if (predicciones.length === 0) {
      if (!countdownActive) {
        setConsecutiveNoHandsFrames(prev => Math.min(prev + 1, 5));
      }
      setStepConfirmed(false); // Resetear confirmación si no hay manos
    } else {
      setConsecutiveNoHandsFrames(0);
      if (countdownActive) {
        setRestartCountdown(0);
        setCountdownActive(false);
      }

      const bestPrediction = predicciones.reduce((max, p) => (p.score > max.score ? p : max), predicciones[0]);
      const isCurrentStep = labels.indexOf(bestPrediction.clase) === currentStep;
      const isValid = bestPrediction.score >= allowedTrust && isCurrentStep;

      console.log("Clase:", bestPrediction.clase, "- Score:", bestPrediction.score);

      // Lógica de confirmación de paso
      if (isValid && !stepConfirmed) {
        // Activa el inicializador solo en los pasos que son menores al paso 6
        if (currentStep < labels.length - 1) {
          setInitializing(true);
        }
        setStepConfirmed(true);
        setTimerStarted(true);
      }

       // Cambiar esto
      // La idea del promedio seria, que tome la cantidad total de todos los pasos incluyendo el actual
      // y que lo divida por la suma total del score del paso actual
      // y que lo multiplique por 100 para obtener el porcentaje podria ser esta idea. Porque esta calculando mal el promedio, es mas la cuenta esta mal, siempre va a dar bien.
      
      // Otra cosa que estaria bueno es hacer un informe al final del proceso de lavado 
      // de los pasos que se hicieron en total en cada uno de los pasos, y que se muestre el promedio de cada paso. Esto ayuda a tener un registro para ver que pasos se 
      // hicieron bien y cuales no. 
      // Acumular scores solo si es el paso actual (aunque el score sea bajo)
      if (stepConfirmed && isCurrentStep) {
        setStepScores(prev => {
          const newScores = [...prev];
          newScores[currentStep] = [...newScores[currentStep], bestPrediction.score];
          return newScores;
        });
      }
    }
  }, [predicciones, currentStep, countdownActive, stepConfirmed]);

  // Resetear confirmación al cambiar de paso
  useEffect(() => {
    setStepConfirmed(false);
    setTimerStarted(false); // Asegurar que el timer se reinicie al cambiar de paso
  }, [currentStep]);

  // Manejar reinicio por inactividad
  useEffect(() => {
    if (consecutiveNoHandsFrames === 5 && !countdownActive && initializing) {
      setTimerStarted(false);
      setCountdownActive(true);
      setRestartCountdown(20);
      console.log("Iniciando cuenta regresiva de reinicio");
    }
  }, [consecutiveNoHandsFrames, countdownActive, initializing]);

  // Manejar cuenta regresiva de reinicio
  useEffect(() => {
    if (countdownActive) {
      const timeout = setTimeout(() => {
        soundNotificacion();
      }, 500);
      console.log("Cuenta regresiva ACTIVADA")
      const interval = setInterval(() => {
        setRestartCountdown(prev => {
          if (prev <= 1 && prev !== 0) {
            console.log("Reiniciando proceso...");
            resetProcess();
            setCountdownActive(false);
            return 0;
          }
          console.log("Decrementando cuenta regresiva:", prev - 1);
          return prev - 1;
        });
      }, 1000);

      return () => {
        console.log("Limpiando intervalo de cuenta regresiva");
        clearTimeout(timeout);
        clearInterval(interval);
      };
    }
  }, [countdownActive]);

  // Validar paso al terminar el tiempo
  useEffect(() => {
    if (remainingTime === 0 && timerStarted) {
      const success = stepScores[currentStep].length > 0; // Validación basada en detecciones registradas

      if (success) {
        if (!completedSteps[currentStep]) {
          soundSuccess();
          const currentStepScores = stepScores[currentStep];
          const average = currentStepScores.length > 0
            ? currentStepScores.reduce((a, b) => a + b, 0) / currentStepScores.length
            : 0;
          setAverages(prev => {
            const newAverages = [...prev];
            newAverages[currentStep] = average;
            return newAverages;
          });
        }

        setCompletedSteps(prev => prev.map((v, i) => i === currentStep ? true : v));

        if (currentStep < labels.length - 1) {
          setCurrentStep(prev => prev + 1);
          setRemainingTime(time);
          setTimerStarted(false);
        } else {
            //Valida el ultimo paso y apaga la camara.
            webcam.close(cameraRef.current!);
            cameraRef.current!.style.display = "none";
            setStreaming(null);
  
            stopDetectionRef.current?.();
            canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          setInitializing(false);
        }
      } else {
        setRemainingTime(time);
        setTimerStarted(false);
        setStepScores(prev => {
          const newScores = [...prev];
          newScores[currentStep] = [];
          return newScores;
        });
      }
      setStepConfirmed(false); // Resetear confirmación al finalizar el tiempo
    }
  }, [remainingTime, timerStarted]);

  // Resetea todo a los valores inciales.
  const resetProcess = () => {
    console.log("Reiniciando todo el proceso...");
    setCurrentStep(0);
    setCompletedSteps(new Array(labels.length).fill(false));
    setRemainingTime(time);
    setTimerStarted(false);
    setConsecutiveNoHandsFrames(0);
    setRestartCountdown(0);
    setCountdownActive(false);
    setStepScores(new Array(labels.length).fill([]).map(() => []));
    setAverages(new Array(labels.length).fill(0));
    setStepConfirmed(false);
    setInitializing(false);
  };

  // Manejo de cámara
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        if (!streaming) {
          webcam.open(cameraRef.current!);
          cameraRef.current!.style.display = "block";
          setStreaming("camera");
        } else {
          webcam.close(cameraRef.current!);
          cameraRef.current!.style.display = "none";
          setStreaming(null);

          stopDetectionRef.current?.();
          canvasRef.current?.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [streaming]);

  return (
    <div className={style.centeredGrid}>
      {loading.loading && <Loader text="Cargando modelo..." progress={(loading.progress * 100).toFixed(2)} />}
      <div className={style.header}>
        <TitleProject/>
        <LogoAdox/>
      </div>
      <div className={style.divider} />
      <div className={style.steps}>
        <p>Control de lavado de manos</p>
        <div>
          {labels.map((_, index) => (
            <IconSteps
              key={index}
              steps={index+1}
              color={completedSteps[index] ? "#AA4CF2" : index === currentStep ? "#AA4CF2" : "#D9D9D9"}
            />
          ))}
        </div>
      </div>
      <div className={style.contentText}>
          <p className={style.text}>
            Seguí el movimiento y ángulo de la imagen izquierda durante el tiempo indicado.
          </p>
      </div>
      <div className={style.container}>
        <div className={style.column}>
          <div className={style.content1}>
            <div>
              {completedSteps.every(v => v) ? (
                <div className={style.averages}>
                  <h3>Promedios de precisión:</h3>
                  {averages.map((avg, index) => (
                    <div key={index} className={style.progressItem}>
                      <p>Paso {index + 1}: {avg.toFixed(1)}%</p>
                      <div className={style.progressBar}>
                        <div className={style.progressFill} style={{ width: `${avg}%` }} />
                      </div>
                    </div>
                  ))}
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
                  <source src={`/Pasos/Paso${currentStep +1}.mp4`} type="video/mp4" />
                  Tu navegador no soporta el elemento de video.
                </video>
              )}
            </div>
          </div>
          <div>
            <div style={{ 
              width: 480, 
              height: 600,
              overflow: "hidden",
              backgroundImage: "url('/Camera/Camera.jpg')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative"
            }}>
                <video
                  autoPlay
                  muted
                  ref={cameraRef}
                  onPlay={() => {
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
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <ProgressTime key={remainingTime} initialTime={remainingTime}/>
            {restartCountdown > 0 && (
              <div className={style.warningMessage} style={{
                position: "absolute",
                top: 5,
                left: 960,
                width: "26%",
                height: "95%",
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                textAlign: "center",
                padding: 20,
                zIndex: 10
              }}>
                <h3>Sin actividad reconocida</h3>
                <EyeOffIcon size={120} />
                <p>Reinicio en {restartCountdown}s.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={style.divider} />
    </div>
  );
}