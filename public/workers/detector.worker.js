// ✅ ESTO SÍ FUNCIONA EN PUBLIC/
importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs");


let model = null;
let labels = [];
let inputShape = [1, 416, 416, 3]; // Default por si no se obtiene bien

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === "init") {
    try {
      console.log("📦 Cargando modelo desde:", data.modelUrl);
      model = await tf.loadGraphModel(data.modelUrl);
      inputShape = model.inputs[0].shape;
      labels = data.labels;

      postMessage({
        type: "ready",
        inputShape
      });
    } catch (error) {
      postMessage({
        type: "error",
        message: error.message || "Error cargando el modelo"
      });
    }
  }

  if (type === "detect" && model) {
    tf.engine().startScope();

    try {
      const { imageData, allowedTrust } = data;

      const img = tf.browser.fromPixels(imageData);
      const [h, w] = img.shape.slice(0, 2);
      const maxSize = Math.max(w, h);

      const imgPadded = img.pad([
        [0, maxSize - h],
        [0, maxSize - w],
        [0, 0]
      ]);

      const input = tf.image
        .resizeBilinear(imgPadded, inputShape.slice(1, 3))
        .div(255.0)
        .expandDims(0);

      const res = model.execute(input);
      const transRes = res.transpose([0, 2, 1]);
      const numClass = labels.length;
      const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze([0]);

      const rawScoresData = await rawScores.data();

      const scores = [];
      for (let i = 0; i < numClass; i++) {
        let max = -Infinity;
        for (let j = 0; j < rawScores.shape[0]; j++) {
          const index = j * numClass + i;
          if (rawScoresData[index] > max) {
            max = rawScoresData[index];
          }
        }
        scores.push(max);
      }

      const predictions = scores
        .map((score, i) => ({
          clase: labels[i],
          score: Math.ceil(score * 100)
        }))
        .filter((pred) => pred.score >= allowedTrust);

      postMessage({
        type: "result",
        predictions
      });

      tf.dispose([res, transRes, rawScores, input, img, imgPadded]);
    } catch (error) {
      postMessage({
        type: "error",
        message: error.message || "Error durante la inferencia"
      });
    }

    tf.engine().endScope();
  }
};
