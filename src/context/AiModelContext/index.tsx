"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
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
        // 1) Carga del modelo desde public/hands_model/model.json
        const graph = await tf.loadGraphModel(
          `${window.location.origin}/${modelName}/model.json`,
          {
            onProgress: (frac) =>
              isMounted && setLoading({ loading: true, progress: frac }),
          }
        );

        // 2) Extracción y normalización de inputShape
        const rawShape = graph.inputs?.[0]?.shape;
        if (!rawShape || rawShape.length < 4) {
          throw new Error("No se pudo obtener la forma del modelo.");
        }
        const warmupShape = rawShape.map(dim => (dim === null ? 1 : dim)) as number[];

        // 3) Warm-up asíncrono
        const dummy = tf.ones(warmupShape);
        await graph.executeAsync(dummy);
        tf.dispose(dummy);

        // 4) Guardar en estado una vez caliente el modelo
        if (isMounted) {
          setLoading({ loading: false, progress: 1 });
          setModel({ net: graph, inputShape: warmupShape });
        }
      } catch (error) {
        console.error("Error cargando o calentando el modelo:", error);
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
    throw new Error(
      "useAiModelContext debe usarse dentro de un AiModelContextProvider"
    );
  }
  return context;
};
