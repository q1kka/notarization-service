/*
* Main entry point for application
* Initializes both IPFS and the connection to eth-node with web3
*/

import express from 'express';

//Import middleware
import cors from 'cors';
import bodyParser from 'body-parser';

//Import routes
import notarization from '../routes/notarization';

// Initiate api server
const notarizationServer = express();
const notarizationPort = process.env.NOTARIZATION_PORT || 5000;

// Log with timestamp
const logToConsole = text => {
  console.log(`${new Date().toLocaleString()} - ${text}`);
};

//Middlewares
notarizationServer.use(cors());
notarizationServer.use(bodyParser.json());

//Define API routes. Define new versions in different routes to achieve backwards compatibility in integrations.
notarizationServer.use('/api/notarization', notarization);
//define route for files
notarizationServer.use('/files', express.static(`public`));

//Catch all other routes
notarizationServer.all('*', (req, res) => {
  return res.sendStatus(404);
});

export const start = () => {
  notarizationServer.listen(notarizationPort, () => {
    logToConsole('API Server started');
    logToConsole(`API Server listening on port: ${notarizationPort}`);
  });
};

export const stop = () => {
  notarizationServer.close(notarizationPort, () => {
    logToConsole('API Server stopped');
  });
};
