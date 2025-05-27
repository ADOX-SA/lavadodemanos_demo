
export type InitMessage = {
  type: "init";
  data: {
    modelUrl: string;
    labels: string[];
  };
};

export type DetectMessage = {
  type: "detect";
  data: {
    imageData: ImageData;
    allowedTrust: number;
  };
};

export type WorkerRequest = InitMessage | DetectMessage;

export type ReadyMessage = {
  type: "ready";
  inputShape: number[];
};

export type ResultMessage = {
  type: "result";
  predictions: Prediction[];
};

export type ErrorMessage = {
  type: "error";
  message: string;
};

export type WorkerResponse = ReadyMessage | ResultMessage | ErrorMessage;

export type Prediction = {
  clase: string;
  score: number;
};
