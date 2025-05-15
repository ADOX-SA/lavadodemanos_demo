// Nuevo archivo: hooks/useLavadoLogic.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import labels from "../utils/labels.json";
import { soundSuccess } from "@/utils/func.utils";
import useCountdown from "@/hooks/useCountdown";
import useTimer from "@/hooks/useTimer";
import confetti from "canvas-confetti";

export const useLavadoLogic = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Array(labels.length).fill(false));
  const [stepScores, setStepScores] = useState<number[][]>(new Array(labels.length).fill([]).map(() => []));
  const [averages, setAverages] = useState<number[]>(new Array(labels.length).fill(0));
  const [stepConfirmed, setStepConfirmed] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [consecutiveNoHandsFrames, setConsecutiveNoHandsFrames] = useState(0);
  const [showFinalMessage, setShowFinalMessage] = useState(false);

  const stopDetectionRef = useRef<() => void>(() => {});

  const {
    startTimer,
    resetTimer,
    timeLeft,
    pauseTimer
  } = useTimer(5, () => {
    soundSuccess();

    const currentStepScores = stepScores[currentStep];
    const average =
      currentStepScores.length > 0 ?
        currentStepScores.reduce((a, b) => a + b, 0) / currentStepScores.length :
        0;

    setAverages(prev => {
      const newAverages = [...prev];
      newAverages[currentStep] = average;
      return newAverages;
    });

    setCompletedSteps(prev => prev.map((v, i) => (i === currentStep ? true : v)));

    if (currentStep < labels.length - 1) {
      setCurrentStep(prev => prev + 1);
      resetTimer();
      pauseTimer();
    } else {
      setInitializing(false);
      resetTimer();
      pauseTimer();
      setStepScores(prev => {
        const newScores = [...prev];
        newScores[currentStep] = [];
        return newScores;
      });
      setStepConfirmed(false);
      setShowFinalMessage(true);
      startCountdown();
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    }
  });

  const {
    countdownTimeLeft,
    startCountdown,
    stopCountdown,
    isCountdownActive
  } = useCountdown({
    duration: 20,
    onComplete: () => {
      resetProcess();
    },
  });

  const resetProcess = () => {
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

  const skipCurrentStep = () => {
    setCurrentStep(prev => {
      const next = prev + 1;
      setCompletedSteps(completed => completed.map((v, i) => (i === prev ? true : v)));
      setAverages(avg => {
        const newAvg = [...avg];
        newAvg[prev] = 1;
        return newAvg;
      });
      if (next < labels.length) {
        resetTimer();
        pauseTimer();
        return next;
      } else {
        stopDetectionRef.current?.();
        setInitializing(false);
        resetTimer();
        pauseTimer();
        setStepConfirmed(false);
        setShowFinalMessage(true);
        startCountdown();
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        return prev;
      }
    });
  };

  return {
    currentStep,
    completedSteps,
    stepScores,
    averages,
    stepConfirmed,
    initializing,
    consecutiveNoHandsFrames,
    showFinalMessage,
    countdownTimeLeft,
    startTimer,
    resetTimer,
    timeLeft,
    pauseTimer,
    startCountdown,
    stopCountdown,
    isCountdownActive,
    setStepConfirmed,
    setInitializing,
    setConsecutiveNoHandsFrames,
    setStepScores,
    stopDetectionRef,
    resetProcess,
    skipCurrentStep
  };
};
export default useLavadoLogic;
export type LavadoLogic = ReturnType<typeof useLavadoLogic>;