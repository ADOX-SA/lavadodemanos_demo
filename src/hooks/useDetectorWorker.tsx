'use client';
import { useEffect, useRef, useState } from "react";
import {
  WorkerRequest,
  WorkerResponse,
  Prediction
} from "@/types/DetectorWorkerTypes";

export const useDetectorWorker = (labels: string[], modelUrl?: string) => {
  const workerRef = useRef<Worker | null>(null);
  const [ready, setReady] = useState(false);
  const [inputShape, setInputShape] = useState<number[] | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);

  useEffect(() => {
  if (!modelUrl || typeof window === "undefined") return;

        workerRef.current = new Worker("/workers/detector.worker.js");

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type } = e.data;

      switch (type) {
        case "ready":
          setReady(true);
          setInputShape(e.data.inputShape);
          break;
        case "result":
          setPredictions(e.data.predictions);
          break;
        case "error":
          console.error("Worker error:", e.data.message);
          break;
      }
    };

    const initMessage: WorkerRequest = {
      type: "init",
      data: { modelUrl, labels }
    };

    workerRef.current.postMessage(initMessage);

    return () => {
      workerRef.current?.terminate();
    };
  }, [modelUrl, labels]);

  const detect = (imageData: ImageData, allowedTrust = 60) => {
    if (ready && workerRef.current) {
      const detectMessage: WorkerRequest = {
        type: "detect",
        data: { imageData, allowedTrust }
      };
      workerRef.current.postMessage(detectMessage);
    }
  };

  return { ready, detect, predictions, inputShape };
};
export default useDetectorWorker;