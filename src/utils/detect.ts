import * as tf from "@tensorflow/tfjs";
import labels from "./labels.json";

const numClass = labels.length;

/**
 * Preprocess image / frame before forwarded into the model
 * @param {HTMLVideoElement|HTMLImageElement} source
 * @param {Number} modelWidth
 * @param {Number} modelHeight
 * @returns input tensor, xRatio and yRatio
 */
const preprocess = (
  source: HTMLVideoElement | HTMLImageElement,
  modelWidth: number,
  modelHeight: number
) => {
  // Verificación más estricta del estado del video
  if (source instanceof HTMLVideoElement) {
    if (
      source.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      source.videoWidth === 0 || 
      source.videoHeight === 0
    ) {
      console.error("Fuente de video no válida");
      return [null, null, null];
    }
  }

  let xRatio, yRatio; // ratios for boxes

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);

    // padding image to square => [n, m] to [n, n], n > m
    const [h, w] = img.shape.slice(0, 2); // get source width and height
    const maxSize = Math.max(w, h); // get max size
    const imgPadded = img.pad([
      [0, maxSize - h], // padding y [bottom only]
      [0, maxSize - w], // padding x [right only]
      [0, 0],
    ]);

    xRatio = maxSize / w; // update xRatio
    yRatio = maxSize / h; // update yRatio

    return tf.image
      .resizeBilinear(imgPadded as tf.Tensor3D, [modelWidth, modelHeight]) // resize frame
      .div(255.0) // normalize
      .expandDims(0); // add batch
  });

  return [input, xRatio, yRatio];
};

/**
 * Function to detect video from every source.
 * @param {HTMLVideoElement} vidSource video source
 * @param {tf.GraphModel} model loaded YOLOv8 tensorflow.js model
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */

export const detectAllClasses = async (
  source: HTMLImageElement | HTMLVideoElement,
  model: { net: tf.GraphModel; inputShape: number[] },
  canvasRef: HTMLCanvasElement,
  allowedTrust: number,
  callback: (predicciones: { clase: string; score: number }[]) => void
) => {
  if (model == null || model.inputShape == undefined) {
    console.error("Modelo no cargado o forma de entrada no definida.");
    return;
  }

  // Verificar si el elemento de video está listo y tiene un tamaño válido
  if (source instanceof HTMLVideoElement) {
    if (source.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA || source.videoWidth === 0 || source.videoHeight === 0) {
      console.error("El video no está listo o no tiene un tamaño válido.");
      return;
    }
  }

  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3); // Obtener ancho y alto del modelo

  tf.engine().startScope(); // Iniciar scope de TensorFlow.js
  const [input] = preprocess(source, modelWidth, modelHeight); // Preprocesar imagen

  // Verificar si el tensor de entrada es nulo
  if (!input) {
    console.error("El tensor de entrada es inválido.");
    return;
  }

  const res = model.net.execute(input) as tf.Tensor<tf.Rank>; // Ejecutar inferencia

  const transRes = res.transpose([0, 2, 1]); // Transponer resultados
  const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze(0); // Extraer scores

  const scores = [] as number[];
  for (let i = 0; i < numClass; i++) {
    scores.push(
      rawScores.slice([0, i], [-1, 1]).flatten().max().arraySync() as number
    );
  }

  // Filtrar predicciones con baja confianza (score < allowedTrust)
  const predictions = scores
    .map((score, i) => ({
      clase: labels[i],
      score: Math.ceil(score * 100),
    }))
    .filter((pred) => pred.score >= allowedTrust); // Solo considerar predicciones con score >= allowedTrust

  if (predictions.length > 0) {
    callback(predictions);
  } else {
    console.log("No se detectaron manos en el fotograma.");
    callback([]); // Enviar un array vacío si no hay detecciones válidas
  }

  // Liberar tensores
  tf.dispose([res, transRes, rawScores, input]);
  tf.engine().endScope(); // Finalizar scope de TensorFlow.js
};

export const detectVideo = (
  vidSource: HTMLVideoElement,
  model: { net: tf.GraphModel; inputShape: number[] },
  canvasRef: HTMLCanvasElement,
  allowedTrust: number,
  callback: (predicciones: { clase: string; score: number }[]) => void
) => {
  let intervalId: number | null = null;
  let isProcessing = false;
  let isStopped = false; // Nueva bandera para controlar el estado

  const detectFrame = async () => {
    if (isStopped || isProcessing) return; // Verificar si está detenido
    isProcessing = true;

    try {
      // Verificar si el video sigue siendo válido
      if (vidSource.videoWidth === 0 || vidSource.videoHeight === 0 || vidSource.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
        console.log("Video no listo, omitiendo fotograma.");
        return;
      }

      await detectAllClasses(vidSource, model, canvasRef, allowedTrust, callback);
    } catch (error) {
      console.error("Error durante la detección:", error);
    } finally {
      isProcessing = false;
    }
  };

  intervalId = window.setInterval(detectFrame, 1000);
  console.log("Detección iniciada.");

  const stopDetection = () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
      isStopped = true; // Marcar como detenido
      console.log("Detección detenida.");
    }
  };

  return stopDetection;
};