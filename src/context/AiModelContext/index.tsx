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

    const loadModel = async () => {
      try {
        // Intenta cargar el modelo desde IndexedDB
        let yolov8 = await tf.loadGraphModel(`indexeddb://${modelName}`);
        console.log("Modelo cargado desde IndexedDB");

        const inputShape = yolov8.inputs?.[0]?.shape;
        if (!inputShape) {
          throw new Error("No se pudo obtener la forma del modelo.");
        }

        if (isMounted) {
          setLoading({ loading: false, progress: 1 });
          setModel({ net: yolov8, inputShape });
        }
      } catch (error) {
        console.log("No se encontró el modelo en IndexedDB, cargando desde el servidor...");
        // Si no está en IndexedDB, cárgalo desde el servidor
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

        // Guarda el modelo en IndexedDB para futuras cargas
        await yolov8.save(`indexeddb://${modelName}`);
        console.log("Modelo guardado en IndexedDB");

        if (isMounted) {
          setLoading({ loading: false, progress: 1 });
          setModel({ net: yolov8, inputShape });
        }
      }
    };

    tf.ready().then(loadModel).catch((error) => {
      console.error("Error cargando el modelo:", error);
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
