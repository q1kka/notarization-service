import app from "./app";

const notarizationPort = process.env.PORT || 5000;

export const start = () => {
  app.listen(notarizationPort, () => {
    console.log(`API Server listening on port: ${notarizationPort}`);
  });
};

export const stop = () => {
  app.close(notarizationPort, () => {
    console.log("API Server stopped");
  });
};
