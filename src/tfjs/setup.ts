import * as tf from "@tensorflow/tfjs";
import { RefObject } from "react";
import Webcam from "react-webcam";

export const detect = async (
  model: tf.GraphModel,
  webcam: RefObject<Webcam | null>,
  canvas: RefObject<HTMLCanvasElement | null>
) => {
  if (
    webcam != null &&
    canvas != null &&
    typeof webcam.current != "undefined" &&
    webcam.current != null &&
    webcam.current.video &&
    webcam.current.video.readyState === 4
  ) {
    // Get Video Properties
    const video = webcam.current.video;
    const canva = canvas.current;
    if (canva == null) {
      console.log("canvas is null");
      return;
    }
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    // Set video width
    video.width = videoWidth;
    video.height = videoHeight;
    // Set canvas width
    canva.width = videoWidth;
    canva.height = videoHeight;
    const tensor = tf.browser.fromPixels(video);
    const resizedTensor = tf.image
      .resizeBilinear(tensor, [videoWidth, videoHeight])
      .div(255);
    const tensorWithBatchSize = resizedTensor.expandDims(0);
    // Make Detections
    const output = await model.executeAsync(tensorWithBatchSize);
    const boxes = output;
    // const scores = output[1].arraySync();
    // const classes = output[2].dataSync();

    console.log(boxes);
    // Draw mesh
    // const ctx = canva.getContext("2d");
    // if (ctx == null) {
    //   console.log("context is null");
    //   return;
    // }

    //obtener la prediccion paar saber que paso es el que se esta dibujando
    // let predictionValues;
    // if (Array.isArray(predictions)) {
    //   predictionValues = await Promise.all(
    //     predictions.map((pred) => pred.)
    //   );
    // } else if (predictions instanceof tf.Tensor) {
    //   predictionValues = await predictions.data();
    // } else {
    //   predictionValues = Object.values(predictions).map(
    //     async (pred) => await pred.data()
    //   );
    //   predictionValues = await Promise.all(predictionValues);
    // }

    // console.log(predictionValues);
  }
};
