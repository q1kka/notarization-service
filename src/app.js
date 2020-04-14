/*
 * Main entry point for application
 * Initializes both IPFS and the connection to eth-node with web3
 */

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import notarization from "./routes";

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.use("/api/v1/notarization", notarization);
app.use("/api/v1/files", express.static(`public`));

app.all("*", (req, res) => {
  return res.sendStatus(404);
});

export default app;
