"use client";
import { createContext, useContext, useEffect, useState } from "react";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs";

interface AiModelContextType {
  model: { net: tf.GraphModel; inputShape: number[] } | null;
  loading: { loading: boolean; progress: number };
  setLoading: React.Dispatch<
    React.SetStateAction<{ loading: boolean; progress: number }>
  >;
  setModel: React.Dispatch<
    React.SetStateAction<{ net: tf.GraphModel; inputShape: number[] } | null>
  >;
  modelName: string;
}

const AiModelContext = createContext<AiModelContextType | undefined>(undefined);

export const AiModelContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [model, setModel] = useState<{
    net: tf.GraphModel;
    inputShape: number[];
  } | null>(null);
  const modelName = "hands_model";

  useEffect(() => {
    let isMounted = true;
    tf.ready().then(async () => {
      try {
        const yolov8 = await tf.loadGraphModel(
          `${window.location.href}/${modelName}/model.json`,
          {
            onProgress: (fractions) =>
              isMounted && setLoading({ loading: true, progress: fractions }),
          }
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

    return () => {
      isMounted = false;
    };
  }, []);
  return (
    <AiModelContext.Provider
      value={{ model, loading, setLoading, setModel, modelName }}
    >
      {children}
    </AiModelContext.Provider>
  );
};

export const useAiModelContext = () => {
  const context = useContext(AiModelContext);
  if (!context) {
    throw new Error("useAiModelContext must be used within a AiModelProvider");
  }
  return context;
};
